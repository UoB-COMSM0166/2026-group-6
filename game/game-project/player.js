class Player {
   constructor(x, y) {
      const GRID = GameConfig.World.GRID_SIZE;

      this.hp = GameConfig.Player.MAX_HP;
      this.invulnerableTimer = 0;
      this.knockTimer = 0;

      this.x = x;
      this.y = y;
      this.w = GRID;
      this.h = GRID;
      this.vx = 0;
      this.vy = 0;
      this.grounded = false;

      this.ropeL = new Rope(color(0, 255, 255));
      this.ropeR = new Rope(color(255, 100, 100));
   }

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   // ========== 主更新 ==========

   update(game) {
      this.updateTimers();
      this.handleMovementInput();
      this.handleRopeInput();
      this.applyPhysics(game);
      this.resolveWorldCollisions(game.solidPlatforms);
      this.checkEnemyCollision(game);
   }

   // ========== 输入处理 ==========

   updateTimers() {
      if (this.invulnerableTimer > 0) this.invulnerableTimer--;
      if (this.knockTimer > 0) this.knockTimer--;
   }

   handleMovementInput() {
      let moveForce = this.grounded ? GameConfig.Player.SPEED : GameConfig.Player.SPEED * 0.7;
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.vx -= moveForce;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.vx += moveForce;
   }

   handleRopeInput() {
      const GRID = GameConfig.World.GRID_SIZE;
      let climbSpeed = GRID * GameConfig.Player.CLIMB_SPEED;
      let winchForce = GameConfig.Player.WINCH_FORCE;

      // 左绳绞盘: Q 收缩, Z 释放
      if (this.ropeL.state === "SWINGING") {
         if (keyIsDown(81)) { // Q
            this.ropeL.changeLength(-climbSpeed);
            let targetNode = this.ropeL.nodes[0] || this.ropeL.anchor;
            let angle = atan2(targetNode.y - this.cy(), targetNode.x - this.cx());
            this.vx += cos(angle) * winchForce;
            this.vy += sin(angle) * winchForce;
         }
         if (keyIsDown(90)) this.ropeL.changeLength(climbSpeed); // Z
      }

      // 右绳绞盘: E 收缩, C 释放
      if (this.ropeR.state === "SWINGING") {
         if (keyIsDown(69)) { // E
            this.ropeR.changeLength(-climbSpeed);
            let targetNode = this.ropeR.nodes[0] || this.ropeR.anchor;
            let angle = atan2(targetNode.y - this.cy(), targetNode.x - this.cx());
            this.vx += cos(angle) * winchForce;
            this.vy += sin(angle) * winchForce;
         }
         if (keyIsDown(67)) this.ropeR.changeLength(climbSpeed); // C
      }
   }

   // ========== 物理与碰撞 ==========

   applyPhysics(game) {
      this.vx *= 0.85;
      this.vy += GameConfig.World.GRAVITY;

      // 绳索物理更新
      this.ropeL.update(this, game.solidPlatforms);
      this.ropeR.update(this, game.solidPlatforms);
      this.ropeL.applyPhysics(this);
      this.ropeR.applyPhysics(this);
   }

   resolveWorldCollisions(solidPlatforms) {
      // 构建碰撞体列表（含硬绳碰撞盒）
      let heldRopes = [];
      if (this.ropeL.state === "SWINGING" && this.ropeL.material === 'HARD') heldRopes.push(this.ropeL);
      if (this.ropeR.state === "SWINGING" && this.ropeR.material === 'HARD') heldRopes.push(this.ropeR);

      // X轴碰撞
      this.x += this.vx;
      this.resolveCollisions(true, solidPlatforms, heldRopes);

      // Y轴碰撞
      this.y += this.vy;
      this.resolveCollisions(false, solidPlatforms, heldRopes);
   }

   /**
    * AABB碰撞检测与分离
    * @param {boolean} onXAxis - 当前处理的是X轴还是Y轴
    * @param {Array} solidPlatforms - 固体平台列表
    * @param {Array} ignoredRopes - 被持有的绳子（不作为碰撞体）
    */
   resolveCollisions(onXAxis, solidPlatforms, ignoredRopes = []) {
      this.grounded = false;

      // 收集所有碰撞体：平台 + 硬绳碰撞盒
      let allColliders = [...solidPlatforms];
      if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
         allColliders = allColliders.concat(this.ropeL.getCollisionBoxes());
      }
      if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
         allColliders = allColliders.concat(this.ropeR.getCollisionBoxes());
      }

      // AABB碰撞分离
      for (let p of allColliders) {
         if (!Physics.rectIntersect(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) continue;

         let playerHalfW = this.w / 2, playerHalfH = this.h / 2;
         let platHalfW = p.w / 2, platHalfH = p.h / 2;

         let dx = (this.x + playerHalfW) - (p.x + platHalfW);
         let dy = (this.y + playerHalfH) - (p.y + platHalfH);

         let overlapX = (playerHalfW + platHalfW) - abs(dx);
         let overlapY = (playerHalfH + platHalfH) - abs(dy);

         if (overlapX <= 0 || overlapY <= 0) continue;

         if (overlapX < overlapY) {
            // 侧面碰撞
            if (onXAxis) {
               this.x += (dx > 0) ? overlapX : -overlapX;
               this.vx = 0;
            }
         } else {
            // 垂直碰撞
            if (!onXAxis) {
               if (dy > 0) {
                  this.y += overlapY; // 撞头
               } else {
                  this.y -= overlapY; // 落地
                  this.grounded = true;
               }
               this.vy = 0;
            }
         }
      }

      // 额外着地检测（站立时）
      if (!onXAxis) {
         this.grounded = false;
         for (let p of allColliders) {
            if (this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2 &&
               this.y + this.h >= p.y - 1 && this.y + this.h <= p.y + 5) {
               this.grounded = true;
               break;
            }
         }
      }
   }

   // ========== 敌人碰撞 ==========

   checkEnemyCollision(game) {
      if (this.invulnerableTimer > 0) return;
      for (let enemy of game.enemies) {
         if (Physics.rectIntersect(this.x, this.y, this.w, this.h, enemy.x, enemy.y, enemy.w, enemy.h)) {
            this.beDamaged(enemy, game);
            break;
         }
      }
   }

   beDamaged(enemy, game) {
      this.hp -= enemy.damage;
      if (this.hp <= 0) {
         this.die(game);
         return;
      }
      this.invulnerableTimer = GameConfig.Player.InvulInterval;
      this.knockTimer = GameConfig.Player.KnockInterval;
      let pushDir = (this.x < enemy.x) ? -1 : 1;
      this.vx = pushDir * 3;
      this.vy = -2;
   }

   // ========== 动作 ==========

   fireRope(side, tx, ty) {
      if (side === "LEFT") this.ropeL.fire(this.cx(), this.cy(), tx, ty);
      if (side === "RIGHT") this.ropeR.fire(this.cx(), this.cy(), tx, ty);
   }

   jump() {
      let jumpForce = -1 * GameConfig.Player.JUMPFORCE;
      if (this.grounded) {
         this.vy = jumpForce;
      } else if (this.ropeL.state === "SWINGING" || this.ropeR.state === "SWINGING") {
         // 空中摇摆时跳跃力减弱
         this.vy = jumpForce * 0.3;
         this.vx *= 1.2;
      }
   }

   die(game) {
      game.status = "GAMEOVER";
      this.invulnerableTimer = 0;
      this.knockTimer = 0;
   }

   // ========== 渲染 ==========

   display(camera, scale) {
      const GRID = GameConfig.World.GRID_SIZE;
      noStroke();

      // 受伤闪红
      fill(this.knockTimer > 0 ? color(255, 100, 100) : 255);
      rect(this.x, this.y, this.w, this.h);

      // 眼睛跟随鼠标
      fill(0);
      let worldMouse = camera.screenToWorld(mouseX, mouseY, scale);
      let angle = atan2(worldMouse.y - this.cy(), worldMouse.x - this.cx());
      let eyeOffset = GRID * 0.3;
      let eyeSize = max(1, GRID * 0.25);
      rect(
         this.cx() + cos(angle) * eyeOffset - eyeSize / 2,
         this.cy() + sin(angle) * eyeOffset - eyeSize / 2,
         eyeSize, eyeSize
      );
   }
}
