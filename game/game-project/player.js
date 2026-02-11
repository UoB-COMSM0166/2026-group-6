class Player {
   constructor(x, y) {
      // 初始位置 x,y是相对左上角的坐标
      this.x = x; this.y = y;
      // 玩家的长宽
      this.w = GRID_SIZE; this.h = GRID_SIZE;
      this.vx = 0; this.vy = 0; this.grounded = false;
      this.ropeL = new Rope(color(0, 255, 255));
      this.ropeR = new Rope(color(255, 100, 100));
   }

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   update() {
      //移动速度
      let moveForce = this.grounded ? 0.5 : 0.4;
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.vx -= moveForce;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.vx += moveForce;
      // 拉伸绳子速度
      let climbSpeed = GRID_SIZE * 0.05;
      // player 拽绳子的力度（抵抗重力this.vy的作用）
      let winchForce = 0.3;

      if (this.ropeL.state === "SWINGING") {
         if (keyIsDown(81)) {
            this.ropeL.changeLength(-climbSpeed);
            let targetNode = this.ropeL.nodes[0] || this.ropeL.anchor;
            let angle = atan2(targetNode.y - this.cy(), targetNode.x - this.cx());
            this.vx += cos(angle) * winchForce;
            this.vy += sin(angle) * winchForce;
         }
         if (keyIsDown(90)) this.ropeL.changeLength(climbSpeed);
      }

      if (this.ropeR.state === "SWINGING") {
         if (keyIsDown(69)) {
            this.ropeR.changeLength(-climbSpeed);
            let targetNode = this.ropeR.nodes[0] || this.ropeR.anchor;
            let angle = atan2(targetNode.y - this.cy(), targetNode.x - this.cx());
            this.vx += cos(angle) * winchForce;
            this.vy += sin(angle) * winchForce;
         }
         if (keyIsDown(67)) this.ropeR.changeLength(climbSpeed);
      }
      // 调节横竖轴变化速度
      this.vx *= 0.85;
      // 自由落体速度（重力）
      this.vy += 0.35;

      this.ropeL.update(this); this.ropeR.update(this);
      this.ropeL.applyPhysics(this); this.ropeR.applyPhysics(this);

      this.x += this.vx;
      let heldRopes = [];
      if (this.ropeL.state === "SWINGING" && this.ropeL.material === 'HARD') heldRopes.push(this.ropeL);
      if (this.ropeR.state === "SWINGING" && this.ropeR.material === 'HARD') heldRopes.push(this.ropeR);
      this.resolveCollisions(true, heldRopes);

      this.y += this.vy;
      this.resolveCollisions(false, heldRopes);
   }

   resolveCollisions(onXAxis, ignoredRopes = []) {
      this.grounded = false;
      let allColliders = [...platforms];
      if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
         allColliders = allColliders.concat(this.ropeL.getCollisionBoxes());
      }
      if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
         allColliders = allColliders.concat(this.ropeR.getCollisionBoxes());
      }

      for (let p of allColliders) {
         if (rectIntersect(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) {
            let playerHalfW = this.w / 2; let playerHalfH = this.h / 2;
            let platformHalfW = p.w / 2; let platformHalfH = p.h / 2;
            let playerCenter = { x: this.x + playerHalfW, y: this.y + playerHalfH };
            let platformCenter = { x: p.x + platformHalfW, y: p.y + platformHalfH };
            let dx = playerCenter.x - platformCenter.x; let dy = playerCenter.y - platformCenter.y;
            let minDistX = playerHalfW + platformHalfW; let minDistY = playerHalfH + platformHalfH;
            let overlapX = minDistX - abs(dx); let overlapY = minDistY - abs(dy);

            if (overlapX > 0 && overlapY > 0) {
               if (overlapX < overlapY) {
                  if (onXAxis) { if (dx > 0) this.x += overlapX; else this.x -= overlapX; this.vx = 0; }
               } else {
                  if (!onXAxis) {
                     if (dy > 0) { this.y += overlapY; this.vy = 0; }
                     else { this.y -= overlapY; this.vy = 0; this.grounded = true; }
                  }
               }
            }
         }
      }
      if (!onXAxis) {
         this.grounded = false;
         for (let p of allColliders) {
            if (this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2 &&
               this.y + this.h >= p.y - 1 && this.y + this.h <= p.y + 5) {
               this.grounded = true;
            }
         }
      }
   }

   fireRope(side, tx, ty) {
      if (side === "LEFT") {
         this.ropeL.fire(this.cx(), this.cy(), tx, ty);
      }
      if (side === "RIGHT") {
         this.ropeR.fire(this.cx(), this.cy(), tx, ty);
      }
   }

   jump() {
      let jumpForce = -5;
      if (this.grounded) {
         this.vy = jumpForce;
      }
      // 在空中摇晃中时的跳跃能力减弱
      else if (this.ropeL.state === "SWINGING" || this.ropeR.state === "SWINGING") {
         this.vy = jumpForce * 0.5;
         this.vx *= 1.2;
      }
      
   }

   display() {
      noStroke(); fill(255); rect(this.x, this.y, this.w, this.h);
      fill(0);
      let gameMouseX = mouseX / GAME_SCALE + camX;
      let gameMouseY = mouseY / GAME_SCALE + camY;
      let angle = atan2(gameMouseY - this.cy(), gameMouseX - this.cx());
      let eyeOffset = GRID_SIZE * 0.3; let eyeSize = max(1, GRID_SIZE * 0.25);
      rect(this.cx() + cos(angle) * eyeOffset - eyeSize / 2,
         this.cy() + sin(angle) * eyeOffset - eyeSize / 2,
         eyeSize, eyeSize);
   }
}
