const RC = GameConfig.Rope;

class Rope {
   /**
    * @param {p5.Color} ropeColor
    */
   constructor(ropeColor) {
      this.G = GameConfig.World.GRID_SIZE;
      this.color = ropeColor;

      //  nodes[0] = Player end
      //  nodes[last] = Tip end
      /** @type {Array<{x:number, y:number, oldx:number, oldy:number}>} */
      this.nodes = [];

      /** @type {"IDLE"|"EXTENDING"|"SWINGING"|"STRAND"|"RETRACTING"} */
      this._state = "IDLE";

      this.material = (ropeColor.toString() === color(0, 255, 255).toString()) ? 'HARD' : 'SOFT';

      // rope head (The end far away from the players)
      this.tip = { x: 0, y: 0, vx: 0, vy: 0 };
      this._retractTimer = 0;

      // Surface contact node index
      this._pinnedIndices = [];

      // Derived constant
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

   // verlet nodes
   _node(x, y, ox, oy) {
      return { x, y, oldx: ox ?? x, oldy: oy ?? y };
   }

   // Pin the node to the specified position
   // also can eliminate Verlet implicit velocity
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
      // EXTENDING or STRAND: tip may be ahead of lastNode
      if (this._state === "EXTENDING" || this._state === "STRAND") {
         total += dist(this.lastNode.x, this.lastNode.y, this.tip.x, this.tip.y);
      }
      return total;
   }

   _maintainStrandLength() {
      if (this.nodes.length < 2) return;

      // Record the current path length as the fixed rope
      // length when entering STRAND for the first time.
      if (this.ropeLength <= 0) {
         let chainLen = this.nodeDist * (this.nodes.length - 1);
         let directDist = dist(this.nodes[0].x, this.nodes[0].y, this.tip.x, this.tip.y);
         this.ropeLength = Math.max(chainLen, directDist, this._getChainPathLength());
         this._effectiveMaxLen = Math.max(this.ropeLength, this.maxLen);
      }

      let pathLen = this._getChainPathLength();
      let diff = pathLen - this.ropeLength;

      if (diff > 0) {
         // Exceeding the rope max length
         let excess = diff;
         for (let i = this.nodes.length - 1; i > 0 && excess > 0; i--) {
            let curr = this.nodes[i];
            let prev = this.nodes[i - 1];
            let segLen = dist(prev.x, prev.y, curr.x, curr.y);

            if (segLen <= excess) {
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

      this.tip.x = this.lastNode.x;
      this.tip.y = this.lastNode.y;
   }

   // State Getter

   get isIdle() { return this._state === "IDLE"; }

   get state() { return this._state; }

   // State Setter

   set state(value) {
      if (value === this._state) return;

      switch (value) {
         case "IDLE":
            this.reset();
            break;
         case "RETRACTING":
            this._state = "RETRACTING";
            break;
         case "SWINGING":
            if (this._state === "SWINGING") return;
            if (this._state === "STRAND") {
               // fix tip end
               this._state = "SWINGING";
               this.tip.x = this.lastNode.x;
               this.tip.y = this.lastNode.y;
               this._pin(this.lastNode, this.tip.x, this.tip.y);

               // actual rope len
               let chainLen = this.nodeDist * (this.nodes.length - 1);
               let directDist = dist(this.nodes[0].x, this.nodes[0].y,
                  this.tip.x, this.tip.y);
               let pathLen = this._getChainPathLength();
               this.ropeLength = Math.max(chainLen, directDist, pathLen);
               this._effectiveMaxLen = Math.max(this.ropeLength, this.maxLen);

               this._pinnedIndices = [];
            } else {
               this._stickAt(this.tip.x, this.tip.y);
            }
            break;
      }
   }

   // operation

   fire(px, py, tx, ty) {
      if (!this.isIdle) {
         this._state = "RETRACTING";
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
      this._state = "EXTENDING";
      this._retractTimer = 0;
   }

   reset() {
      this.nodes = [];
      this._state = "IDLE";
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
      let s = this._state;
      if (s !== 'SWINGING' && s !== 'STRAND') return;
      if (amount > 0 && this.ropeLength >= this._effectiveMaxLen) return;
      if (amount < 0 && this.ropeLength <= this.minLen) {
         if (s === 'STRAND') this._state = "RETRACTING";
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
      if (this._state === "SWINGING") {
         while (this.nodes.length > target) this._removeAfterFirst();
         while (this.nodes.length < target) this._insertAfterFirst();
      } else {
         while (this.nodes.length > target) this._removeBeforeLast();
         while (this.nodes.length < target) this._insertBeforeLast();
      }
   }

   update(player, level) {
      if (this._state === "IDLE") return;

      if (this._state === "EXTENDING") this._advanceTip(level);

      if (this._state === "RETRACTING") {
         this._retractOneNode();
         if (this.nodes.length === 0) {
            this.reset();
            return;
         }
      }

      this._simulate(player, level);

      if (this._state === "STRAND") {
         this._maintainStrandLength();
      }

      this.tip.x = this.lastNode.x;
      this.tip.y = this.lastNode.y;
   }

   // query

   getTip() {
      return { x: this.tip.x, y: this.tip.y };
   }

   getCollisionBoxes() {
      if (this.material !== 'HARD' || this._state !== "SWINGING") return [];
      let size = this.G * RC.COLLISION_BOX_RATIO;
      let half = size / 2;
      return this.nodes.map(n => ({
         x: n.x - half, y: n.y - half, w: size, h: size,
      }));
   }

   // render

   display() {
      if (this._state === "IDLE") return;

      // rope
      stroke(this.color);
      strokeWeight(this.material === 'HARD'
         ? max(RC.HARD_STROKE_MIN, this.G * RC.HARD_STROKE_RATIO)
         : max(RC.STROKE_MIN, this.G * RC.STROKE_RATIO));
      noFill();

      beginShape();
      for (let n of this.nodes) vertex(n.x, n.y);
      if (this._state === "EXTENDING") vertex(this.tip.x, this.tip.y);
      endShape();

      // tip shape
      noStroke();
      fill(this.color);
      if (this._state === "SWINGING") {
         let dot = this.G * RC.ANCHOR_DOT_RATIO;
         ellipse(this.tip.x, this.tip.y, dot, dot);
      } else if (this._state !== "RETRACTING") {
         let dot = this.G * RC.TIP_DOT_RATIO;
         ellipse(this.tip.x, this.tip.y, dot, dot);
      }
   }

   // fire

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
            this._state = "STRAND";
         }
      }
   }

   _stickAt(x, y) {
      this._state = "SWINGING";
      this.tip.x = x;
      this.tip.y = y;
      this.nodes.push(this._node(x, y));
      //  rope maxlen is max value of theoretical length, straight-line distance, actual path
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
         this._state = "IDLE";
      }
   }

   // physics stimulation

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
      if (this._state === "SWINGING") {
         this._pin(this.lastNode, this.tip.x, this.tip.y);
      }
   }

   // hard rope: The intermediate nodes are linearly interpolated 
   // onto the straight line connecting the first and last nodes.
   _integrateStraight() {
      let first = this.nodes[0];
      let last = this.lastNode;
      let count = this.nodes.length;
      let endIdx = this._state === "SWINGING" ? count - 1 : count;

      for (let i = 1; i < endIdx; i++) {
         let n = this.nodes[i];
         let t = i / (count - 1);
         n.oldx = n.x;
         n.oldy = n.y;
         n.x = lerp(first.x, last.x, t);
         n.y = lerp(first.y, last.y, t);
      }
   }

   // soft rope: Verlet integration 
   // add gravity and inertia
   _integrateVerlet(level) {
      let endIdx = this._state === "SWINGING" ? this.nodes.length - 1 : this.nodes.length;
      let gravity = RC.NODE_GRAVITY;
      if (this._state === "EXTENDING") gravity *= RC.EXTENDING_GRAVITY_SCALE;

      for (let i = 1; i < endIdx; i++) {
         let n = this.nodes[i];

         // The node pinned to the surface in the previous 
         // frame: eliminate Verlet implicit velocity
         // Only retain gravity and let the constraint 
         // solver decide whether it should detach from the surface
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

         // collision
         let solidXY = level.isPointSolid(newX, newY);
         if (solidXY && this._state !== "EXTENDING") {
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
    *   use ropejoint formula
    */
   _solveConstraints(level) {
      let count = this.nodes.length;
      let lastIdx = count - 1;

      // Mark fixed nodes: 
      // player end + anchor end + nodes in contact with the ground surface
      let pinned = new Array(count).fill(false);
      pinned[0] = true;
      if (this._state === "SWINGING") pinned[lastIdx] = true;

      for (let k = 0; k < RC.STIFFNESS; k++) {
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
               // Both ends are fixed
               continue;
            } else if (aFixed) {
               // only B node can move
               B.x += ox;
               B.y += oy;
            } else if (bFixed) {
               // only A node can move
               A.x -= ox;
               A.y -= oy;
            } else {
               // A and B nodes are distributed each 50% movement
               A.x -= ox * 0.5;
               A.y -= oy * 0.5;
               B.x += ox * 0.5;
               B.y += oy * 0.5;
            }
         }

         // collision
         if (this.material == "SOFT") {
            if (level) {
               let endIdx = this._state === "SWINGING" ? count - 1 : count;
               for (let i = 1; i < endIdx; i++) {
                  if (level.isPointSolid(this.nodes[i].x, this.nodes[i].y)) {
                     this._pushNodeOutOfSolid(this.nodes[i], level);
                     pinned[i] = true;
                  }
               }
            }
         }
      }

      this._pinnedIndices = [];
      for (let i = 0; i < count; i++) {
         if (pinned[i]) this._pinnedIndices.push(i);
      }
   }

   /**
    * Push a single node out of the solid Tile
    * if out of solid, Suppress Verlet implicit velocity
    */
   _pushNodeOutOfSolid(node, level) {
      let { col, row } = level.worldToGrid(node.x, node.y);
      let tile = level.getTileAt(col, row);
      if (!tile || !tile.isSolid) return;

      // save verlet implicit velocity
      let impliedVx = node.x - node.oldx;
      let impliedVy = node.y - node.oldy;

      // four dir
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

      // Maintain the tangential velocity and eliminate the normal velocity
      let tangentialDamp = 0.4;
      if (pushAxis === 'x') {
         node.oldx = node.x;
         node.oldy = node.y - impliedVy * tangentialDamp;
      } else {
         node.oldx = node.x - impliedVx * tangentialDamp;
         node.oldy = node.y;
      }
   }

   // Player Constrain

   /**
    * The nearest surface contact node acts as a pulley.
    */
   _getEffectiveAnchor() {
      if (this.nodes.length < 2) return null;

      let anchorIdx = this.nodes.length - 1;
      for (let i = 1; i < this.nodes.length; i++) {
         if (this._pinnedIndices.includes(i)) {
            anchorIdx = i;
            break;
         }
      }

      let anchor = this.nodes[anchorIdx];

      let usedLen = 0;
      for (let i = anchorIdx; i < this.nodes.length - 1; i++) {
         let a = this.nodes[i], b = this.nodes[i + 1];
         usedLen += Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
      }

      let freeLen = Math.max(this.nodeDist, this.ropeLength - usedLen);

      return { x: anchor.x, y: anchor.y, freeLength: freeLen };
   }

   applyPhysics(player) {
      if (this._state !== "SWINGING" || this.nodes.length < 2) return;

      let anchor = this._getEffectiveAnchor();
      if (!anchor) return;

      let d = dist(player.cx(), player.cy(), anchor.x, anchor.y);

      if (this.material === 'HARD') {
         this._applyHardSpring(player, d, anchor);
      } else {
         this._applySoftConstraint(player, d, anchor);
      }
   }

   // hard rope: Bidirectional spring
   _applyHardSpring(player, curDist, anchor) {
      let diff = curDist - anchor.freeLength;
      if (abs(diff) <= RC.HARD_SPRING_THRESHOLD) return;

      let a = atan2(anchor.y - player.cy(), anchor.x - player.cx());
      let f = diff * RC.HARD_SPRING_STRENGTH;
      player.vx = (player.vx + cos(a) * f) * RC.HARD_SPRING_DAMPING;
      player.vy = (player.vy + sin(a) * f) * RC.HARD_SPRING_DAMPING;
   }

   // soft rope: ropejoint constrain
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