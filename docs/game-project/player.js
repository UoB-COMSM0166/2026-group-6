class Player {
   constructor(x, y) {
      const G = GameConfig.World.GRID_SIZE;
      this.maxHp = GameConfig.Player.MAX_HP;
      this.hp = this.maxHp;
      this.invulnerableTimer = 0;
      this.knockTimer = 0;

      this.x = x;
      this.y = y;
      this.w = G;
      this.h = G;
      this.vx = 0;
      this.vy = 0;
      this.cleanEnergy = GameConfig.Player.MAXCleanEnergy;
      this.jumpForce = GameConfig.Player.JUMPFORCE;

      this.grounded = false;
      this.inwater = false;

      this.showPrompt = null;  // 显示按键提示
      this.floatingTexts = []; // floating text

      this.ropeL = new Rope(color(0, 255, 255));
      this.ropeR = new Rope(color(255, 100, 100));

      this.currentRope = this.ropeL;
   }

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   // ====== 主更新 ======

   /**
    * @param {GameManager} gm  游戏管理器引用 (访问 gm.level, gm.entities)
    */
   update(gm) {
      this._tickTimers();
      this._getActiveWinchRopes(gm)
      this._handleWinch();
      this._applyPhysics(gm.level);
      this._resolveWorld(gm.level);
      this._clampToRopes();  // 世界碰撞后重新执行绳长约束
      this._isInToxicPool(gm);
      this._updateFloatingTexts();
   }

   // ====== 输入 ======

   _tickTimers() {
      if (this.invulnerableTimer > 0) this.invulnerableTimer--;
      if (this.knockTimer > 0) this.knockTimer--;
   }

   _handleWinch() {
      const G = GameConfig.World.GRID_SIZE;
      let cs = G * GameConfig.Player.CLIMB_SPEED;
      let wf = GameConfig.Player.WINCH_FORCE;

      let count = this.currentRope.length;
      if (count === 0) return;

      for (let rope of this.currentRope) {
         if (rope.state !== "SWINGING" && rope.state !== "STRAND") continue;
         // Q: 缩短
         if (keyIsDown(Keys.Q)) {
            rope.changeLength(-cs);
            // SWINGING: tip固定，拉玩家向锚点; STRAND: tip自由，只收绳不拉玩家
            if (rope.state === "SWINGING") {
               let a = atan2(rope.tip.y - this.cy(), rope.tip.x - this.cx());
               this.vx += cos(a) * wf / count;
               this.vy += sin(a) * wf / count;
            }
         }
         // E: 伸长
         if (keyIsDown(Keys.E)) rope.changeLength(cs);
      }
   }

   onMouseWheel_handleWinch(delta) {
      const G = GameConfig.World.GRID_SIZE;
      let cs = G * GameConfig.Player.CLIMB_SPEED;
      let wf = GameConfig.Player.WINCH_FORCE;
      let wheelMultiplier = 3;

      let count = this.currentRope.length;
      if (count === 0) return;

      for (let rope of this.currentRope) {
         if (rope.state !== "SWINGING" && rope.state !== "STRAND") continue;
         // 根据绳头相对玩家的位置翻转滚轮方向:
         let tipAbove = rope.tip.y < this.cy();
         let fixPlayer = rope.state === "STRAND";
         let effectiveDelta = tipAbove ? delta : -delta;
         effectiveDelta = fixPlayer ? -effectiveDelta : effectiveDelta;

         if (effectiveDelta < 0) {
            // 缩短
            rope.changeLength(-cs * wheelMultiplier);
            if (rope.state === "SWINGING") {
               let a = atan2(rope.tip.y - this.cy(), rope.tip.x - this.cx());
               this.vx += cos(a) * wf * wheelMultiplier / count;
               this.vy += sin(a) * wf * wheelMultiplier / count;
            }
         }
         if (effectiveDelta > 0) {
            // 伸长
            rope.changeLength(cs * wheelMultiplier);
         }
      }
   }



   _getActiveWinchRopes(gm) {
      let lSwinging = this.ropeL.state === "SWINGING" || this.ropeL.state === "STRAND";
      let rSwinging = this.ropeR.state === "SWINGING" || this.ropeR.state === "STRAND";

      if (lSwinging && rSwinging) {
         let midLeftPoint = { x: (this.ropeL.tip.x + this.cx()) / 2, y: (this.ropeL.tip.y + this.cy()) / 2 };
         let midRightPoint = { x: (this.ropeR.tip.x + this.cx()) / 2, y: (this.ropeR.tip.y + this.cy()) / 2 };
         let mouseWp = gm.camera.screenToWorld(mouseX, mouseY, gm.scale);
         let dL = dist(mouseWp.x, mouseWp.y, midLeftPoint.x, midLeftPoint.y);
         let dR = dist(mouseWp.x, mouseWp.y, midRightPoint.x, midRightPoint.y);
         let threshold = GameConfig.World.GRID_SIZE * 0.5;

         if (Math.abs(dL - dR) < threshold) {
            this.currentRope = [this.ropeL, this.ropeR];
         } else {
            this.currentRope = (dL < dR ? [this.ropeL] : [this.ropeR]);
         }
      } else if (lSwinging) {
         this.currentRope = [this.ropeL];
      } else if (rSwinging) {
         this.currentRope = [this.ropeR];
      } else {
         this.currentRope = [];
      }
   }

   // ====== 物理 ======

   /**
    * @param {LevelManager} level
    */
   _applyPhysics(level) {
      if (this.grounded) {
         this.vx *= GameConfig.World.FrictionalForce; // 摩擦力
      }
      else {
         this.vx *= GameConfig.World.AirFrictionalForce; // 摩擦力
      }
      this.vy += GameConfig.World.GRAVITY;
      this._isInWater(gm);

      // 绳索物理 (传入 LevelManager)
      this.ropeL.update(this, level);
      this.ropeR.update(this, level);
      this.ropeL.applyPhysics(this);
      this.ropeR.applyPhysics(this);
   }

   /**
    * @param {LevelManager} level
    */
   _resolveWorld(level) {
      const G = GameConfig.World.GRID_SIZE;
      const maxStep = G * 0.1; // 每次判断的步数

      // 收集绳索碰撞盒
      let heldRopes = [];
      if (this.ropeL.state === "SWINGING" && this.ropeL.material === 'HARD') heldRopes.push(this.ropeL);
      if (this.ropeR.state === "SWINGING" && this.ropeR.material === 'HARD') heldRopes.push(this.ropeR);

      // X轴分步检测
      let stepsX = Math.ceil(Math.abs(this.vx) / maxStep);
      let dx = this.vx / stepsX;
      for (let i = 0; i < stepsX; i++) {
         this.x += dx;
         this._resolve(true, level, heldRopes);
      }

      // Y轴分步检测
      let stepsY = Math.ceil(Math.abs(this.vy) / maxStep);
      let dy = this.vy / stepsY;
      for (let i = 0; i < stepsY; i++) {
         this.y += dy;
         this._resolve(false, level, heldRopes);
      }
   }

   /**
    * AABB 碰撞分离
    *
    *  核心优化: 使用 level.getSolidTilesInRect() 替代遍历全部 solidPlatforms
    *   之前: for (let p of solidPlatforms) → O(地图格子总数)
    *   现在: 只检测玩家包围盒附近 ~9-16 格 → O(1)
    */
   _resolve(onX, level, ignoredRopes) {
      this.grounded = false;

      //  空间查询: 获取玩家附近的固体 Tile
      let colliders = level.getSolidTilesInRect(this.x, this.y, this.w, this.h, 1);

      // 追加硬绳碰撞盒
      if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
         colliders = colliders.concat(this.ropeL.getCollisionBoxes());
      }
      if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
         colliders = colliders.concat(this.ropeR.getCollisionBoxes());
      }

      // AABB 分离
      for (let p of colliders) {
         if (!Physics.rectIntersect(this.x, this.y, this.w, this.h, p.x, p.y, p.w, p.h)) continue;

         let phW = this.w / 2, phH = this.h / 2;
         let ppW = p.w / 2, ppH = p.h / 2;
         let dx = (this.x + phW) - (p.x + ppW);
         let dy = (this.y + phH) - (p.y + ppH);
         // 计算X/Y轴的重叠量（oX：X轴重叠像素，oY：Y轴重叠像素）
         let oX = (phW + ppW) - abs(dx);
         let oY = (phH + ppH) - abs(dy);
         //无重叠
         if (oX <= 0 || oY <= 0) continue;
         // 根据偏移量大小优先处理偏移量大的轴
         if (oX < oY) {
            if (onX) {
               this.x += (dx > 0) ? oX : -oX;
               this.vx = 0;
            }
         } else {
            if (!onX) {
               if (dy > 0) {
                  this.y += oY;
               } else {
                  this.y -= oY;
                  this.grounded = true;
               }
               this.vy = 0;
            }
         }
      }

      // 额外着地检测 (站立时)
      if (!onX) {
         this.grounded = false;
         //  只查脚底下方的一排格子
         let footColliders = level.getSolidTilesInRect(this.x, this.y + this.h - 2, this.w, 8, 0);
         // 追加硬绳碰撞盒
         if (this.ropeL.material === 'HARD' && this.ropeL.state === 'SWINGING' && !ignoredRopes.includes(this.ropeL)) {
            footColliders = footColliders.concat(this.ropeL.getCollisionBoxes());
         }
         if (this.ropeR.material === 'HARD' && this.ropeR.state === 'SWINGING' && !ignoredRopes.includes(this.ropeR)) {
            footColliders = footColliders.concat(this.ropeR.getCollisionBoxes());
         }
         for (let p of footColliders) {
            if (this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2 &&
               this.y + this.h >= p.y - 1 && this.y + this.h <= p.y + 5) {
               this.grounded = true;
               break;
            }
         }
      }
   }

   _isInWater(gm) {
      if (gm.level.isRectOverlappingTile(this.x, this.y, this.w, this.h,
         { solidOnly: false, type: GameConfig.Collision.Water, margin: 0.1 }) !== null) {
         this._buoyancy(gm);
         if (!this.inwater) {
            if (!resources.sounds.intowater.isPlaying()) resources.sounds.intowater.play();
            this.inwater = true;
         }
         if (!resources.sounds.underwater.isPlaying()) resources.sounds.underwater.play();
         this.vy *= 0.97;
         let speed = GameConfig.Player.WATER_SPEED;
         if (keyIsDown(Keys.S) || keyIsDown(DOWN_ARROW)) this.vy += speed;
         if (keyIsDown(UP_ARROW) || keyIsDown(Keys.W)) this.vy -= speed;
      }
      else {
         this.inwater = false;
      }
   }

   _buoyancy(gm) {
      let waterDeep = 0;
      let playerPos = gm.level.worldToGrid(this.cx(), this.y + this.h);
      let tile = gm.level.grid[playerPos.row - 1]?.[playerPos.col];
      if (tile && tile.type === GameConfig.Collision.Water) waterDeep = this.h;
      else {
         tile = gm.level.grid[playerPos.row]?.[playerPos.col];
         if (tile && tile.type === GameConfig.Collision.Water) {
            waterDeep = tile.y - (this.y + this.h);
         }
      }
      // Formula: F = ρ × g × V
      let waterDensity = 1 / 7;
      let buoyancyForce = waterDensity * GameConfig.World.GRAVITY * waterDeep;
      this.vy -= buoyancyForce;
   }

   takeDamage(damage, gm) {
      this.hp -= damage;
      this.addFloatingText("-" + damage, color(255, 60, 60), 7);
      if (this.hp <= 0) { this.die(gm); return; }
      this.invulnerableTimer = GameConfig.Player.InvulInterval;
   }

   /**
   * @param {number} consume
   */
   reduceCleanEnergy(consume) {
      if (this.checkRemainCleanEnergy(consume)) {
         this.cleanEnergy -= consume;
         this.addFloatingText("-" + consume, color(50, 220, 230), 6);
      }
      else {
         return;
      }
   }

   /**
   * @param {number} supply
   */
   supplyCleanEnergy(supply) {
      this.cleanEnergy += supply;
      this.addFloatingText("+" + supply, color(50, 220, 230), 6);
   }

   checkRemainCleanEnergy(consume) {
      return (this.cleanEnergy - consume) >= 0;
   }

   restoreHp(restore) {
      let nextHp = this.hp + restore;
      this.hp = (nextHp > this.maxHp) ? this.maxHp : nextHp;
      if (restore > 0) this.addFloatingText("+" + restore, color(50, 230, 80), 6);
   }

   addJumpForce(enhance) {
      this.jumpForce += enhance;
      if (enhance > 0) this.addFloatingText("jumpforce +" + enhance, color(199, 115, 37), 8, 110);
   }


   /**
    * 世界碰撞解算后, 重新钳制玩家到绳长范围内
    *
    * 流程: applyPhysics(绳约束) → resolveWorld(瓦片碰撞) → clampToRopes(绳约束补偿)
    * 避免瓦片碰撞把玩家推出绳长范围后没有修正
    */
   _clampToRopes() {
      this._clampToRope(this.ropeL);
      this._clampToRope(this.ropeR);
   }

   /**
    * 对单根绳子执行硬长度约束
    * 只在软绳 SWINGING 状态下生效
    * 使用有效锚点
    */
   _clampToRope(rope) {
      if (rope.material !== 'SOFT' || !rope.stuck || rope.nodes.length < 2) return;

      let anchor = rope._getEffectiveAnchor();
      if (!anchor) return;

      let dx = this.cx() - anchor.x;
      let dy = this.cy() - anchor.y;
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d <= anchor.freeLength) return;

      // 方向: 有效锚点 → 玩家
      let nx = dx / d, ny = dy / d;

      // 硬钳制到可用绳长圆上
      let targetCX = anchor.x + nx * anchor.freeLength;
      let targetCY = anchor.y + ny * anchor.freeLength;
      this.x = targetCX - this.w / 2;
      this.y = targetCY - this.h / 2;

      // 去除径向外推速度, 保留切向 (允许摆荡)
      let radialV = this.vx * nx + this.vy * ny;
      if (radialV > 0) {
         this.vx -= radialV * nx;
         this.vy -= radialV * ny;
      }
   }

   // 碰到毒池
   _isInToxicPool(gm) {
      if (gm.level.isRectOverlappingTile(this.x, this.y, this.w, this.h,
         { solidOnly: false, type: GameConfig.Collision.ToxicPool, margin: 0.1 }) !== null) {
         this.die(gm);
      }
   }
   // ====== 动作 ======

   fireRope(side, tx, ty) {
      if (side === "LEFT") this.ropeL.fire(this.cx(), this.cy(), tx, ty);
      if (side === "RIGHT") this.ropeR.fire(this.cx(), this.cy(), tx, ty);
   }

   move(dir) {
      let f = this.grounded ? GameConfig.Player.SPEED : GameConfig.Player.SPEED * 0.7;
      this.vx += dir * f;
   }

   jump() {
      let jf = -1 * this.jumpForce;
      if (this.grounded) {
         this.vy = jf;
      } else if (this.ropeL.state === "SWINGING" || this.ropeR.state === "SWINGING") {
         this.vy = jf * 0.5;
         this.vx *= 1.2;
      }
   }

   repel(repelX, repelY) {
      this.vx = repelX;
      this.vy = repelY;
   }

   die(gm) {
      if (!resources.sounds.failure.isPlaying()) resources.sounds.failure.play();
      gm.status = "GAMEOVER";
      this.invulnerableTimer = 0;
      this.knockTimer = 0;
   }

   // ====== 渲染 ======

   display(camera, scale) {
      const G = GameConfig.World.GRID_SIZE;
      noStroke();
      fill(this.knockTimer > 0 ? color(255, 100, 100) : 255);
      rect(this.x, this.y, this.w, this.h);

      // 眼睛跟随鼠标
      fill(0);
      let wm = camera.screenToWorld(mouseX, mouseY, scale);
      let a = atan2(wm.y - this.cy(), wm.x - this.cx());
      let off = G * 0.3, sz = max(1, G * 0.25);
      rect(this.cx() + cos(a) * off - sz / 2,
         this.cy() + sin(a) * off - sz / 2, sz, sz);
      this._showPrompt();
      this._drawFloatingTexts();
   }

   setPrompt(prompt) {
      this.showPrompt = prompt;
   }
   _showPrompt() {
      // 按键提示
      if (this.showPrompt) {
         let px = this.cx(), py = this.y - 10;
         // 背景框
         fill(0, 0, 0, 150);
         noStroke();
         let promptW = 7;
         let promptH = 4;
         rect(px - promptW, py - promptH, promptW * 2, promptH * 2, 3);
         // 文字
         fill(255);
         textAlign(CENTER, CENTER);
         textSize(5);
         text(this.showPrompt, px, py);
         this.showPrompt = null;  // 在每帧在其他地方重新设置
      }
   }

   // floatingtext

   /**
    * 从玩家头顶缓慢上升并渐隐的文字
    *
    * @param {string}  content   text showing
    * @param {Array}   col       color(0, 0, 0)
    * @param {number}  [fontSize]  字体大小, default 6
    * @param {number}  [duration]  持续帧数，default 60
    */
   addFloatingText(content, col, fontSize, duration) {
      this.floatingTexts.push(
         new Player.FloatingText(this, content, col, fontSize, duration)
      );
   }

   _updateFloatingTexts() {
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
         this.floatingTexts[i].update();
         if (this.floatingTexts[i].isDead) this.floatingTexts.splice(i, 1);
      }
   }

   _drawFloatingTexts() {
      for (let ft of this.floatingTexts) ft.display();
   }
}

/**
 * Player.FloatingText — inner class of Player
 */
Player.FloatingText = class {
   /**
    * @param {Player}  owner     所属的 Player 实例
    * @param {string}  content   文字内容
    * @param {Array}   col       color(0,0,0)
    * @param {number}  fontSize  字体大小
    * @param {number}  duration  持续帧数
    */
   constructor(owner, content, col, fontSize, duration) {
      this.owner = owner;
      this.text = content;
      this.color = col || color(0, 0, 0);
      this.fontSize = fontSize || 6;
      this.duration = duration || 60;
      this.timer = 0;
      this.offsetX = random(-4, 4);
      this.offsetY = 0;
      this.rise = 0.15;
   }

   get isDead() { return this.timer >= this.duration; }

   update() {
      this.timer++;
      this.offsetY -= this.rise;
   }

   display() {
      let progress = this.timer / this.duration;
      let alpha;
      if (progress < 0.2) alpha = map(progress, 0, 0.2, 0, 255);
      else if (progress > 0.6) alpha = map(progress, 0.6, 1, 255, 0);
      else alpha = 255;

      // 通过 owner 引用直接读取玩家坐标
      let px = this.owner.cx() + this.offsetX;
      let py = this.owner.y - 8 + this.offsetY;

      push();
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(this.fontSize);
      // 阴影
      fill(0, 0, 0, alpha * 0.5);
      text(this.text, px + 0.5, py + 0.5);
      // 正文
      let c = color(this.color);
      c.setAlpha(alpha);
      fill(c);
      text(this.text, px, py);
      pop();
   }
}