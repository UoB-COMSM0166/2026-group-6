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

      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
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
      this.jumpForce = -0.85 * GameConfig.Enemy.JUMPFORCE;

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
      let probeX = (this.dir === 1) ? (nextX + this.w - 0.5 * this.w) : (nextX + 0.5 * this.w);
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
   }

   onPlayerContact(player, gm) {
      if (this.purified) return;
      if (player.invulnerableTimer > 0) return;
      player.takeDamage(this.damage, gm);
      player.knockTimer = GameConfig.Player.KnockInterval;
      let dir = (player.x < this.x) ? -1 : 1;
      player.vx = dir * 3;
      player.vy = -2;
   }

   onRopeContact(rope, player, gm) {
      if (this.purified) return;
      if (!player.checkRemainCleanEnergy(GameConfig.Player.AttackConsume)) return;

      this.takeDamage(1);
      player.reduceCleanEnergy(GameConfig.Player.AttackConsume);
      gm.addParticles(this.cx(), this.cy());

      if (rope.state === "EXTENDING") rope.state = "RETRACTING";
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
}
