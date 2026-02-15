class Enemy {
   constructor(x, y, hp, damage, solidPlatforms) {
      const GRID = GameConfig.World.GRID_SIZE;

      this.x = x;
      this.y = y;
      this.w = GRID;
      this.h = GRID;
      this.damage = damage;
      this.jumpTime = 0;
      this.maxHp = hp;
      this.hp = hp;
      this.purified = false;
      this.alpha = 255;

      // 移动参数
      this.dir = 1;
      this.speed = GameConfig.Enemy.SPEED;
      this.vy = 0;
      this.grounded = false;
      this.jumpForce = -1 * GameConfig.Enemy.JUMPFORCE;

      // 出生时防止卡在墙体里
      let safety = 100;
      while (this.checkCollision(this.x, this.y, solidPlatforms) && safety > 0) {
         this.y -= 1;
         safety--;
      }
   }

   /** 检测特定位置是否与墙体碰撞 */
   checkCollision(targetX, targetY, solidPlatforms) {
      let m = 0.1;
      for (let p of solidPlatforms) {
         if (Physics.rectIntersect(
            targetX + m, targetY + m,
            this.w - m * 2, this.h - m * 2,
            p.x, p.y, p.w, p.h
         )) {
            return true;
         }
      }
      return false;
   }

   update(solidPlatforms) {
      if (this.purified) {
         this.alpha -= 5;
         this.y -= 1;
         return;
      }

      // --- Y 轴物理 ---
      this.vy += 0.1;
      let nextY = this.y + this.vy;
      this.grounded = false;

      let hitY = false;
      for (let p of solidPlatforms) {
         if (Physics.rectIntersect(this.x + 0.1, nextY, this.w - 0.2, this.h, p.x, p.y, p.w, p.h)) {
            hitY = true;
            if (this.vy > 0) {
               this.y = p.y - this.h;
               this.grounded = true;
            } else if (this.vy < 0) {
               this.y = p.y + p.h;
            }
            this.vy = 0;
            break;
         }
      }
      if (!hitY) this.y += this.vy;

      // 掉出地图
      if (this.y > 1000) this.hp = 0;

      // --- X 轴移动与AI ---
      let nextX = this.x + this.speed * this.dir * 0.8;
      let hitWall = false;

      // 悬崖检测
      let GRID = GameConfig.World.GRID_SIZE;
      let probeX = (this.dir === 1) ? (nextX + this.w + 0.5) : (nextX - 0.5);
      let feetY = this.y + this.h;
      let maxDropY = feetY + GRID * GameConfig.Enemy.DROP_DEPTH_TILES;
      let safeToDrop = false;

      for (let p of solidPlatforms) {
         if (Physics.rectIntersect(nextX, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) {
            hitWall = true;
         }
         if (probeX >= p.x - 2 && probeX <= p.x + p.w + 2) {
            if (p.y >= feetY - 2 && p.y <= maxDropY) {
               safeToDrop = true;
            }
         }
      }

      let aboutToFall = !safeToDrop;

      if (hitWall) {
         if (this.grounded) {
            // 地面撞墙 → 起跳
            this.vy = this.jumpForce;
            this.jumpTime += 1;
            this.grounded = false;
            if (this.jumpTime > 3) this.turnDirection();
         } else {
            // 空中撞墙
            if (this.vy > 2.0) this.turnDirection();
         }
      } else if (aboutToFall && this.grounded) {
         this.turnDirection();
      } else {
         this.x = nextX;
      }
   }

   takeDamage(n) {
      this.hp -= n;
      if (this.hp <= 0) this.purified = true;
   }

   get isDead() {
      return this.hp <= 0;
   }

   display() {
      if (this.purified) {
         fill(0, 255, 255, this.alpha);
      } else {
         fill(lerpColor(color(100), color(255, 0, 0), this.hp / this.maxHp));
      }
      rect(this.x, this.y, this.w, this.h);
   }

   turnDirection() {
      this.dir *= -1;
      this.jumpTime = 0;
   }
}
