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
 * main.js (p5入口) 仅负责将生命周期转发到这里。
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

      this.areaName = "";
      this.areaNameStartTime;
      this.areaNameDuration;
   }

   // ========================================================
   //  关卡管理
   // ========================================================

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

      // 2. 调整画布
      let size = this.level.getCanvasSize();
      resizeCanvas(size.w, size.h);

      // 3. 创建/恢复玩家
      this._loadPlayer(transition);
      this.level.resetPlayerStart(this.player.x, this.player.y);

      this.particles = [];
      this.camera.reset();
      this.status = "PLAY";
      this.areaName = ldtk.levels[this.levelIndex].identifier;
      this.areaNameStartTime = millis();
      this.areaNameDuration = 3000;
   }


   _createEntities() {
      this.entities = [];

      // 创建敌人
      for (let spawn of this.level.enemySpawns) {
         this.entities.push(new Enemy(spawn.x, spawn.y, spawn.w, spawn.h, spawn, this.level));
      }
      for (let spawn of this.level.entitySpawns) {
         let ent;
         switch (spawn.identifier) {
            case "Boss": ent = new Boss(spawn.x, spawn.y, spawn.w, spawn.h, spawn, this.level); break;
            case GameConfig.Entity.Tool: ent = new Tool(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.PollutionCore: ent = new PollutionCore(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.CleanEnergy: ent = new CleanEnergy(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Rest: ent = new Rest(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.Ladder: ent = new Ladder(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            default: ent = new Entity(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
         }
         this.entities.push(ent);
      }
   }

   _loadEntities() {
      if (!(this.levelIndex in this.levelsInfo)) {
         // 创建实体
         this._createEntities();
         this.level.entities = this.entities;
         this.levelsInfo[this.levelIndex] = this.level;
         this.level.totalPollutionCore = this.level.getPollutionCoreCount();
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
         let start = this.level.playerStart || GameConfig.Player.DefaultStartPoint;
         this.player.hp = this.player.maxHp;
         this.player.x = start.x;
         this.player.y = start.y;
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
   // ========================================================
   //  主循环
   // ========================================================

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

      // ★ 统一渲染: LevelManager 按图层顺序绘制所有 Tile + 装饰
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
         this.level.drawLargeMap(this.player);
      }
      // =======================================================

      // UI (屏幕空间)
      UI.drawHUD(this.player, this.level, this);
      if (this.status === "WIN") UI.drawWinScreen();
      else if (this.status === "GAMEOVER") UI.drawGameOverScreen();
      let elapsed = millis() - this.areaNameStartTime;
      if (elapsed < this.areaNameDuration) {
         UI.drawAreaName(this.areaName, elapsed, this.areaNameDuration);
      }
   }

   // ========================================================
   //  输入
   // ========================================================

   onMousePressed(button) {
      if (this.status !== "PLAY") return;
      let wp = this.camera.screenToWorld(mouseX, mouseY, this.scale);
      if (button === LEFT) this.player.fireRope("LEFT", wp.x, wp.y);
      if (button === RIGHT) this.player.fireRope("RIGHT", wp.x, wp.y);
   }

   onKeyPressed(key) {
      if (this.status === "PLAY") {
         if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') this.player.jump();
         if (key === '1') this.player.ropeL.toggleMaterial(this.player);
         if (key === '2') this.player.ropeR.toggleMaterial(this.player);
      }
      if (this.status === "GAMEOVER") {
         if (key === 'R' || key === 'r') {
            this.loadLevel();
         }
      }
   }

   _onKeyDown() {
      if (keyIsDown(LEFT_ARROW) || keyIsDown(Keys.A)) this.player.move(-1);  // a param: dir
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(Keys.D)) this.player.move(1);  // d
   }

   // ========================================================
   //  粒子
   // ========================================================

   addParticles(x, y, count = 5) {
      this.particles.push(...Particle.spawn(x, y, count));
   }

   // ========================================================
   //  内部
   // ========================================================

_updateEntities() {
      for (let i = this.entities.length - 1; i >= 0; i--) {
         let ent = this.entities[i];
         // 把 this (也就是 gm 本身) 传给实体，让 Boss 能拿到玩家坐标
         ent.update(this.level, this); 
         
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
    * ★ 检测玩家是否到达地图边缘且有邻居关卡
    * 如果有, 切换到邻居关卡并重新定位玩家
    *
    * 流程:
    *   1. LevelManager.checkEdgeTransition() 检测边缘 + 查找邻居 + 坐标映射
    *   2. 保存玩家速度 (保持移动惯性)
    *   3. loadLevel(transition) 加载新关卡, 保留玩家状态（在transition中添加保留的其他玩家状态，后续应单独加到一个class里面）
    */
   _checkTransition() {
      let result = this.level.checkEdgeTransition(this.player);
      if (!result) return;
      this._savaLevel();
      // 切换关卡, 保留速度让过渡更流畅
      this.levelIndex = result.levelIndex;
      this.loadLevel({
         x: result.newX,
         y: result.newY,
         vx: this.player.vx,
         vy: this.player.vy,
      });
   }

   _savaLevel() {
      this.levelsInfo[this.levelIndex].entities = this.entities;
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
   getAreaProgress() {
      let ldtk = this.resources.ldtkData;
      let currentLevelId = ldtk.levels[this.levelIndex].identifier;
      let areaPrefix = currentLevelId.split('_')[0]; 

      let totalValue = 0;
      let currentPurifiedValue = 0;

      // 定义净化值权重
      const CORE_WEIGHT = 5;
      const ENEMY_WEIGHT = 1;

      for (let i = 0; i < ldtk.levels.length; i++) {
         let lvl = ldtk.levels[i];
         
         // 筛选出所有属于当前 Area 前缀的 Level
         if (lvl.identifier.startsWith(areaPrefix)) {
            let initialCores = 0;
            let initialEnemies = 0;

            // 1. 直接从 LDtk 原始数据读取该关卡的初始实体数量
            let entityLayer = lvl.layerInstances.find(l => l.__identifier === "Entities");
            if (entityLayer) {
               for (let ent of entityLayer.entityInstances) {
                  if (ent.__identifier === "Pollution_Core") initialCores++;
                  if (ent.__identifier === "Enemy") initialEnemies++;
               }
            }

            // 累加该关卡能提供的总净化值
            totalValue += (initialCores * CORE_WEIGHT) + (initialEnemies * ENEMY_WEIGHT);

            // 2. 如果玩家已经访问过这个关卡，计算实际存活的数量
            if (i in this.levelsInfo) {
               let loadedLevel = this.levelsInfo[i];
               let remainingCores = 0;
               let remainingEnemies = 0;

               // 遍历该关卡当前还存活的实体
               for (let ent of loadedLevel.entities) {
                  if (ent.constructor.name === "PollutionCore") remainingCores++;
                  if (ent.constructor.name === "Enemy") remainingEnemies++;
               }

               // 初始数量 - 存活数量 = 已经净化的数量
               let purifiedCores = initialCores - remainingCores;
               let purifiedEnemies = initialEnemies - remainingEnemies;
               currentPurifiedValue += (purifiedCores * CORE_WEIGHT) + (purifiedEnemies * ENEMY_WEIGHT);
            }
         }
      }

      // 计算百分比 (向下取整，并且防止除以 0 导致报错)
      let percentage = totalValue === 0 ? 100 : Math.floor((currentPurifiedValue / totalValue) * 100);
      return percentage;
   }
}
