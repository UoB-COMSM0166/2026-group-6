class Enemy extends Entity {
   /**
    * @param {number} x
    * @param {number} y
    * @param {number} w
    * @param {number} h
    * @param {Object} [spawnData]  LDtk 原始数据
    * @param {LevelManager} level  用于出生位置修正
    */
   constructor(x, y, w, h, spawnData, level) {
      super(x, y, w, h, spawnData);
      const G = GameConfig.World.GRID_SIZE;

      this.damage = spawnData.damage;
      this.jumpTime = 0;
      this.maxHp = spawnData.hp;
      this.hp = this.maxHp;
      this.purified = false;
      this.alpha = 255;

      this.dir = 1;
      this.speed = GameConfig.Enemy.SPEED;
      this.vy = 0;
      this.grounded = false;
      this.jumpForce = -0.8 * GameConfig.Enemy.JUMPFORCE;

      // 动画
      this.animState = "WALK";
      this.animFrame = 0;
      this.animTick = 0;

      this.attackTimer = 0;
      this.attackCooldown = 0;
      this.hurtTimer = 0;

      this.punchSound = resources.sounds.enemy.punch;
      this.purifySound = resources.sounds.purify;

      this.footOffsetY = 3;
      this.spriteCfg = {
         frameW: 96,
         frameH: 96,
         walkFrames: 8,
         attackFrames: 8,
         hurtFrames: 4,
         frameDelay: 6,
      };

      this.spriteCrop = {
         WALK: { x: 38, y: 44, w: 19, h: 16 },
         HURT: { x: 33, y: 35, w: 23, h: 24 },
         ATTACK: { x: 33, y: 44, w: 53, h: 45 },
      };

      // 出生防卡墙：使用空间查询
      let safety = 100;
      while (level.isRectOverlappingTile(this.x, this.y, this.w, this.h,
         { solidOnly: true, margin: 0.1 })
         && safety > 0) {
         this.y -= 1;
         safety--;
      }
   }

   /**
    * @param {LevelManager} level
    */
   update(level, gm) {
      // 死亡：直接消失
      if (this.hp <= 0) {
         this.destroy();
         return;
      }

      // 动画时间
      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.attackTimer > 0) this.attackTimer--;
      if (this.hurtTimer > 0) this.hurtTimer--;

      // --- Y 轴 ---
      this.vy += 0.1;
      let nextY = this.y + this.vy;
      this.grounded = false;

      // 空间查询: 只检测附近的固体
      let hitTileY = level.isRectOverlappingTile(this.x + 0.1, nextY, this.w - 0.2, this.h,
         { solidOnly: true, margin: 0 });
      if (hitTileY) {
         if (this.vy > 0) {
            this.y = hitTileY.y - this.h;
            this.grounded = true;
         } else if (this.vy < 0) {
            this.y = hitTileY.y + hitTileY.h;
         }
         this.vy = 0;
      } else {
         this.y += this.vy;
      }

      if (this.y > level.mapH) this.hp = 0;

      // --- X 轴 ---
      const G = GameConfig.World.GRID_SIZE;
      let nextX = this.x + this.speed * this.dir * 0.8;

      // 撞墙检测 (空间查询)
      let hitWall = false;
      hitWall = !!level.isRectOverlappingTile(nextX, this.y, this.w, this.h,
         { solidOnly: true, margin: 0.1 });

      // 悬崖检测: 利用 LevelManager 列查询
      let probeX = (this.dir === 1) ? (nextX + 0.5 * this.w + 0.1) : (nextX + 0.5 * this.w - 0.1);
      let feetRow = level.worldToGrid(0, this.y + this.h).row;
      let maxDropRow = level.worldToGrid(0, this.y + this.h + G * GameConfig.Enemy.DROP_DEPTH_TILES).row;
      let probeCol = level.worldToGrid(probeX, 0).col;

      let safeToDrop = level.hasSolidInColumn(probeCol, feetRow - 1, maxDropRow - 1);
      let aboutToFall = !safeToDrop;

      if (hitWall) {
         if (this.grounded) {
            this.vy = this.jumpForce;
            this.jumpTime += 1;
            this.grounded = false;
            if (this.jumpTime > 3) this._turn();
         } else {
            if (this.vy > 2.0) this._turn();
         }
      }
      else if (aboutToFall && this.grounded) {
         this._turn();
      }
      // 接近地图边缘转向
      else if (this._isCrossMap(level)) {
         this._turn();
      }
      else {
         this.x = nextX;
      }

      // 动画状态选择
      if (this.hurtTimer > 0) {
         this.animState = "HURT";
      } else if (this.attackTimer > 0) {
         this.animState = "ATTACK";
      } else {
         this.animState = "WALK";
      }

      this._tickAnim();

   }

   onPlayerContact(player, gm) {
      if (player.invulnerableTimer > 0) return;
      // The direction in which the player retreats
      let dir = (player.x < this.x) ? -1 : 1;
      if (this.dir * dir < 0) this._turn();
      // 触发攻击动画
      if (this.attackCooldown <= 0) {
         this.attackTimer = this.spriteCfg.attackFrames * this.spriteCfg.frameDelay;
         this.attackCooldown = 20;
         this.animFrame = 0;
         this.animTick = 0;
      }

      player.takeDamage(this.damage, gm);
      player.knockTimer = GameConfig.Player.KnockInterval;

      // repel
      player.repel(dir * 1.5, -2);
   }

   onRopeContact(rope, player, gm) {
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      // punch sound
      if (!this.punchSound.isPlaying()) this.punchSound.play();
      let dir = (player.x < this.x) ? 1 : -1;
      this.repel(dir * this.w * 0.5, 0);
      this.takeDamage(1);
      player.reduceCleanEnergy(GameConfig.Player.AttackConsume);
      gm.addParticles(this.cx(), this.cy());

      if (rope.state !== "RETRACTING") rope.state = "RETRACTING";
   }

   takeDamage(n) {
      this.hp -= n;

      if (this.hp > 0) {
         this.hurtTimer = this.spriteCfg.hurtFrames * this.spriteCfg.frameDelay;
         this.animFrame = 0;
         this.animTick = 0;
      }

      if (this.hp <= 0) {
         if (!this.purifySound.isPlaying()) this.purifySound.play();
         this.purified = true;
         this.destroy();
      }
   }

   get isDead() { return this.hp <= 0; }



   // 超出地图
   _isCrossMap(level) {
      let nextX = this.x + this.speed * this.dir * 0.8;
      const G = GameConfig.World.GRID_SIZE;
      let margin = G * 0.5;
      return ((this.dir === -1 && nextX < margin) ||
         (this.dir === 1 && nextX + this.w > level.mapW - margin));
   }

   _turn() {
      this.dir *= -1;
      this.jumpTime = 0;
   }

   repel(repelX, repelY) {
      this.x += repelX;
      this.y += repelY;
   }

   _tickAnim() {
      const cfg = this.spriteCfg;
      this.animTick++;

      if (this.animTick % cfg.frameDelay === 0) {
         const maxFrames =
            (this.animState === "HURT") ? cfg.hurtFrames :
               (this.animState === "ATTACK") ? cfg.attackFrames :
                  cfg.walkFrames;

         this.animFrame = (this.animFrame + 1) % maxFrames;
      }
   }

   _drawShape() {
      const slime = resources?.images?.enemy?.slime;
      if (!slime) {
         fill(255, 0, 0);
         noStroke();
         rect(this.x, this.y, this.w, this.h);
         return;
      }

      const cfg = this.spriteCfg;

      let sheet = slime.walk;
      if (this.animState === "ATTACK") sheet = slime.attack;
      if (this.animState === "HURT") sheet = slime.hurt;
      if (!sheet) return;

      const cols = Math.floor(sheet.width / cfg.frameW) || 1;
      const f = this.animFrame;

      const frameX = (f % cols) * cfg.frameW;
      const frameY = Math.floor(f / cols) * cfg.frameH;

      const crop = this.spriteCrop?.[this.animState] ||
         { x: 0, y: 0, w: cfg.frameW, h: cfg.frameH };
      const srcX = frameX + crop.x;
      const srcY = frameY + crop.y;
      const srcW = crop.w;
      const srcH = crop.h;


      let dw = 16, dh = 16;
      if (this.animState === "ATTACK") { dw = 40; dh = 36; }
      if (this.animState === "HURT") { dw = 18; dh = 19; }

      const dx = this.x + (this.w - dw) / 2;

      let dy = this.y + this.h - 16 + (this.footOffsetY || 0);
      if (this.animState === "ATTACK") dy -= 2.15; // footoffset
      if (this.animState === "HURT") dy -= 2.3; // footoffset

      push();
      if (this.dir === -1) {
         translate(dx + dw, dy);
         scale(-1, 1);
         image(sheet, 0, 0, dw, dh, srcX, srcY, srcW, srcH);
      } else {
         image(sheet, dx, dy, dw, dh, srcX, srcY, srcW, srcH);
      }
      pop();
   }


}
