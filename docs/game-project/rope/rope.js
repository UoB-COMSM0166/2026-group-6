// 常量别名 (实际值在 config.js → GameConfig.Rope)
const RC = GameConfig.Rope;


class Rope {
   /**
    * @param {p5.Color} ropeColor
    */
   constructor(ropeColor) {
      this.G = GameConfig.World.GRID_SIZE;
      this.color = ropeColor;

      //  nodes[0] = 玩家端 (始终跟随玩家)
      //  nodes[last] = 远端 (飞行中/粘在墙上/收回中)
      /** @type {Array<{x:number, y:number, oldx:number, oldy:number}>} */
      this.nodes = [];
      this.stuck = false;
      this.retracting = false;
      this.material = 'SOFT';

      // 绳头抛射物
      this.tip = { x: 0, y: 0, vx: 0, vy: 0 };
      this._retractTimer = 0;

      // 派生常量
      this.nodeDist = this.G * RC.NODE_SPACING_GRIDS;
      this.maxNodes = Math.floor((this.G * RC.MAX_LENGTH_GRIDS) / this.nodeDist);
      this.maxLen = this.G * RC.MAX_LENGTH_GRIDS;
      this.minLen = this.G * RC.MIN_LENGTH_GRIDS;
      this.launchSpeed = this.G * RC.LAUNCH_SPEED_GRIDS;
      this.ropeLength = 0;
   }

   // 节点工具

   /** 创建 Verlet 节点, oldx/oldy 默认等于 x/y (静止) */
   _node(x, y, ox, oy) {
      return { x, y, oldx: ox ?? x, oldy: oy ?? y };
   }

   /** 钉住节点到指定位置 (位置 + 历史同步, 消除隐含速度) */
   _pin(node, x, y) {
      node.x = node.oldx = x;
      node.y = node.oldy = y;
   }

   get lastNode() { return this.nodes[this.nodes.length - 1]; }

   _insertBeforeLast() {
      let last = this.lastNode;
      let prev = this.nodes[this.nodes.length - 2];
      this.nodes.splice(this.nodes.length - 1, 0,
         this._node((prev.x + last.x) / 2, (prev.y + last.y) / 2));
   }

   _removeBeforeLast() {
      if (this.nodes.length > 2) {
         this.nodes.splice(this.nodes.length - 2, 1);
      }
   }

   // 状态查询

   get isIdle() { return this.nodes.length === 0; }

   get isExtending() {
      return this.nodes.length > 0
         && this.nodes.length < this.maxNodes
         && !this.stuck && !this.retracting;
   }

   get state() {
      if (this.nodes.length === 0) return "IDLE";
      if (this.retracting) return "RETRACTING";
      if (this.stuck) return "SWINGING";
      return "EXTENDING";
   }

   set state(value) {
      if (value === "IDLE") this.reset();
      else if (value === "RETRACTING") {
         this.retracting = true;
         this.stuck = false;
      }
   }

   // 操作

   fire(px, py, tx, ty) {
      if (!this.isIdle) {
         this.retracting = true;
         this.stuck = false;
         return;
      }

      let angle = atan2(ty - py, tx - px);
      this.tip.x = px;
      this.tip.y = py;
      this.tip.vx = cos(angle) * this.launchSpeed;
      this.tip.vy = sin(angle) * this.launchSpeed;

      this.nodes = [this._node(px, py)];
      this.stuck = false;
      this.retracting = false;
      this._retractTimer = 0;
   }

   reset() {
      this.nodes = [];
      this.stuck = false;
      this.retracting = false;
      this.ropeLength = 0;
      this._retractTimer = 0;
   }

   toggleMaterial() {
      this.material = (this.material === 'SOFT') ? 'HARD' : 'SOFT';
   }

   changeLength(amount) {
      if (!this.stuck || this.nodes.length < 2) return;
      this.ropeLength = constrain(this.ropeLength + amount, this.minLen, this.maxLen);
      this._syncNodeCount();
   }

   _syncNodeCount() {
      let target = constrain(
         Math.floor(this.ropeLength / this.nodeDist) + 1,
         2, this.maxNodes
      );
      while (this.nodes.length > target) this._removeBeforeLast();
      while (this.nodes.length < target) this._insertBeforeLast();
   }

   // ── 每帧更新 ─────────────────────────────────────────

   update(player, level) {
      if (this.nodes.length === 0) return;

      if (this.isExtending) this._advanceTip(level);

      if (this.retracting) {
         this._retractOneNode();
         if (this.nodes.length === 0) return;
      }

      this._simulate(player, level);
      this.tip.x = this.lastNode.x;
      this.tip.y = this.lastNode.y;
   }

   /** 对玩家施加绳索约束 (粘住时生效) */
   applyPhysics(player) {
      if (!this.stuck || this.nodes.length < 2) return;
      let d = dist(player.cx(), player.cy(), this.tip.x, this.tip.y);

      if (this.material === 'HARD') {
         this._applyHardSpring(player, d);
      } else {
         this._applySoftConstraint(player, d);
      }
   }

   // 查询

   getTip() {
      return { x: this.tip.x, y: this.tip.y };
   }

   getCollisionBoxes() {
      if (this.material !== 'HARD' || !this.stuck) return [];
      let size = this.G * RC.COLLISION_BOX_RATIO;
      let half = size / 2;
      return this.nodes.map(n => ({
         x: n.x - half, y: n.y - half, w: size, h: size,
      }));
   }

   // 渲染

   display() {
      if (this.nodes.length === 0) return;

      // 绳线
      stroke(this.color);
      strokeWeight(this.material === 'HARD'
         ? max(RC.HARD_STROKE_MIN, this.G * RC.HARD_STROKE_RATIO)
         : max(RC.STROKE_MIN, this.G * RC.STROKE_RATIO));
      noFill();

      beginShape();
      for (let n of this.nodes) vertex(n.x, n.y);
      if (this.isExtending) vertex(this.tip.x, this.tip.y);
      endShape();

      // 端点圆点
      noStroke();
      fill(this.color);
      if (this.stuck) {
         let dot = this.G * RC.ANCHOR_DOT_RATIO;
         ellipse(this.tip.x, this.tip.y, dot, dot);
      } else if (!this.retracting) {
         let dot = this.G * RC.TIP_DOT_RATIO;
         ellipse(this.tip.x, this.tip.y, dot, dot);
      }
   }

   // 内部: 发射

   _advanceTip(level) {
      let tip = this.tip;
      tip.vy += RC.TIP_GRAVITY * RC.HEAD_MASS;
      tip.vx *= RC.TIP_AIR_DRAG;
      tip.vy *= RC.TIP_AIR_DRAG;

      let oldX = tip.x, oldY = tip.y;
      let newX = oldX + tip.vx, newY = oldY + tip.vy;

      let hit = level.rayCast(oldX, oldY, newX, newY);
      if (hit) {
         this._stickAt(hit.x, hit.y);
         return;
      }

      tip.x = newX;
      tip.y = newY;

      if (dist(this.lastNode.x, this.lastNode.y, newX, newY) >= this.nodeDist) {
         this.nodes.push(this._node(newX, newY, oldX, oldY));
      }
   }

   _stickAt(x, y) {
      this.stuck = true;
      this.tip.x = x;
      this.tip.y = y;
      this.nodes.push(this._node(x, y));
      this.ropeLength = this.nodeDist * (this.nodes.length - 1);
   }

   // 内部: 收回

   _retractOneNode() {
      if (++this._retractTimer < RC.RETRACT_INTERVAL) return;
      this._retractTimer = 0;
      this.nodes.pop();

      if (this.nodes.length === 0) {
         this.retracting = false;
         this.stuck = false;
      }
   }

   // 内部: 物理模拟

   _simulate(player, level) {
      if (this.nodes.length < 2) return;
      this._pinFixedEnds(player);

      if (this.material === 'HARD') {
         this._integrateStraight();
      } else {
         this._integrateVerlet(level);
      }
      this._solveConstraints();
   }

   _pinFixedEnds(player) {
      this._pin(this.nodes[0], player.cx(), player.cy());
      if (this.stuck) {
         this._pin(this.lastNode, this.tip.x, this.tip.y);
      }
   }

   /** 硬绳: 中间节点线性插值到首尾直线上 */
   _integrateStraight() {
      let first = this.nodes[0];
      let last = this.lastNode;
      let count = this.nodes.length;
      let endIdx = this.stuck ? count - 1 : count;

      for (let i = 1; i < endIdx; i++) {
         let n = this.nodes[i];
         let t = i / (count - 1);
         n.oldx = n.x;
         n.oldy = n.y;
         n.x = lerp(first.x, last.x, t);
         n.y = lerp(first.y, last.y, t);
      }
   }

   /** 软绳: Verlet 积分 (惯性 + 重力 + 碰墙回退) */
   _integrateVerlet(level) {
      let endIdx = this.stuck ? this.nodes.length - 1 : this.nodes.length;
      let gravity = RC.NODE_GRAVITY;
      if (this.isExtending) gravity *= RC.EXTENDING_GRAVITY_SCALE;

      for (let i = 1; i < endIdx; i++) {
         let n = this.nodes[i];
         let vx = (n.x - n.oldx) * RC.VERLET_DAMPING;
         let vy = (n.y - n.oldy) * RC.VERLET_DAMPING;
         let prevX = n.x, prevY = n.y;

         n.x += vx;
         n.y += vy + gravity;

         if (level.isPointSolid(n.x, n.y)) {
            n.x = prevX;
            n.y = prevY;
         }
         n.oldx = prevX;
         n.oldy = prevY;
      }
   }

   /** 距离约束: 保持相邻节点间距 = nodeDist */
   _solveConstraints() {
      let count = this.nodes.length;
      let lastIdx = count - 1;

      for (let k = 0; k < RC.STIFFNESS; k++) {
         for (let i = 0; i < lastIdx; i++) {
            let A = this.nodes[i];
            let B = this.nodes[i + 1];
            let dx = B.x - A.x, dy = B.y - A.y;
            let d = sqrt(dx * dx + dy * dy);
            if (d === 0) continue;

            let f = (this.nodeDist - d) / d * RC.CONSTRAINT_FACTOR;
            let ox = dx * f, oy = dy * f;

            if (i !== 0) { A.x -= ox; A.y -= oy; }
            if (!(i + 1 === lastIdx && this.stuck)) { B.x += ox; B.y += oy; }
         }
      }
   }

   // 内部: 玩家约束

   /** 硬绳: 双向弹簧 (太远拉回, 太近推开) */
   _applyHardSpring(player, curDist) {
      let diff = curDist - this.ropeLength;
      if (abs(diff) <= RC.HARD_SPRING_THRESHOLD) return;

      let a = atan2(this.tip.y - player.cy(), this.tip.x - player.cx());
      let f = diff * RC.HARD_SPRING_STRENGTH;
      player.vx = (player.vx + cos(a) * f) * RC.HARD_SPRING_DAMPING;
      player.vy = (player.vy + sin(a) * f) * RC.HARD_SPRING_DAMPING;
   }

   /** 软绳: 超出绳长时单向拉回 */
   _applySoftConstraint(player, curDist) {
      if (curDist <= this.ropeLength) return;

      let a = atan2(player.cy() - this.tip.y, player.cx() - this.tip.x);
      let targetX = this.tip.x + cos(a) * this.ropeLength;
      let targetY = this.tip.y + sin(a) * this.ropeLength;
      player.vx = (player.vx + (targetX - player.cx()) * RC.PULL_STRENGTH) * RC.PULL_DAMPING;
      player.vy = (player.vy + (targetY - player.cy()) * RC.PULL_STRENGTH) * RC.PULL_DAMPING;
   }
}