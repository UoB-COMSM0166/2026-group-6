class GameManager {
   /**
    * @param {ResourceManager} resources
    */
   constructor(resources) {
      this.resources = resources;
      this.scale = GameConfig.Display.GAME_SCALE;
      this.levelIndex = GameConfig.Level.START_INDEX;

      this.level;
      this.camera = new Camera();
      this.levelsInfo = {}; // save class Levelmanager

      // Runtime object
      this.player = null;
      this.entities = [];
      this.particles = [];

      // state
      this.status = "PLAY"; // PLAY | WIN | GAMEOVER
      this.environmentChanged = false;
      this.mapPromptText = "";
      this.mapPromptStartTime;
      this.mapPromptDuration;
      this.endingSequence = null;
      this.pendingTeleport = null;
      this._isPreloading;
      this.checkpoint = null; // { levelIndex, x, y }
      this.preload();
   }

   // preload all levels in levelsinfo
   preload() {
      this._isPreloading = true;

      let ldtk = this.resources.ldtkData;
      const lastIndex = ldtk.levels.length;

      for (let levelIndex = 0; levelIndex < lastIndex; levelIndex++) {
         this.levelIndex = levelIndex;
         this.loadLevel();
      }

      this._isPreloading = false;

      this.levelIndex = GameConfig.Level.START_INDEX;
      this.loadLevel();

      let playerStart = this.level.playerStart || GameConfig.Player.DefaultStartPoint;
      this.saveCheckpoint(this.levelIndex, playerStart.x, playerStart.y);
   }

   /**
    * @param {Object} [transition]
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

      this._loadEntities();

      if (!this._isPreloading) {
         let size = this.level.getCanvasSize();
         resizeCanvas(size.w, size.h);

         this._loadPlayer(transition);
         this.particles = [];
         this.camera.reset();
         this.status = "PLAY";

         this.setMapPrompt(ldtk.levels[this.levelIndex].identifier, 3000);
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
         this._createEntities();
         this.level.entities = this.entities;
         this.levelsInfo[this.levelIndex] = this.level;
         this.level.totalPollutionCore = this.level.getEntityCount(GameConfig.Entity.PollutionCore);
         this.level.totalEnemies = this.level.getEntityCount(GameConfig.Entity.Enemy);
         this.level.totalBoss = this.level.getEntityCount(GameConfig.Entity.Boss);
      }
      else {
         this.entities = this.levelsInfo[this.levelIndex].entities;
      }
   }

   _loadPlayer(transition) {
      if (transition && this.player) {
         // Invincible frames when switching maps
         this.player.invulnerableTimer = GameConfig.Player.InvulInterval
         this.player.x = transition.x;
         this.player.y = transition.y;
         // retains part of speed of move
         this.player.vx = transition.vx * 0.5 || 0;
         this.player.vy = transition.vy * 0.5 || 0;
         // Retrieve the rope
         this._resetRope();
      }
      // restart in one game
      else if (this.status == "GAMEOVER" && this.player) {
         let cp = this.checkpoint;
         this.player.hp = this.player.maxHp;
         this.player.x = cp.x;
         this.player.y = cp.y;
         this.player.vx = 0;
         this.player.vy = 0;
         this._resetRope();
      }
      // new game
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

      this.player.update(this);

      this._onKeyDown();

      // camera
      let viewW = width / this.scale;
      let viewH = height / this.scale;
      this.camera.follow(this.player, this.level.mapW, this.level.mapH, viewW, viewH);

      // entities
      this._updateEntities();
      this._checkTeleport();

      this._checkProcess()

      this._updateParticles();

      // Level transition detection
      this._checkTransition();

      this._checkWinLose();
   }



   render() {
      background(color(this.level.bgColor));

      push();
      scale(this.scale);
      translate(-this.camera.x, -this.camera.y);

      // render area background
      this.drawBackground();

      // LevelManager Draw all Tiles in layer order
      this.level.draw(this.resources.tilesetImage);

      // entity
      for (let ent of this.entities) ent.display(this.level, this);
      for (let p of this.particles) p.display();
      this.player.ropeL.display(this.player);
      this.player.ropeR.display(this.player);
      this.player.display(this.camera, this.scale);

      // water
      for (let ent of this.entities) {
         if (ent.displayWater) {
            ent.displayWater(this.level);
         }
      }

      pop();

      this.level.drawMiniMap(this.player);

      if (keyIsDown(Keys.M)) {
         this.level.drawLargeMap(this.player, this);
      }
      else {
         this.level.mapOpen = false;
      }

      if (this.player.resourcePanel.visible) {
         this.player.resourcePanel.display(this.player);
      }

      // UI
      UI.drawHUD(this.player, this.level, this);
      if (this.status === "WIN") UI.drawWinScreen(this);
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

      // world pixel
      const viewW = width / this.scale;
      const viewH = height / this.scale;

      // Calculate Area bounding box & center
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
         // Fall back to the current level's own bounds if no levels in the same area are found
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

      // Absolute world coordinates of the camera center
      const camAbsX = this.level.worldX + this.camera.x + viewW / 2;
      const camAbsY = this.level.worldY + this.camera.y + viewH / 2;

      // Offset between the camera and the Area center
      const dx = camAbsX - ab.cx;
      const dy = camAbsY - ab.cy;

      // Parallax factors for each layer: Far → Near
      // factor = 0: Static (at infinity), does not move with camera
      // factor = 1: Fully follows the camera (no parallax)
      const factors = layers.map((_, i) =>
         0.05 + i * (0.85 / Math.max(1, layers.length - 1))
      );

      // Viewport boundaries (level coordinates)
      const vl = this.camera.x;
      const vt = this.camera.y;

      // Draw layers sequentially (Back to Front)
      for (let i = 0; i < layers.length; i++) {
         const img = layers[i];
         if (!img) continue;

         const f = factors[i];

         // Layer center in absolute world coordinates:
         // When the camera is at the Area center, the layer center aligns with the Area center.
         // For every 1px the camera shifts, the layer shifts by f px, creating (1-f) parallax.
         const layerAbsCX = ab.cx + dx * f;
         const layerAbsCY = ab.cy + dy * f;

         // Convert to local level coordinates
         const layerLocalCX = layerAbsCX - this.level.worldX;
         const layerLocalCY = layerAbsCY - this.level.worldY;

         // Scaling: Ensure coverage of viewport + max parallax shift
         // Max shift = Area half-width/height × (1-f)
         const maxShiftX = (ab.w / 2) * (1 - f);
         const maxShiftY = (ab.h / 2) * (1 - f);
         const neededW = viewW + maxShiftX * 2;
         const neededH = viewH + maxShiftY * 2;

         // Use the maximum scale ratio to ensure both width and height are covered
         const imgScale = Math.max(
            neededW / img.width,
            neededH / img.height,
            viewW / img.width,   // Fallback: at least fill the viewport
            viewH / img.height
         );
         const sw = img.width * imgScale;
         const sh = img.height * imgScale;

         // Image top-left corner (relative to layer center)
         const bx = layerLocalCX - sw / 2;
         const by = layerLocalCY - sh / 2;

         // Check if a single image covers the viewport; if not, enable tiling
         if (bx <= vl && bx + sw >= vl + viewW &&
            by <= vt && by + sh >= vt + viewH) {
            // Single instance is sufficient
            image(img, bx, by, sw, sh);
         } else {
            // Tiling: Calculate number of rows and columns needed
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

   // input
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

         if (key === 'C' || key === 'c') {
            this.player.resourcePanel.toggle();
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

   addParticles(x, y, count = 5) {
      this.particles.push(...Particle.spawn(x, y, count));
   }

   _updateEntities() {
      for (let i = this.entities.length - 1; i >= 0; i--) {
         let ent = this.entities[i];
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
   }

   _updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
         this.particles[i].update();
         if (this.particles[i].isDead) this.particles.splice(i, 1);
      }
   }

   /**
    * Detects if the player has reached the map boundary and if a neighboring level exists.
    * If so, switches to the adjacent level and repositions the player.
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

      // Set cooldown for all portals in the target level to prevent immediate return
      for (let ent of this.entities) {
         if (ent instanceof TeleportationGate) {
            ent.cooldown = 30;
         }
      }
   }

   _checkProcess() {
      if (!this.level) return;

      const progress = this.getAreaProgress();

      if (progress > GameConfig.World.PURIFY_CHANGE_THRESHOLD && this.environmentChanged == false) {
         if (!resources.sounds.upgrade.isPlaying()) resources.sounds.upgrade.play();
         this.setMapPrompt(t('prompts.environmentChanged'), 3000);
         this.environmentChanged = true;

         if (!this.level.toxicConverted) {
            for (let key in this.levelsInfo) {
               let level = this.levelsInfo[key];
               if (!level) continue;
               if (level.areaNumber === this.level.areaNumber) {
                  level.transformPollutedTiles();
               }
            }
         }
      }

      if (progress < GameConfig.World.PURIFY_CHANGE_THRESHOLD && this.environmentChanged == true) {
         this.environmentChanged = false;
      }
   }

   _checkTransition() {
      let result = this.level.checkEdgeTransition(this.player);
      if (!result) return;
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
      // across bottom of map
      if (this.player.y > this.level.mapH + 32) this.player.die(this);
      if (this.player.hp <= 0) this.player.die(this);
   }

   /*
   * Calculate the purification percentage progress of the current Area (which contains multiple Levels)
   * Weight rules is in config
   */
   getAreaProgress(areaNumber) {
      let ldtk = this.resources.ldtkData;
      if (!ldtk || !ldtk.levels || !this.level) return 0;

      let currentAreaNumber = areaNumber || this.level.areaNumber;
      currentAreaNumber = Number(currentAreaNumber);

      let CORE_WEIGHT = GameConfig.Level.CORE_WEIGHT;
      let ENEMY_WEIGHT = GameConfig.Level.ENEMY_WEIGHT;
      let BOSS_WEIGHT = GameConfig.Level.BOSS_WEIGHT;

      let remainingCores = 0;
      let remainingEnemies = 0;
      let remainingBoss = 0;
      let initialCores = 0;
      let initialEnemies = 0;
      let initialBoss = 0;

      for (let i = 0; i < ldtk.levels.length; i++) {
         let lvl = this.levelsInfo[i];

         if (!lvl) continue;

         if (Number(lvl.areaNumber) === currentAreaNumber || currentAreaNumber === 5) {
            initialCores += lvl.totalPollutionCore || 0;
            initialEnemies += lvl.totalEnemies || 0;
            initialBoss += lvl.totalBoss || 0;

            remainingCores += lvl.getEntityCount(GameConfig.Entity.PollutionCore);
            remainingEnemies += lvl.getEntityCount(GameConfig.Entity.Enemy);
            remainingBoss += lvl.getEntityCount(GameConfig.Entity.Boss);
         }
      }

      let currentPurifiedEnemies = initialEnemies - remainingEnemies;
      let currentPurifiedCores = initialCores - remainingCores;
      let currentPurifiedBoss = initialBoss - remainingBoss;

      let currentPurifiedValue =
         currentPurifiedEnemies * ENEMY_WEIGHT +
         currentPurifiedCores * CORE_WEIGHT +
         currentPurifiedBoss * BOSS_WEIGHT;

      let totalValue =
         initialCores * CORE_WEIGHT +
         initialEnemies * ENEMY_WEIGHT +
         initialBoss * BOSS_WEIGHT;

      let percentage = (totalValue === 0)
         ? 100
         : Math.floor((currentPurifiedValue / totalValue) * 100);

      return percentage;
   }

   // Global entity lookup by id

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

   setMapPrompt(text, duration) {
      // if (millis() - this.mapPromptStartTime < this.mapPromptDuration) return;
      this.mapPromptText = text;
      this.mapPromptStartTime = millis();
      this.mapPromptDuration = duration;
   }
}
