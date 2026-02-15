class Rope {
   constructor(ropeColor) {
      const GRID = GameConfig.World.GRID_SIZE;

      this.state = "IDLE";    // IDLE | EXTENDING | RETRACTING | SWINGING
      this.len = 0;
      this.nodes = [];
      this.nodeDist = GRID / 2;
      this.maxLen = GRID * 5;
      this.speed = GRID * 0.8;
      this.angle = 0;
      this.anchor = { x: 0, y: 0 };
      this.color = ropeColor;
      this.material = 'SOFT';  // SOFT | HARD
      this.currentTip = { x: 0, y: 0 };
   }

   // ========== 材质切换 ==========

   toggleMaterial(player) {
      this.material = (this.material === 'SOFT') ? 'HARD' : 'SOFT';
      if (this.state === "SWINGING") {
         if (this.material === 'HARD') {
            this._generateStraightNodes(player);
         } else {
            this.nodeDist = GameConfig.World.GRID_SIZE / 2;
         }
      }
   }

   // ========== 绳长调节 ==========

   /** 收缩/释放绳子长度，受 maxLen 约束 */
   changeLength(amount) {
      if (this.state !== "SWINGING") return;
      const GRID = GameConfig.World.GRID_SIZE;

      this.len += amount;
      this.len = constrain(this.len, GRID, this.maxLen);

      // 软绳：根据锁定的长度重新计算节点间距
      if (this.material === 'SOFT' && this.nodes.length > 0) {
         this.nodeDist = this.len / this.nodes.length;
         this.nodeDist = constrain(this.nodeDist, GRID * 0.1, GRID);
      }
   }

   // ========== 发射与收回 ==========

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

   // ========== 主更新 ==========

   update(player, solidPlatforms) {
      if (this.state === "EXTENDING") {
         this._updateExtending(player, solidPlatforms);
      } else if (this.state === "RETRACTING") {
         this._updateRetracting();
      } else if (this.state === "SWINGING") {
         if (this.material === 'SOFT') {
            this._simulateSoftPhysics(player, solidPlatforms);
         } else {
            this._simulateHardPhysics(player);
         }
      }
   }

   // ========== 物理约束（作用于玩家） ==========

   applyPhysics(player) {
      if (this.state !== "SWINGING") return;

      let currentDist = dist(player.cx(), player.cy(), this.anchor.x, this.anchor.y);

      // 超出绳长时拉回玩家
      if (currentDist > this.len) {
         let angle = atan2(player.cy() - this.anchor.y, player.cx() - this.anchor.x);
         let clampDist = this.len;
         let targetX = this.anchor.x + cos(angle) * clampDist;
         let targetY = this.anchor.y + sin(angle) * clampDist;

         let pullX = (targetX - player.cx()) * 0.5;
         let pullY = (targetY - player.cy()) * 0.5;
         player.vx += pullX;
         player.vy += pullY;
         player.vx *= 0.9;
         player.vy *= 0.9;
      }

      // 绞盘辅助力
      if (this.material === 'SOFT') {
         if (this.nodes.length >= 2) {
            let second = this.nodes[this.nodes.length - 2];
            let d = dist(player.cx(), player.cy(), second.x, second.y);
            if (d > this.nodeDist) {
               let angle = atan2(second.y - player.cy(), second.x - player.cx());
               let force = (d - this.nodeDist) * 0.2;
               player.vx += cos(angle) * force;
               player.vy += sin(angle) * force;
            }
         }
      } else {
         // 硬绳绞盘
         let diff = currentDist - this.len;
         if (abs(diff) > 1) {
            let angle = atan2(this.anchor.y - player.cy(), this.anchor.x - player.cx());
            let force = diff * 0.2;
            player.vx += cos(angle) * force;
            player.vy += sin(angle) * force;
            player.vx *= 0.9;
            player.vy *= 0.9;
         }
      }
   }

   // ========== 查询方法 ==========

   getTip(player) {
      return (this.state === "SWINGING") ? this.anchor : this.currentTip;
   }

   /** 硬绳的碰撞盒（可被玩家当作固体踩踏） */
   getCollisionBoxes() {
      if (this.state !== "SWINGING" || this.material !== 'HARD') return [];
      const GRID = GameConfig.World.GRID_SIZE;
      let boxSize = GRID / 2;
      let offset = boxSize / 2;
      return this.nodes.map(node => ({
         x: node.x - offset,
         y: node.y - offset,
         w: boxSize,
         h: boxSize,
      }));
   }

   // ========== 渲染 ==========

   display(player) {
      if (this.state === "IDLE") return;
      const GRID = GameConfig.World.GRID_SIZE;
      let strokeW = (this.material === 'HARD') ? max(2, GRID / 5) : max(1, GRID / 6);

      stroke(this.color);
      strokeWeight(strokeW);
      noFill();

      if (this.nodes.length > 0) {
         beginShape();
         for (let node of this.nodes) vertex(node.x, node.y);
         endShape();

         noStroke();
         fill(this.color);
         ellipse(this.anchor.x, this.anchor.y, GRID / 3, GRID / 3);
      } else {
         line(player.cx(), player.cy(), this.currentTip.x, this.currentTip.y);
      }
   }

   // ========== 内部方法 ==========

   _updateExtending(player, solidPlatforms) {
      let moveDist = this.speed;
      let reachedMax = false;

      if (this.len + moveDist >= this.maxLen) {
         moveDist = this.maxLen - this.len;
         reachedMax = true;
      }

      let nextX = this.currentTip.x + cos(this.angle) * moveDist;
      let nextY = this.currentTip.y + sin(this.angle) * moveDist;

      let hitResult = this._rayCastPlatforms(this.currentTip.x, this.currentTip.y, nextX, nextY, solidPlatforms);

      if (hitResult) {
         this.state = "SWINGING";
         this.anchor = { x: hitResult.x, y: hitResult.y };
         let distTotal = dist(player.cx(), player.cy(), this.anchor.x, this.anchor.y);
         this.len = min(distTotal, this.maxLen);

         if (this.material === 'SOFT') {
            this._initSoftNodes(player, distTotal);
         } else {
            this._generateStraightNodes(player);
         }
      } else {
         this.currentTip.x = nextX;
         this.currentTip.y = nextY;
         this.len += moveDist;
         if (reachedMax) this.state = "RETRACTING";
      }
   }

   _updateRetracting() {
      this.len -= this.speed * 2;
      if (this.len <= 0) {
         this.len = 0;
         this.state = "IDLE";
      }
   }

   _initSoftNodes(player, distTotal) {
      const GRID = GameConfig.World.GRID_SIZE;
      this.nodeDist = GRID / 2;
      let totalNodes = max(2, floor(distTotal / this.nodeDist));
      this.nodes = [];
      for (let i = 0; i < totalNodes; i++) {
         let t = i / (totalNodes - 1);
         let nx = lerp(this.anchor.x, player.cx(), t);
         let ny = lerp(this.anchor.y, player.cy(), t);
         this.nodes.push({ x: nx, y: ny, oldx: nx, oldy: ny });
      }
   }

   _generateStraightNodes(player) {
      const GRID = GameConfig.World.GRID_SIZE;
      let pX = player.cx(), pY = player.cy();
      let distTotal = dist(pX, pY, this.anchor.x, this.anchor.y);
      this.nodeDist = GRID / 2;
      let totalNodes = max(2, floor(distTotal / this.nodeDist));
      this.nodes = [];
      for (let i = 0; i < totalNodes; i++) {
         let t = i / (totalNodes - 1);
         let nx = lerp(this.anchor.x, pX, t);
         let ny = lerp(this.anchor.y, pY, t);
         this.nodes.push({ x: nx, y: ny, oldx: nx, oldy: ny });
      }
      this.len = distTotal;
   }

   _rayCastPlatforms(x1, y1, x2, y2, solidPlatforms) {
      let closestHit = null;
      let minDst = Infinity;
      for (let p of solidPlatforms) {
         let hit = Physics.lineRectIntersect(x1, y1, x2, y2, p.x, p.y, p.w, p.h);
         if (hit) {
            let d = dist(x1, y1, hit.x, hit.y);
            if (d < minDst) { minDst = d; closestHit = hit; }
         }
      }
      return closestHit;
   }

   _simulateSoftPhysics(player, solidPlatforms) {
      if (this.nodes.length < 2) return;

      // 锚定首尾节点
      this.nodes[0].x = this.anchor.x;
      this.nodes[0].y = this.anchor.y;
      let lastNode = this.nodes[this.nodes.length - 1];
      lastNode.x = player.cx();
      lastNode.y = player.cy();

      // Verlet积分（中间节点）
      for (let i = 1; i < this.nodes.length - 1; i++) {
         let node = this.nodes[i];
         let vx = (node.x - node.oldx) * 0.98;
         let vy = (node.y - node.oldy) * 0.98;
         let tempX = node.x, tempY = node.y;

         node.x += vx;
         node.y += vy + 0.5;

         // 节点与固体碰撞
         for (let p of solidPlatforms) {
            if (Physics.pointRect(node.x, node.y, p.x, p.y, p.w, p.h)) {
               node.x = tempX;
               node.y = tempY;
            }
         }
         node.oldx = tempX;
         node.oldy = tempY;
      }

      // 距离约束迭代
      let iterations = GameConfig.Rope.STIFFNESS;
      for (let k = 0; k < iterations; k++) {
         for (let i = 0; i < this.nodes.length - 1; i++) {
            let A = this.nodes[i], B = this.nodes[i + 1];
            let dx = B.x - A.x, dy = B.y - A.y;
            let dst = sqrt(dx * dx + dy * dy);
            if (dst === 0) continue;
            let diff = this.nodeDist - dst;
            let offX = (dx * diff / dst) * 0.5;
            let offY = (dy * diff / dst) * 0.5;
            if (i !== 0) { A.x -= offX; A.y -= offY; }
            if (i + 1 !== this.nodes.length - 1) { B.x += offX; B.y += offY; }
         }
      }
   }

   _simulateHardPhysics(player) {
      let pX = player.cx(), pY = player.cy();
      let totalNodes = this.nodes.length;
      if (totalNodes < 2) return;

      // 硬绳：线性插值到目标位置
      for (let i = 0; i < totalNodes; i++) {
         let t = i / (totalNodes - 1);
         this.nodes[i].x = lerp(this.anchor.x, pX, t);
         this.nodes[i].y = lerp(this.anchor.y, pY, t);
      }
   }
}
