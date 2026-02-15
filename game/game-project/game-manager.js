/**
 * GameManager — 总导演
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
      this.level = new LevelManager();
      this.camera = new Camera();

      // 运行时对象
      this.player = null;
      this.enemies = [];
      this.particles = [];

      // 游戏状态
      this.status = "PLAY"; // PLAY | WIN | GAMEOVER
   }

   // ========================================================
   //  关卡管理
   // ========================================================

   loadLevel() {
      let ldtk = this.resources.ldtkData;

      // 1. LevelManager 解析地图
      this.level.load(ldtk, this.levelIndex);

      // 2. 调整画布
      let size = this.level.getCanvasSize();
      resizeCanvas(size.w, size.h);

      // 3. 从 LevelManager 的实体数据创建游戏对象
      let start = this.level.playerStart || { x: 50, y: 50 };
      this.player = new Player(start.x, start.y);

      this.enemies = [];
      for (let spawn of this.level.enemySpawns) {
         this.enemies.push(new Enemy(spawn.x, spawn.y, spawn.hp, spawn.damage, this.level));
      }

      this.particles = [];
      this.camera.reset();
      this.status = "PLAY";
   }

   // ========================================================
   //  主循环
   // ========================================================

   update() {
      if (this.status !== "PLAY") return;

      // 玩家更新 (传入 GameManager 引用)
      this.player.update(this);

      // 摄像机
      let viewW = width / this.scale;
      let viewH = height / this.scale;
      this.camera.follow(this.player, this.level.mapW, this.level.mapH, viewW, viewH);

      // 敌人
      this._updateEnemies();

      // 粒子
      this._updateParticles();

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
      for (let e of this.enemies) e.display();
      for (let p of this.particles) p.display();
      this.player.ropeL.display(this.player);
      this.player.ropeR.display(this.player);
      this.player.display(this.camera, this.scale);

      pop();

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
         if (key === ' ') this.player.jump();
         if (key === '1') this.player.ropeL.toggleMaterial(this.player);
         if (key === '2') this.player.ropeR.toggleMaterial(this.player);
      }
      if (key === 'r' || key === 'R') this.loadLevel();
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
                  this.addParticles(e.x + e.w / 2, e.y + e.h / 2);
                  if (rope.state === "EXTENDING") rope.state = "RETRACTING";
               }
            }
         });

         if (e.isDead) this.enemies.splice(i, 1);
      }
   }

   _updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
         this.particles[i].update();
         if (this.particles[i].isDead) this.particles.splice(i, 1);
      }
   }

   _checkWinLose() {
      if (this.player.x > this.level.mapW - 16) this.status = "WIN";
      if (this.player.y > this.level.mapH + 32) this.player.die(this);
      if (this.player.hp <= 0) this.player.die(this);
   }
}
