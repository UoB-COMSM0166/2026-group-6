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
      else if (value === "SWINGING") {
         if (this.stuck === true) return;
         this._stickAt(this.tip.x, this.tip.y);
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

   // 每帧更新

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
      //  绳长限制为理论和实际长度的较大值
      let chainLen = this.nodeDist * (this.nodes.length - 1);
      let directDist = dist(this.nodes[0].x, this.nodes[0].y, x, y);
      this.ropeLength = Math.max(chainLen, directDist);
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
      this._solveConstraints(level);
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

   /** 软绳: Verlet 积分 (惯性 + 重力 + 滑动碰撞) */
   _integrateVerlet(level) {
      let endIdx = this.stuck ? this.nodes.length - 1 : this.nodes.length;
      let gravity = RC.NODE_GRAVITY;
      if (this.isExtending) gravity *= RC.EXTENDING_GRAVITY_SCALE;

      for (let i = 1; i < endIdx; i++) {
         let n = this.nodes[i];
         let vx = (n.x - n.oldx) * RC.VERLET_DAMPING;
         let vy = (n.y - n.oldy) * RC.VERLET_DAMPING;
         let prevX = n.x, prevY = n.y;

         let newX = n.x + vx;
         let newY = n.y + vy + gravity;

         // 分轴碰撞: 允许沿表面滑动而非完全回退
         let solidXY = level.isPointSolid(newX, newY);
         if (solidXY) {
            let solidX = level.isPointSolid(newX, prevY);
            let solidY = level.isPointSolid(prevX, newY);
            if (!solidX && solidY) {
               // Y方向被挡, 只移动X
               n.x = newX;
               n.y = prevY;
            } else if (solidX && !solidY) {
               // X方向被挡, 只移动Y
               n.x = prevX;
               n.y = newY;
            } else {
               // 两个方向都被挡, 不移动
               n.x = prevX;
               n.y = prevY;
            }
         } else {
            n.x = newX;
            n.y = newY;
         }

         n.oldx = prevX;
         n.oldy = prevY;
      }
   }

   /**
    *    ropejoint: 只有超过距离才开始更改node位置，其他时候将可以动的点平分的拉回中心
    *    核心改进: pinned[] 数组追踪「接触地表的节点」
    *    接触地表的节点在约束求解中被视为固定锚点
    *    使绳子自然搭在地块上、绕过拐角
    */
   _solveConstraints(level) {
      let count = this.nodes.length;
      let lastIdx = count - 1;

      // 标记固定节点: 玩家端 + 锚点端 + 接触地表的节点
      let pinned = new Array(count).fill(false);
      pinned[0] = true;                           // 玩家端始终固定
      if (this.stuck) pinned[lastIdx] = true;     // 锚点端始终固定

      for (let k = 0; k < RC.STIFFNESS; k++) {
         // ── 距离约束 ──
         for (let i = 0; i < lastIdx; i++) {
            let A = this.nodes[i];
            let B = this.nodes[i + 1];
            let dx = B.x - A.x, dy = B.y - A.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d === 0 || d <= this.nodeDist) continue;
            let diff = (this.nodeDist - d) / d;
            let ox = dx * diff;
            let oy = dy * diff;

            let aFixed = pinned[i];
            let bFixed = pinned[i + 1];

            if (aFixed && bFixed) {
               // 两端都固定, 跳过
               continue;
            } else if (aFixed) {
               // 只有 B 可以移动 → 100% 修正量给 B
               B.x += ox;
               B.y += oy;
            } else if (bFixed) {
               // 只有 A 可以移动 → 100% 修正量给 A
               A.x -= ox;
               A.y -= oy;
            } else {
               // 双向各承担 50%  ax = (ax+bx)/2-(ax-bx)*ratio*0.5
               A.x -= ox * 0.5;
               A.y -= oy * 0.5;
               B.x += ox * 0.5;
               B.y += oy * 0.5;
            }
         }

         // ── 碰撞分离 (每次约束迭代后) ──
         if (this.material == "SOFT") {
            if (level) {
               let endIdx = this.stuck ? count - 1 : count;
               for (let i = 1; i < endIdx; i++) {
                  if (level.isPointSolid(this.nodes[i].x, this.nodes[i].y)) {
                     this._pushNodeOutOfSolid(this.nodes[i], level);
                     pinned[i] = true;   // 标记为地表接触 → 后续迭代视为固定点
                  }
               }
            }
         }
      }
   }

   /**
    * 将单个节点从固体 Tile 中推出 (沿最小穿透轴)
    * 推出后钉住 oldx/oldy 消除 Verlet 隐含速度
    */
   _pushNodeOutOfSolid(node, level) {
      let { col, row } = level.worldToGrid(node.x, node.y);
      let tile = level.getTileAt(col, row);
      if (!tile || !tile.isSolid) return;

      // 四个方向的穿透深度
      let left = node.x - tile.x;
      let right = (tile.x + tile.w) - node.x;
      let top = node.y - tile.y;
      let bottom = (tile.y + tile.h) - node.y;
      let minD = Math.min(left, right, top, bottom);

      // 沿最小穿透方向推出
      if (minD === top) node.y = tile.y;
      else if (minD === bottom) node.y = tile.y + tile.h;
      else if (minD === left) node.x = tile.x;
      else node.x = tile.x + tile.w;

      // 钉住: 消除隐含速度, 防止振荡穿墙
      node.oldx = node.x;
      node.oldy = node.y;
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

   /** 软绳: Rope Joint — 超出绳长时硬约束 */
   _applySoftConstraint(player, curDist) {
      if (curDist <= this.ropeLength) return;

      // 方向: 锚点 → 玩家
      let dx = player.cx() - this.tip.x;
      let dy = player.cy() - this.tip.y;
      if (curDist === 0) return;
      let nx = dx / curDist;
      let ny = dy / curDist;

      // 硬约束: 直接把玩家钳制到绳长圆上
      let targetCX = this.tip.x + nx * this.ropeLength;
      let targetCY = this.tip.y + ny * this.ropeLength;
      player.x = targetCX - player.w / 2;
      player.y = targetCY - player.h / 2;

      // 去除径向外推速度分量, 只保留切向 (允许摆荡)
      let radialV = player.vx * nx + player.vy * ny;
      if (radialV > 0) {
         player.vx -= radialV * nx;
         player.vy -= radialV * ny;
      }
   }
}