class Game {
   constructor(ldtkData, tilesetImage) {
      this.ldtkData = ldtkData;
      this.tilesetImage = tilesetImage;
      this.levelIndex = GameConfig.Level.START_INDEX;
      this.scale = GameConfig.Display.GAME_SCALE;

      // 游戏世界状态
      this.player = null;
      this.platforms = [];
      this.solidPlatforms = [];
      this.enemies = [];
      this.particles = [];

      this.camera = new Camera();
      this.status = "PLAY";   // PLAY | WIN | GAMEOVER
   }

   // ========== 关卡管理 ==========

   loadLevel() {
      let data = LevelLoader.load(this.ldtkData, this.levelIndex);

      resizeCanvas(data.canvasWidth, data.canvasHeight);

      this.player = data.player;
      this.platforms = data.platforms;
      this.solidPlatforms = data.solidPlatforms;
      this.enemies = data.enemies;
      this.particles = [];
      this.camera.reset();
      this.status = "PLAY";
   }

   // ========== 主循环 ==========

   update() {
      if (this.status !== "PLAY") return;

      // 玩家更新（传入 game 引用）
      this.player.update(this);

      // 摄像机跟随
      let level = this.ldtkData.levels[this.levelIndex];
      let viewW = width / this.scale;
      let viewH = height / this.scale;
      this.camera.follow(this.player, level.pxWid, level.pxHei, viewW, viewH);

      // 敌人更新
      this.updateEnemies();

      // 粒子更新
      this.updateParticles();

      // 胜负判定
      this.checkWinLose(level);
   }

   // 渲染
   render() {
      if (!this.ldtkData) return;

      let level = this.ldtkData.levels[this.levelIndex];
      background(color(level.__bgColor));

      push();
      scale(this.scale);
      translate(-this.camera.x, -this.camera.y);

      // 绘制 LDtk 瓦片图层（从后往前）
      let layers = level.layerInstances;
      for (let i = layers.length - 1; i >= 0; i--) {
         if (layers[i].__identifier !== "Entities") {
            Renderer.drawLayerTiles(layers[i], this.tilesetImage);
         }
      }

      // 绘制游戏对象
      for (let e of this.enemies) e.display();
      for (let p of this.particles) p.display();

      this.player.ropeL.display(this.player);
      this.player.ropeR.display(this.player);
      this.player.display(this.camera, this.scale);

      pop();

      // 绘制 UI（屏幕空间）
      UI.drawHUD(this.player);

      if (this.status === "WIN") UI.drawWinScreen();
      else if (this.status === "GAMEOVER") UI.drawGameOverScreen();
   }

   // ========== 输入处理 ==========

   onMousePressed(button) {
      if (this.status !== "PLAY") return;

      let worldPos = this.camera.screenToWorld(mouseX, mouseY, this.scale);
      if (button === LEFT) this.player.fireRope("LEFT", worldPos.x, worldPos.y);
      if (button === RIGHT) this.player.fireRope("RIGHT", worldPos.x, worldPos.y);
   }

   onKeyPressed(key) {
      if (this.status === "PLAY") {
         if (key === ' ') this.player.jump();
         if (key === '1') this.player.ropeL.toggleMaterial(this.player);
         if (key === '2') this.player.ropeR.toggleMaterial(this.player);
      }

      if (key === 'r' || key === 'R') {
         this.loadLevel();
      }
   }

   // ========== 粒子管理 ==========

   addParticles(x, y, count = 5) {
      let newParticles = Particle.spawn(x, y, count);
      this.particles.push(...newParticles);
   }

   // ========== 内部逻辑 ==========

   updateEnemies() {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
         let e = this.enemies[i];
         e.update(this.solidPlatforms);

         // 绳索命中判定
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

   updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
         this.particles[i].update();
         if (this.particles[i].isDead) this.particles.splice(i, 1);
      }
   }

   checkWinLose(level) {
      if (this.player.x > level.pxWid - 16) this.status = "WIN";
      if (this.player.y > level.pxHei + 32) this.player.die(this);
      if (this.player.hp <= 0) this.player.die(this);
   }
}
