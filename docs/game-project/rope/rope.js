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
      this.extending = false
      this.material = (ropeColor.toString() === color(0, 255, 255).toString()) ? 'HARD' : 'SOFT';

      // 绳头抛射物
      this.tip = { x: 0, y: 0, vx: 0, vy: 0 };
      this._retractTimer = 0;

      // 表面接触节点索引 (每帧由 _solveConstraints 更新)
      this._pinnedIndices = [];

      // 派生常量
      this.nodeDist = this.G * RC.NODE_SPACING_GRIDS;
      this.maxNodes = Math.floor((this.G * RC.MAX_LENGTH_GRIDS) / this.nodeDist);
      this.maxLen = this.G * RC.MAX_LENGTH_GRIDS;
      this.minLen = this.G * RC.MIN_LENGTH_GRIDS;
      this.launchSpeed = this.G * RC.LAUNCH_SPEED_GRIDS;
      this.ropeLength = 0;
      this._effectiveMaxLen = this.maxLen;

      // sound
      this.fireSound = resources.sounds.rope;
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

   _insertAfterFirst() {
      let first = this.nodes[0];
      let second = this.nodes[1];
      this.nodes.splice(1, 0,
         this._node((first.x + second.x) / 2, (first.y + second.y) / 2));
   }

   _removeAfterFirst() {
      if (this.nodes.length > 2) {
         this.nodes.splice(1, 1);
      }
   }

   _getChainPathLength() {
      let total = 0;
      for (let i = 0; i < this.nodes.length - 1; i++) {
         let a = this.nodes[i], b = this.nodes[i + 1];
         total += dist(a.x, a.y, b.x, b.y);
      }
      // EXTENDING 时加上 lastNode 到飞行 tip 的距离
      if (!this.stuck && !this.retracting) {
         total += dist(this.lastNode.x, this.lastNode.y, this.tip.x, this.tip.y);
      }
      return total;
   }

   _maintainStrandLength() {
      if (this.nodes.length < 2) return;

      // 首次进入 STRAND 时记录当前路径长度作为固定绳长
      if (this.ropeLength <= 0) {
         let chainLen = this.nodeDist * (this.nodes.length - 1);
         let directDist = dist(this.nodes[0].x, this.nodes[0].y, this.tip.x, this.tip.y);
         this.ropeLength = Math.max(chainLen, directDist, this._getChainPathLength());
         this._effectiveMaxLen = Math.max(this.ropeLength, this.maxLen);
      }

      let pathLen = this._getChainPathLength();
      let diff = pathLen - this.ropeLength;

      if (diff > 0) {
         // 超出绳长: 从 tip 端沿链条将节点向 player 侧收拢 (不删除节点)
         let excess = diff;
         for (let i = this.nodes.length - 1; i > 0 && excess > 0; i--) {
            let curr = this.nodes[i];
            let prev = this.nodes[i - 1];
            let segLen = dist(prev.x, prev.y, curr.x, curr.y);

            if (segLen <= excess) {
               // 整段收拢: 将节点折叠到前一节点位置
               curr.x = prev.x;
               curr.y = prev.y;
               curr.oldx = curr.x;
               curr.oldy = curr.y;
               excess -= segLen;
            } else {
               let ratio = excess / segLen;
               curr.x = lerp(curr.x, prev.x, ratio);
               curr.y = lerp(curr.y, prev.y, ratio);
               curr.oldx = curr.x;
               curr.oldy = curr.y;
               excess = 0;
            }
         }
      } else if (diff < 0 && this.material === 'HARD') {
         // HARD 低于绳长: 将 tip 沿 prev→last 方向延伸补足差值
         let last = this.lastNode;
         let prev = this.nodes[this.nodes.length - 2];
         let dx = last.x - prev.x;
         let dy = last.y - prev.y;
         let segLen = Math.sqrt(dx * dx + dy * dy);

         if (segLen > 0) {
            let extend = -diff;
            last.x += (dx / segLen) * extend;
            last.y += (dy / segLen) * extend;
            last.oldx = last.x;
            last.oldy = last.y;
         }
      }

      // 同步 tip 位置
      this.tip.x = this.lastNode.x;
      this.tip.y = this.lastNode.y;
   }

   // 状态查询

   get isIdle() { return this.nodes.length === 0; }

   get state() {
      if (this.nodes.length === 0) return "IDLE";
      if (this.retracting) return "RETRACTING";
      if (this.stuck) return "SWINGING";
      if (this.extending) return "EXTENDING";
      return "STRAND";
   }

   set state(value) {
      if (value === "IDLE") this.reset();
      else if (value === "RETRACTING") {
         this.extending = false;
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
         this.extending = false;
         return;
      }
      if (this.color.toString() === color(0, 255, 255).toString()) {
         if (!this.fireSound.ropeblue.isPlaying()) this.fireSound.ropeblue.play();
      }
      if (this.color.toString() === color(255, 100, 100).toString()) {
         if (!this.fireSound.ropered.isPlaying()) this.fireSound.ropered.play();
      }
      let angle = atan2(ty - py, tx - px);
      this.tip.x = px;
      this.tip.y = py;
      this.tip.vx = cos(angle) * this.launchSpeed;
      this.tip.vy = sin(angle) * this.launchSpeed;

      this.nodes = [this._node(px, py)];
      this.stuck = false;
      this.retracting = false;
      this.extending = true;
      this._retractTimer = 0;
   }

   reset() {
      this.nodes = [];
      this.stuck = false;
      this.retracting = false;
      this.extending = false;
      this.ropeLength = 0;
      this._effectiveMaxLen = this.maxLen;
      this._retractTimer = 0;
      this._pinnedIndices = [];
   }

   toggleMaterial() {
      this.material = (this.material === 'SOFT') ? 'HARD' : 'SOFT';
   }

   changeLength(amount) {
      if (this.nodes.length < 2) return;
      let s = this.state;
      if (s !== 'SWINGING' && s !== 'STRAND') return;
      if (amount > 0 && this.ropeLength >= this._effectiveMaxLen) return;
      if (amount < 0 && this.ropeLength <= this.minLen) {
         if (s === 'STRAND') this.state = "RETRACTING";
         return;
      }
      this.ropeLength = constrain(this.ropeLength + amount, this.minLen, this._effectiveMaxLen);
      this._syncNodeCount();
   }

   _syncNodeCount() {
      let target = constrain(
         Math.floor(this.ropeLength / this.nodeDist) + 1,
         2, this.maxNodes
      );
      // SWINGING: tip 钉在墙上, 从玩家端增减节点 (放绳/收绳)
      // 其他状态: 从 tip 端增减 (发射/strand)
      if (this.stuck) {
         while (this.nodes.length > target) this._removeAfterFirst();
         while (this.nodes.length < target) this._insertAfterFirst();
      } else {
         while (this.nodes.length > target) this._removeBeforeLast();
         while (this.nodes.length < target) this._insertBeforeLast();
      }
   }

   // 每帧更新

   update(player, level) {
      if (this.nodes.length === 0) return;

      if (this.extending) this._advanceTip(level);

      if (this.retracting) {
         this._retractOneNode();
         if (this.nodes.length === 0) {
            this.reset();
            return;
         }
      }

      this._simulate(player, level);

      if (this.state === "STRAND") {
         this._maintainStrandLength();
      }

      this.tip.x = this.lastNode.x;
      this.tip.y = this.lastNode.y;
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
      if (this.extending) vertex(this.tip.x, this.tip.y);
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
         if (this.nodes.length >= this.maxNodes) {
            this.extending = false;
         }
      }
   }

   _stickAt(x, y) {
      this.stuck = true;
      this.extending = false;
      this.retracting = false;
      this.tip.x = x;
      this.tip.y = y;
      this.nodes.push(this._node(x, y));
      //  绳长限制为理论长度、直线距离、实际路径长度中的最大值
      let chainLen = this.nodeDist * (this.nodes.length - 1);
      let directDist = dist(this.nodes[0].x, this.nodes[0].y, x, y);
      let pathLen = this._getChainPathLength();
      this.ropeLength = Math.max(chainLen, directDist, pathLen);
      this._effectiveMaxLen = Math.max(this.ropeLength, this.maxLen);
   }

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
      if (this.extending) gravity *= RC.EXTENDING_GRAVITY_SCALE;

      for (let i = 1; i < endIdx; i++) {
         let n = this.nodes[i];

         // 上一帧被钉在表面上的节点: 抑制 Verlet 隐含速度
         // 只保留重力, 让约束求解器决定它是否应该脱离表面
         let wasPinned = this._pinnedIndices.includes(i);

         let vx, vy;
         if (wasPinned) {
            vx = 0;
            vy = gravity;
         } else {
            vx = (n.x - n.oldx) * RC.VERLET_DAMPING;
            vy = (n.y - n.oldy) * RC.VERLET_DAMPING + gravity;
         }

         let prevX = n.x, prevY = n.y;

         let newX = n.x + vx;
         let newY = n.y + vy;

         // 分轴碰撞: 允许沿表面滑动而非完全回退
         let solidXY = level.isPointSolid(newX, newY);
         if (solidXY && this.state !== "EXTENDING") {
            let solidX = level.isPointSolid(newX, prevY);
            let solidY = level.isPointSolid(prevX, newY);
            if (!solidX && solidY) {
               n.x = newX;
               n.y = prevY;
            } else if (solidX && !solidY) {
               n.x = prevX;
               n.y = newY;
            } else {
               n.x = prevX;
               n.y = prevY;
            }
         }
         else {
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
                     pinned[i] = true;
                  }
               }
            }
         }
      }

      // 持久化 pinned 状态, 供 _getEffectiveAnchor 使用
      this._pinnedIndices = [];
      for (let i = 0; i < count; i++) {
         if (pinned[i]) this._pinnedIndices.push(i);
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

      // 保存推出前的 Verlet 隐含速度
      let impliedVx = node.x - node.oldx;
      let impliedVy = node.y - node.oldy;

      // 四个方向的穿透深度
      let left = node.x - tile.x;
      let right = (tile.x + tile.w) - node.x;
      let top = node.y - tile.y;
      let bottom = (tile.y + tile.h) - node.y;

      let solidLeft = level.isSolidAt(col - 1, row);
      let solidRight = level.isSolidAt(col + 1, row);
      let solidUp = level.isSolidAt(col, row - 1);
      let solidDown = level.isSolidAt(col, row + 1);

      let candidates = [];
      if (!solidUp) candidates.push({ axis: 'y', depth: top, target: tile.y });
      if (!solidDown) candidates.push({ axis: 'y', depth: bottom, target: tile.y + tile.h });
      if (!solidLeft) candidates.push({ axis: 'x', depth: left, target: tile.x });
      if (!solidRight) candidates.push({ axis: 'x', depth: right, target: tile.x + tile.w });

      let pushAxis = null;

      if (candidates.length === 0) {
         let minD = Math.min(left, right, top, bottom);
         if (minD === top) { node.y = tile.y; pushAxis = 'y'; }
         else if (minD === bottom) { node.y = tile.y + tile.h; pushAxis = 'y'; }
         else if (minD === left) { node.x = tile.x; pushAxis = 'x'; }
         else { node.x = tile.x + tile.w; pushAxis = 'x'; }
      } else {
         candidates.sort((a, b) => a.depth - b.depth);
         let best = candidates[0];
         pushAxis = best.axis;
         if (best.axis === 'x') node.x = best.target;
         else node.y = best.target;
      }

      // 保留切向速度、消除法向速度 (允许沿表面滑动)
      let tangentialDamp = 0.4;
      if (pushAxis === 'x') {
         node.oldx = node.x;
         node.oldy = node.y - impliedVy * tangentialDamp;
      } else {
         node.oldx = node.x - impliedVx * tangentialDamp;
         node.oldy = node.y;
      }
   }

   // 内部: 玩家约束

   /**
    * 获取"有效锚点": 绳子绕过拐角时, 最近的表面接触节点充当滑轮
    * 玩家应从该接触点摆荡, 而非从远端 tip 直接拉
    */
   _getEffectiveAnchor() {
      if (this.nodes.length < 2) return null;

      // 从玩家端 (index 1) 向 tip 端遍历, 找第一个表面接触节点
      let anchorIdx = this.nodes.length - 1; // 默认: tip
      for (let i = 1; i < this.nodes.length; i++) {
         if (this._pinnedIndices.includes(i)) {
            anchorIdx = i;
            break;
         }
      }

      let anchor = this.nodes[anchorIdx];

      // 计算从有效锚点到 tip 的已用绳长
      let usedLen = 0;
      for (let i = anchorIdx; i < this.nodes.length - 1; i++) {
         let a = this.nodes[i], b = this.nodes[i + 1];
         usedLen += Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
      }

      let freeLen = Math.max(this.nodeDist, this.ropeLength - usedLen);

      return { x: anchor.x, y: anchor.y, freeLength: freeLen };
   }

   /** 对玩家施加绳索约束 (粘住时生效) */
   applyPhysics(player) {
      if (!this.stuck || this.nodes.length < 2) return;

      let anchor = this._getEffectiveAnchor();
      if (!anchor) return;

      let d = dist(player.cx(), player.cy(), anchor.x, anchor.y);

      if (this.material === 'HARD') {
         this._applyHardSpring(player, d, anchor);
      } else {
         this._applySoftConstraint(player, d, anchor);
      }
   }

   /** 硬绳: 双向弹簧 (太远拉回, 太近推开) */
   _applyHardSpring(player, curDist, anchor) {
      let diff = curDist - anchor.freeLength;
      if (abs(diff) <= RC.HARD_SPRING_THRESHOLD) return;

      let a = atan2(anchor.y - player.cy(), anchor.x - player.cx());
      let f = diff * RC.HARD_SPRING_STRENGTH;
      player.vx = (player.vx + cos(a) * f) * RC.HARD_SPRING_DAMPING;
      player.vy = (player.vy + sin(a) * f) * RC.HARD_SPRING_DAMPING;
   }

   /** 软绳: Rope Joint — 超出绳长时硬约束 */
   _applySoftConstraint(player, curDist, anchor) {
      if (curDist <= anchor.freeLength) return;

      let dx = player.cx() - anchor.x;
      let dy = player.cy() - anchor.y;
      if (curDist === 0) return;
      let nx = dx / curDist;
      let ny = dy / curDist;

      let targetCX = anchor.x + nx * anchor.freeLength;
      let targetCY = anchor.y + ny * anchor.freeLength;
      player.x = targetCX - player.w / 2;
      player.y = targetCY - player.h / 2;

      let radialV = player.vx * nx + player.vy * ny;
      if (radialV > 0) {
         player.vx -= radialV * nx;
         player.vy -= radialV * ny;
      }
   }
}