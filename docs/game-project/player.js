class Player {
   constructor(x, y) {
      this.hp = GameConfig.Player.MAX_HP;
      // 受到伤害时间间隔
      this.invulnerableTimer = 0;
      // 后退时间间隔
      this.knockTimer = 0;
      // 初始位置 x,y是相对左上角的坐标
      this.x = x;
      this.y = y;
      // 玩家的长宽
      this.w = GRID_SIZE; this.h = GRID_SIZE;
      this.vx = 0;
      this.vy = 0;
      this.grounded = false;
      this.ropeL = new Rope(color(0, 255, 255));
      this.ropeR = new Rope(color(255, 100, 100));
   }

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   update() {

      if (this.invulnerableTimer > 0) {
         this.invulnerableTimer--;
      }
      //移动速度
      if (this.knockTimer > 0) {
         this.knockTimer--;
      }
      let moveForce = this.grounded ? GameConfig.Player.SPEED : GameConfig.Player.SPEED * 0.7;
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.vx -= moveForce;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.vx += moveForce;
      // 拉伸绳子速度
      let climbSpeed = GRID_SIZE * GameConfig.Player.CLIMB_SPEED;
      // player 拽绳子的力度（抵抗重力this.vy的作用）
      let winchForce = GameConfig.Player.WINCH_FORCE;

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
      this.vy += GameConfig.World.GRAVITY;

      this.ropeL.update(this); this.ropeR.update(this);
      this.ropeL.applyPhysics(this); this.ropeR.applyPhysics(this);

      this.x += this.vx;
      let heldRopes = [];
      if (this.ropeL.state === "SWINGING" && this.ropeL.material === 'HARD') heldRopes.push(this.ropeL);
      if (this.ropeR.state === "SWINGING" && this.ropeR.material === 'HARD') heldRopes.push(this.ropeR);
      this.resolveCollisions(true, heldRopes); // x轴碰撞

      this.y += this.vy;
      this.resolveCollisions(false, heldRopes); // y轴碰撞
      this.checkEnemyCollision();
   }


   // 处理 player 的碰撞
   resolveCollisions(onXAxis, ignoredRopes = []) {
      // 1. 初始化
      this.grounded = false; // 默认设为"未着地"状态，后面检测到了再设为 true

      // 2. 收集所有"固体"障碍物
      let allColliders = [...platforms]; // 首先加入地图所有的平台/墙壁

      // 特殊逻辑：硬绳子（HARD）如果处于摆动状态，也视为固体（像墙或地板一样）
      // 左绳
      if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
         allColliders = allColliders.concat(this.ropeL.getCollisionBoxes());
      }
      // 右绳
      if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
         allColliders = allColliders.concat(this.ropeR.getCollisionBoxes());
      }

      // 3. 遍历所有障碍物进行检测
      for (let p of allColliders) {
         // 第一步：粗略检测，看两个矩形是否相交
         if (Physics.rectIntersect(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) {

            // --- 以下是 AABB 碰撞数学计算 ---
            // 计算主角和障碍物的半宽、半高
            let playerHalfW = this.w / 2; let playerHalfH = this.h / 2;
            let platformHalfW = p.w / 2; let platformHalfH = p.h / 2;

            // 计算两者的中心点坐标
            let playerCenter = { x: this.x + playerHalfW, y: this.y + playerHalfH };
            let platformCenter = { x: p.x + platformHalfW, y: p.y + platformHalfH };

            // 计算中心点距离 (dx, dy)
            let dx = playerCenter.x - platformCenter.x;
            let dy = playerCenter.y - platformCenter.y;

            // 计算"最小不重叠距离" (如果小于这个距离，说明重叠了)
            let minDistX = playerHalfW + platformHalfW;
            let minDistY = playerHalfH + platformHalfH;

            // 计算"重叠量" (overlap) - 这个数值决定了要把主角往回推多少
            let overlapX = minDistX - abs(dx);
            let overlapY = minDistY - abs(dy);

            // 确认确实发生了重叠
            if (overlapX > 0 && overlapY > 0) {

               // --- 碰撞决断逻辑 ---

               // 情况 A: X轴重叠量 < Y轴重叠量
               // 说明是"侧面"撞击（撞墙了），因为侧面插进去的深度比较浅
               if (overlapX < overlapY) {
                  // 【关键】只有当前是在处理 X 轴移动时，才解决 X 轴的碰撞
                  if (onXAxis) {
                     if (dx > 0) this.x += overlapX; // 主角在右边，往右推
                     else this.x -= overlapX;        // 主角在左边，往左推
                     this.vx = 0; // 撞墙后，X轴速度清零
                  }
               }
               // 情况 B: Y轴重叠量 < X轴重叠量
               // 说明是"垂直"撞击（落地或顶头），因为上下插进去的深度比较浅
               else {
                  // 【关键】只有当前是在处理 Y 轴移动时，才解决 Y 轴的碰撞
                  if (!onXAxis) {
                     if (dy > 0) {
                        // 主角在障碍物下方（顶头了）
                        this.y += overlapY;
                        this.vy = 0;
                     }
                     else {
                        // 主角在障碍物上方（落地了）
                        this.y -= overlapY;
                        this.vy = 0;
                        this.grounded = true; // 标记为着地
                     }
                  }
               }
            }
         }
      }

      // 4. 额外的着地检测 (Ground Check)
      // 即使没有发生剧烈碰撞（比如只是静止站着），也需要判断是否在地面上
      // 只有在处理 Y 轴逻辑时才做这个检查
      if (!onXAxis) {
         this.grounded = false; // 先重置
         for (let p of allColliders) {
            // 检测脚底下是否有障碍物
            // X轴范围：主角在障碍物宽度范围内 (左右各留2px容错)
            // Y轴范围：脚底 (this.y + this.h) 在障碍物顶部附近 (-1 到 +5 像素的容差)
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
      let jumpForce = -1 * GameConfig.Player.JUMPFORCE;
      if (this.grounded) {
         this.vy = jumpForce;
      }
      // 在空中摇晃中时的跳跃能力减弱
      else if (this.ropeL.state === "SWINGING" || this.ropeR.state === "SWINGING") {
         this.vy = jumpForce * 0.5;
         this.vx *= 1.2;
      }

   }

   die() {
      gameStatus = "GAMEOVER";
      this.invulnerableTimer = 0;
      this.knockTimer = 0;
   }

   checkEnemyCollision() {
      if (this.invulnerableTimer > 0) return;
      for (let enemy of enemies) {
         if (Physics.rectIntersect(this.x, this.y, this.w, this.h, enemy.x, enemy.y, enemy.w, enemy.h)) {
            this.beDamaged(enemy);
            break;
         }
      }
   }

   beDamaged(enemy) {
      this.hp -= enemy.damage;
      if (this.hp <= 0) {
         this.die();
         return;
      }
      this.invulnerableTimer = GameConfig.Player.InvulInterval;
      this.knockTimer = GameConfig.Player.KnockInterval;
      let pushDirection = (this.x < enemy.x) ? -1 : 1;
      // 被攻击后向上方弹出
      this.vx = pushDirection * 3;
      this.vy = -2;
   }

   display() {
      noStroke();
      if (this.knockTimer > 0) {
         fill(255, 100, 100);
      }
      else {
         fill(255);
      };
      rect(this.x, this.y, this.w, this.h);
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
