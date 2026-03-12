class Boss extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.maxHp = 20;
      this.hp = this.maxHp;

      // Boss 状态机
      this.state = "IDLE"; // IDLE, SHOOT, FLOOD, SUMMON
      this.stateTimer = 0;
      this.purified = false;

      this.floodHeight = 50;
   }

   update(level, gm) {
      if (this.purified) return;

      this.stateTimer++;

      // 简易状态机轮转逻辑
      switch (this.state) {
         case "IDLE":
            // 休息 2 秒 (假设 60 帧/秒)
            if (this.stateTimer > 120) {
               this._chooseNextAttack();
            }
            break;

         case "SHOOT":
            if (this.stateTimer === 20 || this.stateTimer === 40 || this.stateTimer === 60) {
               let targetX = gm.player.cx();
               let targetY = gm.player.cy();

               // 【修改点】：把 this.cy() 改为 this.y - 5，让子弹从 Boss 头顶偏上一点的地方发射，防止瞬间撞地！
               gm.entities.push(new ToxicBullet(this.cx(), this.y - 5, targetX, targetY));
            }

            if (this.stateTimer > 100) {
               this._enterState("IDLE");
            }
            break;

         case "FLOOD":
            // 技能刚开始，立刻给玩家文字警告
            if (this.stateTimer === 1) {
               gm.player.setPrompt('ROOF!');
            }

            // 【修改】：把伤害判定的开始时间推迟到 180帧 (警告 2秒 + 上涨 1秒)
            // 结束时间推迟到 360 帧
            if (this.stateTimer > 180 && this.stateTimer < 360) {
               if (gm.player.y + gm.player.h > level.mapH - this.floodHeight) {
                  if (gm.player.invulnerableTimer <= 0) {
                     gm.player.takeDamage(1, gm);
                     gm.player.knockTimer = GameConfig.Player.KnockInterval;
                     gm.player.vy = -3;
                  }
               }
            }

            // 【修改】：整个技能的持续时间延长到 420 帧 (7秒)
            if (this.stateTimer > 420) {
               this._enterState("IDLE");
            }
            break;
      }
   }

   _chooseNextAttack() {
      // 随机或者按顺序挑选下一个攻击方式
      let attacks = ["SHOOT", "FLOOD"];
      let next = attacks[Math.floor(Math.random() * attacks.length)];
      this._enterState(next);
   }

   _enterState(newState) {
      this.state = newState;
      this.stateTimer = 0;
   }

   // 玩家用绳索攻击 Boss 扣血
   onRopeContact(rope, player, gm) {
      if (this.purified) return;
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      // Boss 受到伤害
      this.hp -= player.attackDmg;
      player.reduceCleanEnergy(GameConfig.Player.AttackConsume);
      gm.addParticles(this.cx(), this.cy(), 10); // 爆大团粒子

      if (rope.state === "EXTENDING") rope.state = "RETRACTING";

      if (this.hp <= 0) {
         this.destroy();
         // 触发游戏胜利或掉落大量清洁能量
      }
   }

   // 【修改点】：增加 level 参数
   display(level) {
      if (this.purified) {
         fill(100, 255, 100, this.alpha);
      } else {
         if (this.state === "SHOOT") fill(255, 0, 0);
         else fill(150, 0, 150);
      }

      rect(this.x, this.y, this.w, this.h);

      if (!this.purified) {
         fill(255, 0, 0);
         rect(this.x, this.y - 15, this.w * (this.hp / this.maxHp), 8);
      }

      // ================= 【精准渲染毒水】 =================
      if (this.state === "FLOOD" && !this.purified) {
         let floodH = 0;
         let maxFlood = this.floodHeight;

         // 1. 警告期 (0-120帧): 底部出现闪烁的红色警告线
         if (this.stateTimer < 120 && level) {
            push();
            // 每 10 帧闪烁一次
            if (Math.floor(this.stateTimer / 10) % 2 === 0) {
               stroke(255, 0, 0, 200);
               strokeWeight(6);
               line(0, level.mapH - 3, level.mapW, level.mapH - 3);
            }
            pop();
         }
         // 2. 上涨期 (120-180帧)
         else if (this.stateTimer >= 120 && this.stateTimer < 180) {
            floodH = ((this.stateTimer - 120) / 60) * maxFlood;
         }
         // 4. 消退期 (360-420帧)
         else if (this.stateTimer >= 360 && this.stateTimer <= 420) {
            floodH = ((420 - this.stateTimer) / 60) * maxFlood;
         }
         // 3. 满水期 (180-360帧)
         else {
            floodH = maxFlood;
         }

         // 真正画出上涨/满水/消退状态的毒水
         if (floodH > 0 && level) {
            push();
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
}
