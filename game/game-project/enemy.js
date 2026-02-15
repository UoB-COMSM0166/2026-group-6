class Enemy {
   /**
    * @param {number} x
    * @param {number} y
    * @param {number} hp
    * @param {number} damage
    * @param {LevelManager} level  用于出生位置修正
    */
   constructor(x, y, hp, damage, level) {
      const G = GameConfig.World.GRID_SIZE;

      this.x = x;
      this.y = y;
      this.w = G;
      this.h = G;
      this.damage = damage;
      this.jumpTime = 0;
      this.maxHp = hp;
      this.hp = hp;
      this.purified = false;
      this.alpha = 255;

      this.dir = 1;
      this.speed = GameConfig.Enemy.SPEED;
      this.vy = 0;
      this.grounded = false;
      this.jumpForce = -1 * GameConfig.Enemy.JUMPFORCE;

      // 出生防卡墙：使用空间查询
      let safety = 100;
      while (this._isOverlapping(level) && safety > 0) {
         this.y -= 1;
         safety--;
      }
   }

   /** 检测当前位置是否与固体重叠 */
   _isOverlapping(level) {
      let m = 0.1;
      let tiles = level.getSolidTilesInRect(this.x + m, this.y + m, this.w - m * 2, this.h - m * 2, 0);
      for (let t of tiles) {
         if (Physics.rectIntersect(
            this.x + m, this.y + m, this.w - m * 2, this.h - m * 2,
            t.x, t.y, t.w, t.h)) {
            return true;
         }
      }
      return false;
   }

   /**
    * @param {LevelManager} level
    */
   update(level) {
      if (this.purified) {
         this.alpha -= 5;
         this.y -= 1;
         return;
      }

      // --- Y 轴 ---
      this.vy += 0.1;
      let nextY = this.y + this.vy;
      this.grounded = false;

      // ★ 空间查询: 只检测附近的固体
      let nearbyY = level.getSolidTilesInRect(this.x + 0.1, nextY, this.w - 0.2, this.h, 0);
      let hitY = false;
      for (let t of nearbyY) {
         if (Physics.rectIntersect(this.x + 0.1, nextY, this.w - 0.2, this.h, t.x, t.y, t.w, t.h)) {
            hitY = true;
            if (this.vy > 0) {
               this.y = t.y - this.h;
               this.grounded = true;
            } else if (this.vy < 0) {
               this.y = t.y + t.h;
            }
            this.vy = 0;
            break;
         }
      }
      if (!hitY) this.y += this.vy;

      if (this.y > 1000) this.hp = 0;

      // --- X 轴 ---
      const G = GameConfig.World.GRID_SIZE;
      let nextX = this.x + this.speed * this.dir * 0.8;

      // 撞墙检测 (空间查询)
      let nearbyX = level.getSolidTilesInRect(nextX, this.y, this.w, this.h, 0);
      let hitWall = false;
      for (let t of nearbyX) {
         if (Physics.rectIntersect(nextX, this.y, this.w, this.h, t.x, t.y, t.w, t.h)) {
            hitWall = true;
            break;
         }
      }

      // ★ 悬崖检测: 利用 LevelManager 列查询
      let probeX = (this.dir === 1) ? (nextX + this.w + 0.5) : (nextX - 0.5);
      let feetRow = level.worldToGrid(0, this.y + this.h).row;
      let maxDropRow = level.worldToGrid(0, this.y + this.h + G * GameConfig.Enemy.DROP_DEPTH_TILES).row;
      let probeCol = level.worldToGrid(probeX, 0).col;

      let safeToDrop = level.hasSolidInColumn(probeCol, feetRow - 1, maxDropRow);
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
      } else if (aboutToFall && this.grounded) {
         this._turn();
      } else {
         this.x = nextX;
      }
   }

   takeDamage(n) {
      this.hp -= n;
      if (this.hp <= 0) this.purified = true;
   }

   get isDead() { return this.hp <= 0; }

   display() {
      if (this.purified) {
         fill(0, 255, 255, this.alpha);
      } else {
         fill(lerpColor(color(100), color(255, 0, 0), this.hp / this.maxHp));
      }
      rect(this.x, this.y, this.w, this.h);
   }

   _turn() {
      this.dir *= -1;
      this.jumpTime = 0;
   }
}
