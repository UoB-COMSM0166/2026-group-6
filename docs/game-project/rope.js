class Rope {
   constructor(ropeColor) {
      const G = GameConfig.World.GRID_SIZE;

      this.state = "IDLE";    // IDLE | EXTENDING | RETRACTING | SWINGING
      this.len = 0;
      this.nodes = [];
      this.nodeDist = G / 2;
      this.maxLen = G * 5;
      this.speed = G * 0.8;
      this.angle = 0;
      this.anchor = { x: 0, y: 0 };
      this.color = ropeColor;
      this.material = 'SOFT';
      this.currentTip = { x: 0, y: 0 };
   }

   // ====== 材质 ======

   toggleMaterial(player) {
      this.material = (this.material === 'SOFT') ? 'HARD' : 'SOFT';
      if (this.state === "SWINGING") {
         if (this.material === 'HARD') this._genStraightNodes(player);
         else this.nodeDist = GameConfig.World.GRID_SIZE / 2;
      }
   }

   // ====== 绳长 ======

   changeLength(amount) {
      if (this.state !== "SWINGING") return;
      const G = GameConfig.World.GRID_SIZE;
      this.len = constrain(this.len + amount, G, this.maxLen);

      if (this.material === 'SOFT' && this.nodes.length > 0) {
         this.nodeDist = constrain(
            this.len / this.nodes.length,
            G * 0.1, G
         );
      }
   }

   // ====== 发射/收回 ======

   fire(px, py, tx, ty) {
      if (this.state === "SWINGING") {
         this.state = "IDLE";
         this.len = 0;
         this.nodes = [];
         return;
      }
      this.angle = atan2(ty - py, tx - px);
      this.state = "EXTENDING";
      this.len = 0;
      this.nodes = [];
      this.currentTip = { x: px, y: py };
   }

   // ====== 主更新 (接收 LevelManager) ======

   update(player, level) {
      if (this.state === "EXTENDING") this._updateExtend(player, level);
      else if (this.state === "RETRACTING") this._updateRetract();
      else if (this.state === "SWINGING") {
         if (this.material === 'SOFT') this._simSoft(player, level);
         else this._simHard(player);
      }
   }

   // ====== 物理约束 (作用于玩家) ======

   applyPhysics(player) {
      if (this.state !== "SWINGING") return;

      let curDist = dist(player.cx(), player.cy(), this.anchor.x, this.anchor.y);

      // 超出绳长 → 拉回
      if (curDist > this.len) {
         let a = atan2(player.cy() - this.anchor.y, player.cx() - this.anchor.x);
         let tX = this.anchor.x + cos(a) * this.len;
         let tY = this.anchor.y + sin(a) * this.len;
         player.vx += (tX - player.cx()) * 0.5;
         player.vy += (tY - player.cy()) * 0.5;
         player.vx *= 0.9;
         player.vy *= 0.9;
      }

      // 绞盘辅助力
      if (this.material === 'SOFT') {
         if (this.nodes.length >= 2) {
            let sec = this.nodes[this.nodes.length - 2];
            let d = dist(player.cx(), player.cy(), sec.x, sec.y);
            if (d > this.nodeDist) {
               let a = atan2(sec.y - player.cy(), sec.x - player.cx());
               let f = (d - this.nodeDist) * 0.2;
               player.vx += cos(a) * f;
               player.vy += sin(a) * f;
            }
         }
      } else {
         let diff = curDist - this.len;
         if (abs(diff) > 1) {
            let a = atan2(this.anchor.y - player.cy(), this.anchor.x - player.cx());
            let f = diff * 0.2;
            player.vx += cos(a) * f;
            player.vy += sin(a) * f;
            player.vx *= 0.9;
            player.vy *= 0.9;
         }
      }
   }

   // ====== 查询 ======

   getTip(player) {
      return (this.state === "SWINGING") ? this.anchor : this.currentTip;
   }

   getCollisionBoxes() {
      if (this.state !== "SWINGING" || this.material !== 'HARD') return [];
      const G = GameConfig.World.GRID_SIZE;
      let s = G / 2, off = s / 2;
      return this.nodes.map(n => ({ x: n.x - off, y: n.y - off, w: s, h: s }));
   }

   // ====== 渲染 ======

   display(player) {
      if (this.state === "IDLE") return;
      const G = GameConfig.World.GRID_SIZE;
      let sw = (this.material === 'HARD') ? max(2, G / 5) : max(1, G / 6);
      stroke(this.color); strokeWeight(sw); noFill();

      if (this.nodes.length > 0) {
         beginShape();
         for (let n of this.nodes) vertex(n.x, n.y);
         endShape();
         noStroke(); fill(this.color);
         ellipse(this.anchor.x, this.anchor.y, G / 3, G / 3);
      } else {
         line(player.cx(), player.cy(), this.currentTip.x, this.currentTip.y);
      }
   }

   // ====== 内部 ======

   _updateExtend(player, level) {
      let moveDist = this.speed;
      let reachedMax = false;
      if (this.len + moveDist >= this.maxLen) {
         moveDist = this.maxLen - this.len;
         reachedMax = true;
      }

      let nx = this.currentTip.x + cos(this.angle) * moveDist;
      let ny = this.currentTip.y + sin(this.angle) * moveDist;

      // ★ 使用 LevelManager 射线检测
      let hit = level.rayCast(this.currentTip.x, this.currentTip.y, nx, ny);

      if (hit) {
         this.state = "SWINGING";
         this.anchor = { x: hit.x, y: hit.y };
         let d = dist(player.cx(), player.cy(), hit.x, hit.y);
         this.len = min(d, this.maxLen);
         if (this.material === 'SOFT') this._initSoftNodes(player, d);
         else this._genStraightNodes(player);
      } else {
         this.currentTip.x = nx;
         this.currentTip.y = ny;
         this.len += moveDist;
         if (reachedMax) this.state = "RETRACTING";
      }
   }

   _updateRetract() {
      this.len -= this.speed * 2;
      if (this.len <= 0) { this.len = 0; this.state = "IDLE"; }
   }

   _initSoftNodes(player, distTotal) {
      const G = GameConfig.World.GRID_SIZE;
      this.nodeDist = G / 2;
      let total = max(2, floor(distTotal / this.nodeDist));
      this.nodes = [];
      for (let i = 0; i < total; i++) {
         let t = i / (total - 1);
         let nx = lerp(this.anchor.x, player.cx(), t);
         let ny = lerp(this.anchor.y, player.cy(), t);
         this.nodes.push({ x: nx, y: ny, oldx: nx, oldy: ny });
      }
   }

   _genStraightNodes(player) {
      const G = GameConfig.World.GRID_SIZE;
      let pX = player.cx(), pY = player.cy();
      let d = dist(pX, pY, this.anchor.x, this.anchor.y);
      this.nodeDist = G / 2;
      let total = max(2, floor(d / this.nodeDist));
      this.nodes = [];
      for (let i = 0; i < total; i++) {
         let t = i / (total - 1);
         let nx = lerp(this.anchor.x, pX, t);
         let ny = lerp(this.anchor.y, pY, t);
         this.nodes.push({ x: nx, y: ny, oldx: nx, oldy: ny });
      }
      this.len = d;
   }

   _simSoft(player, level) {
      if (this.nodes.length < 2) return;

      this.nodes[0].x = this.anchor.x;
      this.nodes[0].y = this.anchor.y;
      let last = this.nodes[this.nodes.length - 1];
      last.x = player.cx();
      last.y = player.cy();

      // Verlet 积分
      for (let i = 1; i < this.nodes.length - 1; i++) {
         let n = this.nodes[i];
         let vx = (n.x - n.oldx) * 0.98;
         let vy = (n.y - n.oldy) * 0.98;
         let tx = n.x, ty = n.y;
         n.x += vx;
         n.y += vy + 0.5;

         // ★ 使用 LevelManager 点碰撞检测
         if (level.isPointSolid(n.x, n.y)) {
            n.x = tx;
            n.y = ty;
         }
         n.oldx = tx;
         n.oldy = ty;
      }

      // 距离约束
      let iter = GameConfig.Rope.STIFFNESS;
      for (let k = 0; k < iter; k++) {
         for (let i = 0; i < this.nodes.length - 1; i++) {
            let A = this.nodes[i], B = this.nodes[i + 1];
            let dx = B.x - A.x, dy = B.y - A.y;
            let d = sqrt(dx * dx + dy * dy);
            if (d === 0) continue;
            let diff = this.nodeDist - d;
            let ox = (dx * diff / d) * 0.5;
            let oy = (dy * diff / d) * 0.5;
            if (i !== 0) { A.x -= ox; A.y -= oy; }
            if (i + 1 !== this.nodes.length - 1) { B.x += ox; B.y += oy; }
         }
      }
   }

   _simHard(player) {
      let pX = player.cx(), pY = player.cy();
      let total = this.nodes.length;
      if (total < 2) return;
      for (let i = 0; i < total; i++) {
         let t = i / (total - 1);
         this.nodes[i].x = lerp(this.anchor.x, pX, t);
         this.nodes[i].y = lerp(this.anchor.y, pY, t);
      }
   }
}
