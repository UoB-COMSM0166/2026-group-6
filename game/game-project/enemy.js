class Enemy {
   constructor(x, y, hp) {
      this.x = x;
      this.y = y;
      this.w = GRID_SIZE;
      this.h = GRID_SIZE;
      this.jumpTime = 0;
      this.maxHp = hp;
      this.hp = hp;
      this.purified = false;
      this.alpha = 255;

      // 移动参数
      this.dir = 1;
      this.speed = 0.5;
      this.vy = 0;
      this.grounded = false;

      // 跳跃力度
      this.jumpForce = -3.5;

      // 如果出生时卡在墙体里，就向上循环移动，直到没有重叠为止
      let safetyLoop = 100; // 防止死循环
      while (this.checkCollision(this.x, this.y) && safetyLoop > 0) {
         this.y -= 1;
         safetyLoop--;
      }
   }

   // 辅助函数：检测特定位置是否撞墙
   checkCollision(targetX, targetY) {
      let margin = 0.1;
      for (let p of platforms) {
         if (rectIntersect(
            targetX + margin, targetY + margin,
            this.w - margin * 2, this.h - margin * 2,
            p.x, p.y, p.w, p.h
         )) {
            return true;
         }
      }
      return false;
   }

   update() {
      if (this.purified) {
         this.alpha -= 5;
         this.y -= 1;
         return;
      }

      // Y轴移动
      this.vy += 0.1;

      // 预判 Y 轴移动
      let nextY = this.y + this.vy;

      this.grounded = false;

      // Y 轴碰撞检测
      let hitY = false;
      for (let p of platforms) {
         // 缩小一点认定x轴碰撞体积，避免相交时误判为已经接触
         if (rectIntersect(this.x + 0.1, nextY, this.w - 0.2, this.h, p.x, p.y, p.w, p.h)) {
            hitY = true;
            if (this.vy > 0) {
               // 下落撞地
               this.y = p.y - this.h;
               this.grounded = true;
            } else if (this.vy < 0) {
               // 上升撞头
               this.y = p.y + p.h;
            }
            this.vy = 0;
            break; // 只要碰到一个就停止检测
         }
      }

      // 如果没撞，才应用移动
      if (!hitY) {
         this.y += this.vy;
      }

      // 掉出地图
      if (this.y > 1000) this.hp = 0;

      //x轴移动

      let nextX = this.x + this.speed * this.dir * 0.8;
      let hitWall = false;
      // 悬崖检测
      let probeX = (this.dir === 1) ? (nextX + this.w + 0.5) : (nextX - 0.5);

      // maxDropY: 允许下坠的最大深度 (这里设为 3 个格子)
      let feetY = this.y + this.h;
      let maxDropY = feetY + GRID_SIZE * 3;

      let safeToDrop = false; // 默认为"不安全/悬崖"

      for (let p of platforms) {
         // 撞墙检测
         if (rectIntersect(nextX, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) {
            hitWall = true;
         }
         if (probeX >= p.x - 2 && probeX <= p.x + p.w + 2) {
            // 垂直检查：平台的高度是否在[脚底, 最大深度]之间？
            if (p.y >= feetY - 2 && p.y <= maxDropY) {
               safeToDrop = true;
            }
         }
      }

      let aboutToFall = !safeToDrop;


      if (hitWall) {
         if (this.grounded) {
            // 在地面撞墙 -> 原地起跳
            this.vy = this.jumpForce;
            this.jumpTime += 1;
            this.grounded = false;
            if (this.jumpTime > 3) {
               this.turnDirection();
            }
            // 此时不移动 X，原地升空
         } else {
            // 在空中撞墙
            if (this.vy > 2.0) {
               // 下落且撞墙 -> 没跳过去，回头
               this.turnDirection();
            } else {
               // 此时不移动 X，防止卡进墙里
            }
         }
      }
      else if (aboutToFall && this.grounded) {
         this.turnDirection();
      }
      else {
         // 只有前方无障碍，才真正更新坐标
         this.x = nextX;
      }
   }

   takeDamage(n) {
      this.hp -= n;
      if (this.hp <= 0) this.purified = true;
   }

   display() {
      if (this.purified) {
         fill(0, 255, 255, this.alpha);
      }
      else {
         fill(lerpColor(color(100), color(255, 0, 0), this.hp / this.maxHp));
      }
      rect(this.x, this.y, this.w, this.h);
   }

   turnDirection(){
      this.dir *= -1;
      this.jumpTime = 0;
   }
}