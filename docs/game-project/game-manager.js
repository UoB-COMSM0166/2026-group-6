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
      this.level = new LevelManager(this.levelIndex);
      this.camera = new Camera();
      this.levelsInfo = {}; // 里面是class Levelmanager
      // 运行时对象
      this.player = null;
      this.enemies = [];
      this.entities = [];
      this.particles = [];

      // 游戏状态
      this.status = "PLAY"; // PLAY | WIN | GAMEOVER
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

      // 1. LevelManager 解析地图
      this.level.load(ldtk, this.levelIndex);

      // 2. 调整画布
      let size = this.level.getCanvasSize();
      resizeCanvas(size.w, size.h);

      // 创建恢复读取地图的实体
      this._loadEntities();

      // 3. 创建/恢复玩家
      this._loadPlayer(transition);

      this.particles = [];
      this.camera.reset();
      this.status = "PLAY";
   }

   _createEnemy() {
      // 4. 创建敌人
      this.enemies = [];
      for (let spawn of this.level.enemySpawns) {
         this.enemies.push(new Enemy(spawn.x, spawn.y, spawn.hp, spawn.damage, this.level));
      }
   }

   _createEntities() {
      this.entities = [];
      for (let spawn of this.level.entitySpawns) {
         let ent;
         switch (spawn.identifier) {
            case GameConfig.Entity.Tool: ent = new Tool(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.PollutionCore: ent = new PollutionCore(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            case GameConfig.Entity.CleanEnergy: ent = new CleanEnergy(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
            default: ent = new Entity(spawn.x, spawn.y, spawn.w, spawn.h, spawn); break;
         }
         this.entities.push(ent);
      }
   }

   _loadEntities() {
      if (!(this.levelIndex in this.levelsInfo)) {
         // 4. 创建敌人
         this._createEnemy();
         // 5. 创建其他实体
         this._createEntities();
         this.level.enemies = this.enemies;
         this.level.entities = this.entities;
         this.levelsInfo[this.levelIndex] = this.level;
      }
      else {
         this.enemies = this.levelsInfo[this.levelIndex].enemies;
         this.entities = this.levelsInfo[this.levelIndex].entities;
      }
   }

   _loadPlayer(transition) {
      // 关卡过渡: 保留 HP、绳索材质等状态
      if (transition && this.player) {
         this.player.x = transition.x;
         this.player.y = transition.y;
         // 保留移动方向的速度, 过渡更流畅
         this.player.vx = transition.vx || 0;
         this.player.vy = transition.vy || 0;
         // 收回绳索 (跨关卡的锚点已失效)
         this._resetRope();
      }
      // 重新开始
      else if (this.status == "GAMEOVER" && this.player) {
         let start = this.level.playerStart || GameConfig.Player.DefaultStartPoint;
         this.player.hp = this.player.maxHp;
         this.player.x = start.x;
         this.player.y = start.y;
         this._resetRope();
      }
      // 新游戏
      else {
         let start = this.level.playerStart || GameConfig.Player.DefaultStartPoint;
         this.player = new Player(start.x, start.y);
      }
   }

   _resetRope() {
      this.player.ropeL.state = "IDLE";
      this.player.ropeL.nodes = [];
      this.player.ropeR.state = "IDLE";
      this.player.ropeR.nodes = [];
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

      // 敌人
      this._updateEnemies();

      // 通用实体
      this._updateEntities();

      // 粒子
      this._updateParticles();

      // ★ 关卡过渡检测 (优先于胜负判定)
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
      for (let ent of this.entities) ent.display();
      for (let e of this.enemies) e.display();
      for (let p of this.particles) p.display();
      this.player.ropeL.display(this.player);
      this.player.ropeR.display(this.player);
      this.player.display(this.camera, this.scale);

      pop();

      // 画小地图
      if (keyIsDown(77)) {
         this.level.drawMiniMap(this.player);
      }
      // UI (屏幕空间)
      UI.drawHUD(this.player);
      if (this.status === "WIN") UI.drawWinScreen();
      else if (this.status === "GAMEOVER") UI.drawGameOverScreen();
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
      if (key === 'r' || key === 'R') {
         this.status = "GAMEOVER";
         this.loadLevel();
      }
   }

   _onKeyDown() {
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.player.move(-1);  // d param: dir
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.player.move(1);  // a
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

   _updateEnemies() {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
         let e = this.enemies[i];

         // ★ 敌人更新接收 LevelManager
         e.update(this.level);

         // 绳索命中
         [this.player.ropeL, this.player.ropeR].forEach(rope => {
            if (rope.state === "EXTENDING" || rope.state === "SWINGING") {
               let tip = rope.getTip(this.player);
               if (dist(tip.x, tip.y, e.x + e.w / 2, e.y + e.h / 2) < 10 && !e.purified) {
                  e.takeDamage(1);
                  this.player._reduceCleanEnergy(5);
                  this.addParticles(e.x + e.w / 2, e.y + e.h / 2);
                  if (rope.state === "EXTENDING") rope.state = "RETRACTING";
               }
            }
         });

         if (e.isDead) this.enemies.splice(i, 1);
      }
   }

   _updateEntities() {
      for (let i = this.entities.length - 1; i >= 0; i--) {
         let ent = this.entities[i];
         ent.update(this.level);
         if (ent.isTouchingPlayer(this.player)) {
            ent.onPlayerContact(this.player, this);
         }
         if (ent.isDead) this.entities.splice(i, 1);
      }
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

      // 切换关卡, 保留速度让过渡更流畅
      this.levelIndex = result.levelIndex;
      this.loadLevel({
         x: result.newX,
         y: result.newY,
         vx: this.player.vx,
         vy: this.player.vy,
      });
   }

   _checkWinLose() {
      // 掉出地图底部 (且该方向没有邻居, 否则 _checkTransition 会先处理)
      if (this.player.y > this.level.mapH + 32) this.player.die(this);
      if (this.player.hp <= 0) this.player.die(this);
   }
}
