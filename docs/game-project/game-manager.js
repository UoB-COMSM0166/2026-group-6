/**
 * GameManager - 游戏主管理
 *
 * 职责:
 *   - 控制游戏状态 (PLAY / WIN / GAMEOVER)
 *   - 关卡切换
 *   - 协调 LevelManager、Player、Enemy、Camera 等子系统
 *   - 转发输入事件
 *
 * 整个游戏只有一个 GameManager 实例。
 * main.js 仅负责将生命周期转发到这里。
 */
class GameManager {
   /**
    * @param {ResourceManager} resources
    */
   constructor(resources) {
      this.resources = resources;
      this.scale = GameConfig.Display.GAME_SCALE;
      this.levelIndex = GameConfig.Level.START_INDEX;

      // 子系统
      this.level;
      this.camera = new Camera();
      this.levelsInfo = {}; // 里面是class Levelmanager
      // 运行时对象
      this.player = null;
      this.entities = [];
      this.particles = [];

      // 游戏状态
      this.status = "PLAY"; // PLAY | WIN | GAMEOVER
      this.environmentChanged = false;
      this.mapPromptText = "";
      this.mapPromptStartTime;
      this.mapPromptDuration;
      this.pendingTeleport = null;
      this._isPreloading;
      this.checkpoint = null; // { levelIndex, x, y }
      this.preload();
   }

   // 预加载所有关卡

   preload() {
      this._isPreloading = true;
      let ldtk = this.resources.ldtkData;
      const lastIndex = ldtk.levels.length;
      for (let levelIndex = 0; levelIndex < lastIndex; levelIndex++) {
         this.levelIndex = levelIndex;
         this.loadLevel();
      }
      this.levelIndex = GameConfig.Level.START_INDEX;
      let playerStart = this.levelsInfo[this.levelIndex].playerStart || GameConfig.Player.DefaultStartPoint;
      this.saveCheckpoint(this.levelIndex, playerStart.x, playerStart.y);
   }

   /**
    * 加载关卡
    * @param {Object} [transition]  关卡过渡数据 {x, y, vx, vy}
    */
   loadLevel(transition) {
      let ldtk = this.resources.ldtkData;

      if (this.levelIndex in this.levelsInfo) {
         this.level = this.levelsInfo[this.levelIndex];
      }
      else {
         this.level = new LevelManager(this.levelIndex);
         this.level.load(ldtk, this.levelIndex);
      }
      // 1. LevelManager 解析地图

      // 创建恢复读取地图的实体
      this._loadEntities();

      if (this._isPreloading) {
         // 2. 调整画布
         let size = this.level.getCanvasSize();
         resizeCanvas(size.w, size.h);
         // 3. 创建/恢复玩家
         this._loadPlayer(transition);
         this.particles = [];
         this.camera.reset();
         this.status = "PLAY";
         // The prompt above the map
         this.mapPromptText = ldtk.levels[this.levelIndex].identifier;
         this.mapPromptStartTime = millis();
         this.mapPromptDuration = 3000;
      }
   }


   _createEntities() {
      this.entities = [];

      for (let spawn of this.level.entitySpawns) {
         let ent;
         switch (spawn.identifier) {
            case "Boss": ent = new Boss(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Tool: ent = new Tool(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.PollutionCore: ent = new PollutionCore(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.CleanEnergy: ent = new CleanEnergy(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Rest: ent = new Rest(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Ladder: ent = new Ladder(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Painting: ent = new Painting(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.TeleportationGate: ent = new TeleportationGate(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.EndingButton: ent = new EndingButton(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.GateWall: ent = new GateWall(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Button: ent = new Button(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            default: ent = new Entity(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
         }
         this.entities.push(ent);
      }

      for (let spawn of this.level.enemySpawns) {
         this.entities.push(new Enemy(spawn.x, spawn.y, spawn.w, spawn.h, spawn, this.level));
      }
   }

   _loadEntities() {
      if (!(this.levelIndex in this.levelsInfo)) {
         // 创建实体
         this._createEntities();
         this.level.entities = this.entities;
         this.levelsInfo[this.levelIndex] = this.level;
         this.level.totalPollutionCore = this.level.getPollutionCoreCount();
         this.level.totalEnemies = this.level.getEnemiesCount();
      }
      else {
         this.entities = this.levelsInfo[this.levelIndex].entities;
      }
   }

   _loadPlayer(transition) {
      // 关卡过渡: 保留 HP、绳索材质等状态
      if (transition && this.player) {
         // 切换地图无敌帧
         this.player.invulnerableTimer = GameConfig.Player.InvulInterval
         this.player.x = transition.x;
         this.player.y = transition.y;
         // 保留移动方向的速度, 过渡更流畅
         this.player.vx = transition.vx * 0.5 || 0;
         this.player.vy = transition.vy * 0.5 || 0;
         // 收回绳索 (跨关卡的锚点已失效)
         this._resetRope();
      }
      // 重新开始
      else if (this.status == "GAMEOVER" && this.player) {
         let cp = this.checkpoint;
         this.player.hp = this.player.maxHp;
         this.player.x = cp.x;
         this.player.y = cp.y;
         this.player.vx = 0;
         this.player.vy = 0;
         this._resetRope();
      }
      // 新游戏
      else {
         let start = this.level.playerStart || GameConfig.Player.DefaultStartPoint;
         this.player = new Player(start.x, start.y);
      }
   }

   _resetRope() {
      this.player.ropeL.reset();
      this.player.ropeR.reset();
   }

   // main loop

   update() {
      if (this.status !== "PLAY") return;

      // 玩家更新 (传入 GameManager 引用)
      this.player.update(this);

      // 持续按键
      this._onKeyDown();

      // 摄像机
      let viewW = width / this.scale;
      let viewH = height / this.scale;
      this.camera.follow(this.player, this.level.mapW, this.level.mapH, viewW, viewH);

      // 通用实体
      this._updateEntities();
      this._checkTeleport();
      this._checkProcess()
      // 粒子
      this._updateParticles();

      // 关卡过渡检测 (优先于胜负判定)
      this._checkTransition();

      // 胜负判定
      this._checkWinLose();
   }



   render() {
      background(color(this.level.bgColor));

      push();
      scale(this.scale);
      translate(-this.camera.x, -this.camera.y);

      //渲染地图背景
      this.drawBackground();

      //  统一渲染: LevelManager 按图层顺序绘制所有 Tile + 装饰
      this.level.draw(this.resources.tilesetImage);

      // 游戏对象
      for (let ent of this.entities) ent.display(this.level);
      for (let p of this.particles) p.display();
      this.player.ropeL.display(this.player);
      this.player.ropeR.display(this.player);
      this.player.display(this.camera, this.scale);

      pop();

      // 常态化显示右上角小地图
      this.level.drawMiniMap(this.player);

      // 按下 M 键，屏幕中央放大显示当前及相邻地图
      if (keyIsDown(Keys.M)) {
         this.level.drawLargeMap(this.player, this);
      }
      else {
         this.level.mapOpen = false;
      }

      // UI (屏幕空间)
      UI.drawHUD(this.player, this.level, this);
      if (this.status === "WIN") UI.drawWinScreen();
      else if (this.status === "GAMEOVER") UI.drawGameOverScreen();
      let elapsed = millis() - this.mapPromptStartTime;
      if (elapsed < this.mapPromptDuration) {
         UI.drawMapPrompt(this.mapPromptText, elapsed, this.mapPromptDuration);
      }
   }


   drawBackground() {
      const area = Number(this.level.areaNumber) || 1;
      const key = `area${area}`;

      const layers = this.resources.images.parallax?.[key];
      if (!layers || layers.length === 0) return;

      // 视口尺寸(world pixel)
      const viewW = width / this.scale;
      const viewH = height / this.scale;

      // 计算 Area 包围盒 & 中心
      if (!this._areaBoundsCache || this._areaBoundsCache.area !== area) {
         let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
         const ldtk = this.resources.ldtkData;
         for (let i = 0; i < ldtk.levels.length; i++) {
            const lvl = this.levelsInfo[i];
            if (!lvl || Number(lvl.areaNumber) !== area) continue;
            const wl = ldtk.levels[i];
            minX = Math.min(minX, wl.worldX);
            minY = Math.min(minY, wl.worldY);
            maxX = Math.max(maxX, wl.worldX + wl.pxWid);
            maxY = Math.max(maxY, wl.worldY + wl.pxHei);
         }
         // 如果找不到同 area 的 level，退回当前 level 自身范围
         if (minX === Infinity) {
            minX = this.level.worldX;
            minY = this.level.worldY;
            maxX = this.level.worldX + this.level.mapW;
            maxY = this.level.worldY + this.level.mapH;
         }
         this._areaBoundsCache = {
            area,
            cx: (minX + maxX) / 2,
            cy: (minY + maxY) / 2,
            w: maxX - minX,
            h: maxY - minY,
         };
      }
      const ab = this._areaBoundsCache;

      // ── 摄像机中心的绝对世界坐标 ──
      const camAbsX = this.level.worldX + this.camera.x + viewW / 2;
      const camAbsY = this.level.worldY + this.camera.y + viewH / 2;

      // 摄像机与 Area 中心的偏移量
      const dx = camAbsX - ab.cx;
      const dy = camAbsY - ab.cy;

      // ── 各层视差因子：远景 → 近景 ──
      //   factor = 0  完全不随摄像机移动（无穷远）
      //   factor = 1  完全跟随摄像机（同步）
      const factors = layers.map((_, i) =>
         0.05 + i * (0.85 / Math.max(1, layers.length - 1))
      );

      // ── 视口边界（本关卡局部坐标）──
      const vl = this.camera.x;
      const vt = this.camera.y;

      // ── 逐层绘制 (从远到近) ──
      for (let i = 0; i < layers.length; i++) {
         const img = layers[i];
         if (!img) continue;

         const f = factors[i];

         // 该层中心 —— 在绝对世界坐标中:
         //   当摄像机在 Area 中心时, 层中心 == Area 中心
         //   摄像机每偏移 1px, 该层偏移 f px → 产生 (1-f) 的视差
         const layerAbsCX = ab.cx + dx * f;
         const layerAbsCY = ab.cy + dy * f;

         // 转为本关卡局部坐标
         const layerLocalCX = layerAbsCX - this.level.worldX;
         const layerLocalCY = layerAbsCY - this.level.worldY;

         // ── 缩放：保证覆盖视口 + 最大视差移动量 ──
         //   最大偏移量 = Area 半宽/半高 × (1-f)
         const maxShiftX = (ab.w / 2) * (1 - f);
         const maxShiftY = (ab.h / 2) * (1 - f);
         const neededW = viewW + maxShiftX * 2;
         const neededH = viewH + maxShiftY * 2;

         // 取最大缩放比，保证宽高都够
         const imgScale = Math.max(
            neededW / img.width,
            neededH / img.height,
            viewW / img.width,   // 兜底: 至少填满视口
            viewH / img.height
         );
         const sw = img.width * imgScale;
         const sh = img.height * imgScale;

         // 图片左上角（以层中心为基准）
         const bx = layerLocalCX - sw / 2;
         const by = layerLocalCY - sh / 2;

         // ── 判断单张是否覆盖视口，不够则平铺 ──
         if (bx <= vl && bx + sw >= vl + viewW &&
            by <= vt && by + sh >= vt + viewH) {
            // 单张足够覆盖
            image(img, bx, by, sw, sh);
         } else {
            // 平铺：计算需要铺几行几列
            const startCol = Math.floor((vl - bx) / sw);
            const endCol = Math.ceil((vl + viewW - bx) / sw);
            const startRow = Math.floor((vt - by) / sh);
            const endRow = Math.ceil((vt + viewH - by) / sh);

            for (let c = startCol; c < endCol; c++) {
               for (let r = startRow; r < endRow; r++) {
                  image(img, bx + c * sw, by + r * sh, sw, sh);
               }
            }
         }
      }
   }

   //  输入

   onMousePressed(button) {
      if (this.status !== "PLAY") return;
      // world point
      let wp = this.camera.screenToWorld(mouseX, mouseY, this.scale);
      if (button === LEFT) this.player.fireRope("LEFT", wp.x, wp.y);
      if (button === RIGHT) this.player.fireRope("RIGHT", wp.x, wp.y);
   }

   onKeyPressed(key) {
      if (this.status === "PLAY") {
         if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') this.player.jump();
         // if (key === '1') this.player.ropeL.toggleMaterial(this.player);
         // if (key === '2') this.player.ropeR.toggleMaterial(this.player);
         if (key === 'H' || key === 'h') {
            if (intro.sidePanelsVisible) intro.hideSidePanels();
            else intro.showSidePanels();
         }
      }
      if (this.status === "GAMEOVER") {
         if (key === 'R' || key === 'r') {
            this.levelIndex = this.checkpoint.levelIndex;
            this.loadLevel();
         }
      }
   }

   _onKeyDown() {
      if (keyIsDown(LEFT_ARROW) || keyIsDown(Keys.A)) this.player.move(-1);  // a param: dir
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(Keys.D)) this.player.move(1);  // d
   }

   //  粒子特效

   addParticles(x, y, count = 5) {
      this.particles.push(...Particle.spawn(x, y, count));
   }

   //  内部

   _updateEntities() {
      for (let i = this.entities.length - 1; i >= 0; i--) {
         let ent = this.entities[i];
         // 把 this (也就是 gm 本身) 传给实体，让 Boss 能拿到玩家坐标
         ent.update(this.level, this);


         if (!ent || ent.active === false) continue;
         if (typeof ent.updateWithGM === "function") {
            ent.updateWithGM(this);
         }
         if (ent.active === false) continue;

         if (ent.isTouchingPlayer(this.player)) {
            ent.onPlayerContact(this.player, this);
         }
         [this.player.ropeL, this.player.ropeR].forEach(rope => {
            if (ent.isTouchingRope(rope, this.player)) {
               ent.onRopeContact(rope, this.player, this);
            }
         });
         if (ent.isDead) this.entities.splice(i, 1);
      }
      this.level.pollutionCoreCount = this.level.getPollutionCoreCount();


   }

   _updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
         this.particles[i].update();
         if (this.particles[i].isDead) this.particles.splice(i, 1);
      }
   }

   /**
    * 检测玩家是否到达地图边缘且有邻居关卡
    * 如果有, 切换到邻居关卡并重新定位玩家
    *
    * 流程:
    *   1. LevelManager.checkEdgeTransition() 检测边缘 + 查找邻居 + 坐标映射
    *   2. 保存玩家速度 (保持移动惯性)
    *   3. loadLevel(transition) 加载新关卡, 保留玩家状态
    */

   _checkTeleport() {
      if (!this.pendingTeleport) return;

      let result = this.pendingTeleport;
      this.pendingTeleport = null;
      this.levelIndex = result.levelIndex;
      this.loadLevel({
         x: result.newX,
         y: result.newY,
         vx: 0,
         vy: 0,
      });

      // 目标关卡所有传送门设冷却，防止立刻回传
      for (let ent of this.entities) {
         if (ent instanceof TeleportationGate) {
            ent.cooldown = 30;
         }
      }
   }

   _checkProcess() {
      if (this.getAreaProgress() > GameConfig.World.PURIFY_CHANGE_THRESHOLD && this.environmentChanged == false) {
         if (!resources.sounds.upgrade.isPlaying()) resources.sounds.upgrade.play();
         this.mapPromptText = "Some things have changed due to purification.";
         this.mapPromptStartTime = millis();
         this.mapPromptDuration = 3000;
         this.environmentChanged = true;
         // 本area净化程度到达一定值后，毒池变为水
         if (!this.level.toxicConverted) {
            for (let key in this.levelsInfo) {
               let level = this.levelsInfo[key];
               if (level.areaNumber === this.level.areaNumber) level.convertToxicToWater();
            }
         }
      }
      if (this.getAreaProgress() < GameConfig.World.PURIFY_CHANGE_THRESHOLD && this.environmentChanged == true) {
         this.environmentChanged = false;
      }
   }

   _checkTransition() {
      let result = this.level.checkEdgeTransition(this.player);
      if (!result) return;
      // 切换关卡, 保留速度让过渡更流畅
      this.levelIndex = result.levelIndex;
      this.loadLevel({
         x: result.newX,
         y: result.newY,
         vx: this.player.vx,
         vy: this.player.vy,
      });
   }

   saveCheckpoint(levelIndex, x, y) {
      this.checkpoint = { levelIndex, x, y };
   }

   _checkWinLose() {
      // 掉出地图底部 (且该方向没有邻居, 否则 _checkTransition 会先处理)
      if (this.player.y > this.level.mapH + 32) this.player.die(this);
      if (this.player.hp <= 0) this.player.die(this);
   }

   /**
       * 计算当前所在 Area（包含多个 Level）的净化百分比进度
       * 权重规则：污染核心 = 5, 怪物 = 1
       */
   getAreaProgress(areaNumber) {
      let ldtk = this.resources.ldtkData;
      let currentAreaNumber = areaNumber || this.level.areaNumber;
      currentAreaNumber = Number(currentAreaNumber);
      // 定义净化值权重
      let CORE_WEIGHT = GameConfig.Level.CORE_WEIGHT;
      let ENEMY_WEIGHT = GameConfig.Level.ENEMY_WEIGHT;
      let remainingCores = 0;
      let remainingEnemies = 0;
      let initialCores = 0;
      let initialEnemies = 0;
      // 不算最终关
      for (let i = 0; i < ldtk.levels.length - 1; i++) {
         let lvl = this.levelsInfo[i];
         // 筛选出所有areaNumber为当前Level的areaNumber的level，当到达结尾关时为整张地图的progress
         if (Number(lvl.areaNumber) === currentAreaNumber || currentAreaNumber === 5) {
            initialCores += lvl.totalPollutionCore;
            initialEnemies += lvl.totalEnemies;
            remainingCores += lvl.getPollutionCoreCount();
            remainingEnemies += lvl.getEnemiesCount();
            // 累加该关卡能提供的总净化值
         }
      }
      let currentPurifiedEnemies = initialEnemies - remainingEnemies;
      let currentPurifiedCores = initialCores - remainingCores;
      let currentPurifiedValue = currentPurifiedEnemies * ENEMY_WEIGHT + currentPurifiedCores * CORE_WEIGHT;
      let totalValue = (initialCores * CORE_WEIGHT) + (initialEnemies * ENEMY_WEIGHT);
      // 计算百分比 (向下取整，并且防止除以 0 导致报错)
      let percentage = (totalValue === 0 ? 100 : Math.floor((currentPurifiedValue / totalValue) * 100));
      return percentage;
   }

   /**
    * 全局按 iid 找实体：
    */

   findEntityAndLevelByIid(iid) {
      if (!iid) return null;
      for (const key in this.levelsInfo) {
         const lvl = this.levelsInfo[key];
         if (!lvl || !lvl.entities) continue;
         const hit = lvl.entities.find(ent => ent && ent.iid === iid);
         if (hit) return { entity: hit, levelIndex: Number(key) };
      }
      return null;
   }
}