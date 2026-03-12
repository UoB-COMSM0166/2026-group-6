class Boss extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);

      //Boss 整体缩放系数
      this.scaleSize = 0.5;

      // 根据缩放系数计算真实的物理碰撞盒
      let realW = 42 * this.scaleSize; 
      let realH = 48 * this.scaleSize; 
      
      this.x = this.x + (this.w - realW) / 2;
      this.y = this.y + (this.h - realH);
      
      this.w = realW;
      this.h = realH;

      this.maxHp = 20;
      this.hp = this.maxHp;

      // 状态机
      this.state = "IDLE"; 
      this.stateTimer = 0;
      this.purified = false;

      this.floodHeight = 50;

      // 动画与朝向属性
      this.dir = -1; // -1左, 1右
      this.animFrame = 0;
      this.animTick = 0;
      this.hurtTimer = 0;

      //垂直速度
      this.vy = 0;

      // ================= 【精准匹配你的素材】 =================
      this.spriteCfg = {
         frameW: 64,       // 绝大多数动作的单格宽度是 64
         frameH: 64,       // 所有动作的单格高度都是 64
         
         idleFrames: 7,    
         moveFrames: 4,    
         hurtFrames: 7,    
         shootFrames: 17,  // 射击: 17帧 (代码里会自动将宽度设为 128)
         deathFrames: 12,  
         
         frameDelay: 6,    
      };
   }

   update(level, gm) {
      if (this.purified) return;

      this.stateTimer++;

      // 1. 死亡状态拦截
      if (this.state === "DEATH") {
         this._tickAnim();
         return;
      }

      // 使用 AABB 矩形碰撞检测
      let isColliding = (
         gm.player.x < this.x + this.w &&
         gm.player.x + gm.player.w > this.x &&
         gm.player.y < this.y + this.h &&
         gm.player.y + gm.player.h > this.y
      );

      // 如果碰到了，且玩家当前不在无敌帧（闪烁）状态
      if (isColliding && gm.player.invulnerableTimer <= 0) {
         gm.player.takeDamage(2, gm); // 扣除玩家 1 点生命值
         gm.player.knockTimer = GameConfig.Player.KnockInterval; // 触发受击硬直/无敌帧
         
         // 给玩家一个受击被弹开的物理效果
         gm.player.vy = -4; // 向上击飞
         // 判断玩家在 Boss 的左边还是右边，决定向哪边弹开
         gm.player.vx = (gm.player.cx() < this.cx()) ? -3 : 3; 
      }

      // 给 Boss 施加重力
      this.vy += 0.2; 
      let nextY = this.y + this.vy;

      // 检测脚下/头顶是否有固体方块
      let hitTileY = level.isRectOverlappingTile(this.x + 0.1, nextY, this.w - 0.2, this.h, { solidOnly: true, margin: 0 });
      
      if (hitTileY) {
         if (this.vy > 0) {
            // 落地，踩在方块上方
            this.y = hitTileY.y - this.h; 
         } else if (this.vy < 0) {
            // 顶到天花板
            this.y = hitTileY.y + hitTileY.h; 
         }
         this.vy = 0; // 撞到东西后垂直速度归零
      } else {
         // 没撞到东西，自由下落
         this.y += this.vy;
      }

      // 2. 倒计时受击状态
      if (this.hurtTimer > 0) this.hurtTimer--;

      // 3. 让 Boss 始终面向玩家 (但在 FLOOD 放水时彻底锁定朝向，不转身)
      if (this.state !== "FLOOD") {
         this.dir = (gm.player.cx() < this.cx()) ? -1 : 1;
      }
      this._tickAnim();

      // 4. 状态机轮转逻辑
      switch (this.state) {
         case "IDLE":
            if (this.stateTimer > 100) {
               this._chooseNextAttack();
            }
            break;

         case "MOVE":
            if (this.stateTimer < 120) {
               let speed = 0.5; 
               let nextX = this.x + this.dir * speed;
               
               // 预测下一步会不会撞墙
               let hitWall = level.isRectOverlappingTile(nextX, this.y, this.w, this.h, { solidOnly: true, margin: 0.1 });
               
               if (!hitWall) {
                  this.x = nextX; // 前方没墙，正常水平移动
               } else {
                  //遇墙起跳
                  // 如果撞墙了，并且 Boss 当前正踩在地上
                  if (this.vy === 0) {
                     // 跳跃高度
                     this.vy = -4.5; 
                  }
               }
            } else {
               this._enterState("IDLE");
            }
            break;

         case "SHOOT":
            // 在第 30, 60, 90 帧发射子弹
            if (this.stateTimer === 30 || this.stateTimer === 60 || this.stateTimer === 90) {
               let targetX = gm.player.cx();
               let targetY = gm.player.cy();
               gm.entities.push(new ToxicBullet(this.cx(), this.y - 5, targetX, targetY));
            }

            if (this.stateTimer > 110) {
               this._enterState("IDLE");
            }
            break;

         case "FLOOD":
            if (this.stateTimer === 1) gm.player.setPrompt('ROOF!');
            if (this.stateTimer > 180 && this.stateTimer < 360) {
               if (gm.player.y + gm.player.h > level.mapH - this.floodHeight) {
                  if (gm.player.invulnerableTimer <= 0) {
                     gm.player.takeDamage(1, gm);
                     gm.player.knockTimer = GameConfig.Player.KnockInterval;
                     gm.player.vy = -3;
                  }
               }
            }
            if (this.stateTimer > 420) {
               this._enterState("IDLE");
            }
            break;
      }
   }

   _chooseNextAttack() {
      let attacks = ["SHOOT", "FLOOD", "MOVE"];
      let next = attacks[Math.floor(Math.random() * attacks.length)];
      this._enterState(next);
   }

   _enterState(newState) {
      this.state = newState;
      this.stateTimer = 0;
      this.animFrame = 0;
      this.animTick = 0;
   }

   // 玩家用绳索攻击 Boss 扣血
   onRopeContact(rope, player, gm) {
      if (this.purified || this.state === "DEATH") return;
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      this.hp -= player.attackDmg;
      player.reduceCleanEnergy(GameConfig.Player.AttackConsume);
      gm.addParticles(this.cx(), this.cy(), 10); 

      if (rope.state === "EXTENDING") rope.state = "RETRACTING";

      if (this.hp <= 0) {
         this.hurtTimer = 0; 
         this._enterState("DEATH");
      } else {
         this.hurtTimer = this.spriteCfg.hurtFrames * this.spriteCfg.frameDelay; 
         this.animFrame = 0; 
         this.animTick = 0;
      }
   }

   // 动画帧计算
   _tickAnim() {
      const cfg = this.spriteCfg;
      this.animTick++;

      if (this.animTick % cfg.frameDelay === 0) {
         
         if (this.state === "DEATH") {
            if (this.animFrame < cfg.deathFrames - 1) {
               this.animFrame++; 
            } else {
               this.purified = true; 
               this.destroy(); 
            }
            return;
         }

         let maxFrames = cfg.idleFrames;
         if (this.hurtTimer > 0) {
            maxFrames = cfg.hurtFrames;
         } else {
            if (this.state === "SHOOT") maxFrames = cfg.shootFrames;
            if (this.state === "MOVE") maxFrames = cfg.moveFrames;
            // FLOOD 状态时默认 maxFrames = cfg.idleFrames，播放待机动画
         }

         this.animFrame = (this.animFrame + 1) % maxFrames;
      }
   }

   display(level) {
      if (this.purified) return;

      const bossImgs = resources?.images?.boss;
      
      // ================= 【1. 绘制 Boss 实体】 =================
      if (bossImgs) {
         let sheet = bossImgs.idle;
         
         if (this.state === "DEATH") {
            sheet = bossImgs.death;
         } else if (this.hurtTimer > 0) {
            sheet = bossImgs.hurt;
         } else {
            if (this.state === "SHOOT") sheet = bossImgs.shoot;
            if (this.state === "MOVE") sheet = bossImgs.move;
            if (this.state === "FLOOD") sheet = bossImgs.idle; // FLOOD 时使用待机贴图
         }

         if (sheet && sheet.width > 0) {
            const cfg = this.spriteCfg;
            
            // 射击动作有毒液，单格宽度是 128，其他都是 64
            const currentFrameW = (this.state === "SHOOT") ? 128 : cfg.frameW;
            const currentFrameH = cfg.frameH;

            const cols = Math.floor(sheet.width / currentFrameW) || 1;
            const f = this.animFrame;

            const srcX = (f % cols) * currentFrameW;
            const srcY = Math.floor(f / cols) * currentFrameH;

            // 让图片居中对齐到碰撞盒底部，基于主体 64 像素计算
            const baseW = 64; 
            const dx = this.x + (this.w - baseW) / 2;
            const offsetY = 8;
            const dy = this.y + this.h - currentFrameH + offsetY;

            push();
            
            // ================= 【核心修改：模型变红变透明】 =================
            if (this.state === "FLOOD") {
               // tint(R, G, B, Alpha)
               // 255, 100, 100 是一个相对柔和的暗红色（不是刺眼的纯红）
               // 200 是透明度（最大255），让它带有一点半透明效果
               tint(255, 100, 100, 200); 
            }
            // ==============================================================

            if (this.dir === -1) {
               translate(dx + baseW, dy);
               scale(-1, 1);
               image(sheet, 0, 0, currentFrameW, currentFrameH, srcX, srcY, currentFrameW, currentFrameH);
            } else {
               image(sheet, dx, dy, currentFrameW, currentFrameH, srcX, srcY, currentFrameW, currentFrameH);
            }
            
            // 绘制完成后必须清除 tint 效果，否则会影响整个游戏画面的其他图片！
            noTint(); 
            pop();
         }
      } else {
         // 降级方案（图片没加载出来时）
         if (this.state === "FLOOD") fill(255, 100, 100, 200);
         else fill(150, 0, 150);
         rect(this.x, this.y, this.w, this.h);
      }

      // ================= 【2. 绘制血条】 =================
      if (this.state !== "DEATH") {
         fill(255, 0, 0);
         rect(this.x, this.y - 15, this.w * (this.hp / this.maxHp), 8);
      }
   }

   // ================= 【新增：专门绘制覆盖层毒水的方法】 =================
   displayWater(level) {
      if (this.state !== "FLOOD") return; // 只有放水状态才画

      let floodH = 0;
      let maxFlood = this.floodHeight;

      if (this.stateTimer < 120 && level) {
         push();
         if (Math.floor(this.stateTimer / 10) % 2 === 0) {
            stroke(255, 0, 0, 200);
            strokeWeight(6);
            line(0, level.mapH - 3, level.mapW, level.mapH - 3);
         }
         pop();
      }
      else if (this.stateTimer >= 120 && this.stateTimer < 180) {
         floodH = ((this.stateTimer - 120) / 60) * maxFlood;
      }
      else if (this.stateTimer >= 360 && this.stateTimer <= 420) {
         floodH = ((420 - this.stateTimer) / 60) * maxFlood;
      }
      else {
         floodH = maxFlood;
      }

      if (floodH > 0 && level) {
         push();
         // 这里的颜色 fill(100, 0, 150, 180) 已经是一层透明的紫色了
         // 180 是透明度（最大255），你可以微调这个数字让毒水更透明或更浓
         fill(100, 0, 150, 180);
         noStroke();
         rect(0, level.mapH - floodH, level.mapW, floodH);

         stroke(200, 50, 255);
         strokeWeight(3);
         line(0, level.mapH - floodH, level.mapW, level.mapH - floodH);
         pop();
      }
   }
}