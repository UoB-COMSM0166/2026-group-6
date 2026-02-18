class Player {
   constructor(x, y) {
      const G = GameConfig.World.GRID_SIZE;
      this.maxHp = GameConfig.Player.MAX_HP;
      this.hp = this.maxHp;
      this.invulnerableTimer = 0;
      this.knockTimer = 0;

      this.x = x;
      this.y = y;
      this.w = G;
      this.h = G;
      this.vx = 0;
      this.vy = 0;
      this.cleanEnergy = 100;
      this.grounded = false;

      this.ropeL = new Rope(color(0, 255, 255));
      this.ropeR = new Rope(color(255, 100, 100));
   }

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   // ====== 主更新 ======

   /**
    * @param {GameManager} gm  游戏管理器引用 (访问 gm.level, gm.enemies)
    */
   update(gm) {
      this._tickTimers();
      this._handleWinch();
      this._applyPhysics(gm.level);
      this._resolveWorld(gm.level);
      this._checkEnemyHit(gm);
      this._checkToxicPool(gm);
   }

   // ====== 输入 ======

   _tickTimers() {
      if (this.invulnerableTimer > 0) this.invulnerableTimer--;
      if (this.knockTimer > 0) this.knockTimer--;
   }

   _handleWinch() {
      const G = GameConfig.World.GRID_SIZE;
      let cs = G * GameConfig.Player.CLIMB_SPEED;
      let wf = GameConfig.Player.WINCH_FORCE;

      if (this.ropeL.state === "SWINGING") {
         if (keyIsDown(81)) { // Q
            this.ropeL.changeLength(-cs);
            let tgt = this.ropeL.nodes[0] || this.ropeL.anchor;
            let a = atan2(tgt.y - this.cy(), tgt.x - this.cx());
            this.vx += cos(a) * wf;
            this.vy += sin(a) * wf;
         }
         if (keyIsDown(90)) this.ropeL.changeLength(cs); // Z
      }

      if (this.ropeR.state === "SWINGING") {
         if (keyIsDown(69)) { // E
            this.ropeR.changeLength(-cs);
            let tgt = this.ropeR.nodes[0] || this.ropeR.anchor;
            let a = atan2(tgt.y - this.cy(), tgt.x - this.cx());
            this.vx += cos(a) * wf;
            this.vy += sin(a) * wf;
         }
         if (keyIsDown(67)) this.ropeR.changeLength(cs); // C
      }
   }

   // ====== 物理 ======

   /**
    * @param {LevelManager} level
    */
   _applyPhysics(level) {
      if (this.grounded) {
         this.vx *= GameConfig.World.FrictionalForce; // 摩擦力
      }
      else {
         this.vx *= GameConfig.World.AirFrictionalForce; // 摩擦力
      }
      this.vy += GameConfig.World.GRAVITY;

      // 绳索物理 (传入 LevelManager)
      this.ropeL.update(this, level);
      this.ropeR.update(this, level);
      this.ropeL.applyPhysics(this);
      this.ropeR.applyPhysics(this);
   }

   /**
    * @param {LevelManager} level
    */
   _resolveWorld(level) {
      const G = GameConfig.World.GRID_SIZE;
      const maxStep = G * 0.3; // 每次判断的步数最多半格

      // 收集绳索碰撞盒
      let heldRopes = [];
      if (this.ropeL.state === "SWINGING" && this.ropeL.material === 'HARD') heldRopes.push(this.ropeL);
      if (this.ropeR.state === "SWINGING" && this.ropeR.material === 'HARD') heldRopes.push(this.ropeR);

      // X轴分步检测
      let stepsX = Math.ceil(Math.abs(this.vx) / maxStep);
      let dx = this.vx / stepsX;
      for (let i = 0; i < stepsX; i++) {
         this.x += dx;
         this._resolve(true, level, heldRopes);
      }

      // Y轴分步检测
      let stepsY = Math.ceil(Math.abs(this.vy) / maxStep);
      let dy = this.vy / stepsY;
      for (let i = 0; i < stepsY; i++) {
         this.y += dy;
         this._resolve(false, level, heldRopes);
      }
   }

   /**
    * AABB 碰撞分离
    *
    * ★ 核心优化: 使用 level.getSolidTilesInRect() 替代遍历全部 solidPlatforms
    *   之前: for (let p of solidPlatforms) → O(地图格子总数)
    *   现在: 只检测玩家包围盒附近 ~9-16 格 → O(1)
    */
   _resolve(onX, level, ignoredRopes) {
      this.grounded = false;

      // ★ 空间查询: 获取玩家附近的固体 Tile
      let colliders = level.getSolidTilesInRect(this.x, this.y, this.w, this.h, 1);

      // 追加硬绳碰撞盒
      if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
         colliders = colliders.concat(this.ropeL.getCollisionBoxes());
      }
      if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
         colliders = colliders.concat(this.ropeR.getCollisionBoxes());
      }

      // AABB 分离
      for (let p of colliders) {
         if (!Physics.rectIntersect(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) continue;

         let phW = this.w / 2, phH = this.h / 2;
         let ppW = p.w / 2, ppH = p.h / 2;
         let dx = (this.x + phW) - (p.x + ppW);
         let dy = (this.y + phH) - (p.y + ppH);
         // 计算X/Y轴的重叠量（oX：X轴重叠像素，oY：Y轴重叠像素）
         let oX = (phW + ppW) - abs(dx);
         let oY = (phH + ppH) - abs(dy);
         //无重叠
         if (oX <= 0 || oY <= 0) continue;
         // 根据偏移量大小优先处理偏移量大的轴
         if (oX < oY) {
            if (onX) {
               this.x += (dx > 0) ? oX : -oX;
               this.vx = 0;
            }
         } else {
            if (!onX) {
               if (dy > 0) {
                  this.y += oY;
               } else {
                  this.y -= oY;
                  this.grounded = true;
               }
               this.vy = 0;
            }
         }
      }

      // 额外着地检测 (站立时)
      if (!onX) {
         this.grounded = false;
         // ★ 只查脚底下方的一排格子
         let footColliders = level.getSolidTilesInRect(this.x, this.y + this.h - 2, this.w, 8, 0);
         // 追加硬绳碰撞盒
         if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
            footColliders = footColliders.concat(this.ropeL.getCollisionBoxes());
         }
         if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
            footColliders = footColliders.concat(this.ropeR.getCollisionBoxes());
         }
         for (let p of footColliders) {
            if (this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2 &&
               this.y + this.h >= p.y - 1 && this.y + this.h <= p.y + 5) {
               this.grounded = true;
               break;
            }
         }
      }
   }

   // ====== 敌人碰撞 ======

   _checkEnemyHit(gm) {
      if (this.invulnerableTimer > 0) return;
      for (let e of gm.enemies) {
         if (Physics.rectIntersect(this.x, this.y, this.w, this.h, e.x, e.y, e.w, e.h)) {
            this._takeDamage(e, gm);
            break;
         }
      }
   }

   _takeDamage(enemy, gm) {
      this.hp -= enemy.damage;
      if (this.hp <= 0) { this.die(gm); return; }
      this.invulnerableTimer = GameConfig.Player.InvulInterval;
      this.knockTimer = GameConfig.Player.KnockInterval;
      let dir = (this.x < enemy.x) ? -1 : 1;
      this.vx = dir * 3;
      this.vy = -2;
   }

   _reduceCleanEnergy(number) {
      this.cleanEnergy -= number;
   }

   // 碰到毒池
   _checkToxicPool(gm) {
      if (this._isOverlappingToxicPool(gm.level)) {
         this.die(gm);
      }
   }

   _isOverlappingToxicPool(level) {
      let m = 0.1;
      let tiles = level.getTilesInRect(this.x + m, this.y + m, this.w - m * 2, this.h - m * 2, 0);
      for (let t of tiles) {
         if (Physics.rectIntersect(
            this.x + m, this.y + m, this.w - m * 2, this.h - m * 2,
            t.x, t.y, t.w, t.h) && t.type === GameConfig.Entity.ToxicPool) {
            return true;
         }
      }
      return false;
   }

   // ====== 动作 ======

   fireRope(side, tx, ty) {
      if (side === "LEFT") this.ropeL.fire(this.cx(), this.cy(), tx, ty);
      if (side === "RIGHT") this.ropeR.fire(this.cx(), this.cy(), tx, ty);
   }

   move(dir) {
      let f = this.grounded ? GameConfig.Player.SPEED : GameConfig.Player.SPEED * 0.7;
      this.vx += dir * f;
   }

   jump() {
      let jf = -GameConfig.Player.JUMPFORCE;
      if (this.grounded) {
         this.vy = jf;
      } else if (this.ropeL.state === "SWINGING" || this.ropeR.state === "SWINGING") {
         this.vy = jf * 0.5;
         this.vx *= 1.2;
      }
   }

   die(gm) {
      gm.status = "GAMEOVER";
      this.invulnerableTimer = 0;
      this.knockTimer = 0;
   }

   // ====== 渲染 ======

   display(camera, scale) {
      const G = GameConfig.World.GRID_SIZE;
      noStroke();
      fill(this.knockTimer > 0 ? color(255, 100, 100) : 255);
      rect(this.x, this.y, this.w, this.h);

      // 眼睛跟随鼠标
      fill(0);
      let wm = camera.screenToWorld(mouseX, mouseY, scale);
      let a = atan2(wm.y - this.cy(), wm.x - this.cx());
      let off = G * 0.3, sz = max(1, G * 0.25);
      rect(this.cx() + cos(a) * off - sz / 2,
         this.cy() + sin(a) * off - sz / 2, sz, sz);
   }
}
