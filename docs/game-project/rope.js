class Rope {
   constructor(color) {
      this.state = "IDLE";
      this.len = 0;
      this.nodes = [];
      this.nodeDist = GRID_SIZE / 2;
      // 设定最大长度
      this.maxLen = GRID_SIZE * 5;

      this.speed = GRID_SIZE * 0.8;
      this.angle = 0;
      this.anchor = { x: 0, y: 0 };
      this.color = color;
      this.material = 'SOFT';
      this.currentTip = { x: 0, y: 0 };
   }

   // 切换rope材质
   toggleMaterial(player) {
      this.material = (this.material === 'SOFT') ? 'HARD' : 'SOFT';
      if (this.state === "SWINGING") {
         if (this.material === 'HARD') this.generateStraightNodes(player);
         else this.nodeDist = GRID_SIZE / 2;
      }
   }

   generateStraightNodes(player) {
      let pX = player.cx(); let pY = player.cy();
      let distTotal = dist(pX, pY, this.anchor.x, this.anchor.y);
      this.nodeDist = GRID_SIZE / 2;
      let totalNodes = floor(distTotal / this.nodeDist);
      if (totalNodes < 2) totalNodes = 2;
      this.nodes = [];
      for (let i = 0; i < totalNodes; i++) {
         let t = i / (totalNodes - 1);
         let nx = lerp(this.anchor.x, pX, t);
         let ny = lerp(this.anchor.y, pY, t);
         this.nodes.push({ x: nx, y: ny, oldx: nx, oldy: ny });
      }
      this.len = distTotal;
   }

   // 严厉限制绳子长度变量maxLen
   changeLength(amount) {
      if (this.state !== "SWINGING") return;

      this.len += amount;
      this.len = constrain(this.len, GRID_SIZE, this.maxLen);

      if (this.material === 'HARD') {
         // 硬绳
      } else {
         // 软绳：根据被锁死的 this.len 重新计算节点间距
         if (this.nodes.length > 0) {
            this.nodeDist = this.len / this.nodes.length;
            // 限制节点间距，防止节点重叠或过疏
            this.nodeDist = constrain(this.nodeDist, GRID_SIZE * 0.1, GRID_SIZE);
         }
      }
   }

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

   update(player) {
      if (this.state === "EXTENDING") {
         let moveDist = this.speed;
         let reachedMax = false;
         if (this.len + moveDist >= this.maxLen) {
            moveDist = this.maxLen - this.len;
            reachedMax = true;
         }

         let nextX = this.currentTip.x + cos(this.angle) * moveDist;
         let nextY = this.currentTip.y + sin(this.angle) * moveDist;

         let hitResult = this.rayCastPlatforms(this.currentTip.x, this.currentTip.y, nextX, nextY);

         if (hitResult) {
            this.state = "SWINGING";
            this.anchor = { x: hitResult.x, y: hitResult.y };
            let distTotal = dist(player.cx(), player.cy(), this.anchor.x, this.anchor.y);
            this.len = distTotal;

            if (this.len > this.maxLen) {
               this.len = this.maxLen;
            }

            if (this.material === 'SOFT') {
               this.nodeDist = GRID_SIZE / 2;
               let totalNodes = floor(distTotal / this.nodeDist);
               if (totalNodes < 2) totalNodes = 2;
               this.nodes = [];
               for (let i = 0; i < totalNodes; i++) {
                  let t = i / (totalNodes - 1);
                  let nx = lerp(this.anchor.x, player.cx(), t);
                  let ny = lerp(this.anchor.y, player.cy(), t);
                  this.nodes.push({ x: nx, y: ny, oldx: nx, oldy: ny });
               }
            } else { this.generateStraightNodes(player); }
         } else {
            this.currentTip.x = nextX;
            this.currentTip.y = nextY;
            this.len += moveDist;
            if (reachedMax) this.state = "RETRACTING";
         }
      }
      else if (this.state === "RETRACTING") {
         this.len -= this.speed * 2;
         if (this.len <= 0) { this.len = 0; this.state = "IDLE"; }
      }
      else if (this.state === "SWINGING") {
         if (this.material === 'SOFT') this.simulateSoftPhysics(player);
         else this.simulateHardPhysics(player);
      }
   }

   // rope 和 platform 的接触
   rayCastPlatforms(x1, y1, x2, y2) {
      let closestHit = null;
      let minDst = Infinity;
      for (let p of platforms) {
         let hit = lineRectIntersect(x1, y1, x2, y2, p.x, p.y, p.w, p.h);
         if (hit) {
            let d = dist(x1, y1, hit.x, hit.y);
            if (d < minDst) { minDst = d; closestHit = hit; }
         }
      }
      return closestHit;
   }

   simulateSoftPhysics(player) {
      if (this.nodes.length < 2) return;
      this.nodes[0].x = this.anchor.x; this.nodes[0].y = this.anchor.y;
      let lastNode = this.nodes[this.nodes.length - 1];
      lastNode.x = player.cx(); lastNode.y = player.cy();

      for (let i = 1; i < this.nodes.length - 1; i++) {
         let node = this.nodes[i];
         let vx = (node.x - node.oldx) * 0.98; let vy = (node.y - node.oldy) * 0.98;
         let tempX = node.x; let tempY = node.y;
         node.x += vx; node.y += vy + 0.5;
         for (let p of platforms) {
            if (pointRect(node.x, node.y, p.x, p.y, p.w, p.h)) { node.x = tempX; node.y = tempY; }
         }
         node.oldx = tempX; node.oldy = tempY;
      }

      // 增加约束迭代次数，会让绳子的每一个节点都紧紧咬合
      // 极大减少因为重力导致的视觉拉伸
      for (let k = 0; k < 16; k++) {
         for (let i = 0; i < this.nodes.length - 1; i++) {
            let A = this.nodes[i]; let B = this.nodes[i + 1];
            let dx = B.x - A.x; let dy = B.y - A.y;
            let dst = sqrt(dx * dx + dy * dy);
            let diff = this.nodeDist - dst;
            if (dst === 0) continue;
            let offX = (dx * diff / dst) * 0.5; let offY = (dy * diff / dst) * 0.5;
            if (i !== 0) { A.x -= offX; A.y -= offY; }
            if (i + 1 !== this.nodes.length - 1) { B.x += offX; B.y += offY; }
         }
      }
   }

   simulateHardPhysics(player) {
      let pX = player.cx(); let pY = player.cy();
      let totalNodes = this.nodes.length;
      if (totalNodes < 2) return;
      for (let i = 0; i < totalNodes; i++) {
         let t = i / (totalNodes - 1);
         // 线性插值，缓慢过度
         this.nodes[i].x = lerp(this.anchor.x, pX, t);
         this.nodes[i].y = lerp(this.anchor.y, pY, t);
      }
   }

   // 设置最大半径约束
   applyPhysics(player) {
      if (this.state !== "SWINGING") return;

      // 计算当前主角离锚点有多远
      let currentDist = dist(player.cx(), player.cy(), this.anchor.x, this.anchor.y);

      // 如果距离超过了设定的绳子长度 (this.len)
      // 说明主角被重力拉得太远了，或者正在试图跑出范围
      if (currentDist > this.len) {
         let angle = atan2(player.cy() - this.anchor.y, player.cx() - this.anchor.x);

         // 强力纠正位置：不能超过长度
         // 这种"瞬移"非常微小，肉眼看不见，但能保证物理绝对不超标
         // 我们稍微给一点点弹性(1.01)，防止贴墙时抖动
         let clampDist = this.len;
         let targetX = this.anchor.x + cos(angle) * clampDist;
         let targetY = this.anchor.y + sin(angle) * clampDist;

         // 将拉回的力转化为速度，而不是直接改坐标（防止穿墙）
         let pullX = (targetX - player.cx()) * 0.5; // 0.5 的力度拉回
         let pullY = (targetY - player.cy()) * 0.5;

         player.vx += pullX;
         player.vy += pullY;

         // 如果玩家还在往外飞，把那个分量的速度逐渐归零
         player.vx *= 0.9;
         player.vy *= 0.9;
      }

      // 下面是之前的收缩绞盘逻辑 (用于按键爬升)
      if (this.material === 'SOFT') {
         if (this.nodes.length >= 2) {
            let second = this.nodes[this.nodes.length - 2];
            let d = dist(player.cx(), player.cy(), second.x, second.y);
            if (d > this.nodeDist) {
               let angle = atan2(second.y - player.cy(), second.x - player.cx());
               // 绞盘辅助力
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
            player.vx += cos(angle) * force; player.vy += sin(angle) * force;
            player.vx *= 0.9; player.vy *= 0.9;
         }
      }
   }

   getTip(player) {
      if (this.state === "SWINGING") return this.anchor;
      return this.currentTip;
   }

   getCollisionBoxes() {
      if (this.state !== "SWINGING") return [];
      if (this.material !== 'HARD') return [];
      let boxes = [];
      let boxSize = GRID_SIZE / 2; let offset = boxSize / 2;
      for (let node of this.nodes) boxes.push({ x: node.x - offset, y: node.y - offset, w: boxSize, h: boxSize });
      return boxes;
   }

   display(player) {
      if (this.state === "IDLE") return;
      let strokeW = (this.material === 'HARD') ? max(2, GRID_SIZE / 5) : max(1, GRID_SIZE / 6);
      // 画出连接点
      stroke(this.material === 'HARD' ? this.color : this.color); strokeWeight(strokeW); noFill();

      if (this.nodes.length > 0) {
         beginShape();
         for (let node of this.nodes) vertex(node.x, node.y);
         endShape();
         noStroke(); fill(this.material === 'HARD' ? this.color : this.color);
         ellipse(this.anchor.x, this.anchor.y, GRID_SIZE / 3, GRID_SIZE / 3);
      } else {
         line(player.cx(), player.cy(), this.currentTip.x, this.currentTip.y);
      }
   }
}