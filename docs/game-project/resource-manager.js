/**
 * ResourceManager — Resource Repository
 *
 * Centrally manages the loading of all resources (images, JSON files, and audio).
 * Ensures each asset is loaded only once, and all modules obtain resource references from here.
 *
 * NOTE: Image resources should be placed before audio resources.
 * Be mindful of this order when adding new assets.
 *
 * Usage:
 * Call resources.preload() inside p5.js's preload() function.
 * Access assets via resources.images.tileset or resources.data.ldtk.
 */
class ResourceManager {
   constructor() {
      // Resource Dictionaries
      this.images = {};
      this.data = {};
      this.data.enemyConfigs = {};
      this.fonts = {};
      this.sounds = {
         rope: {},
         enemy: {}
      };

      // Map difficulty preloading
      this.data.ldtk = {
         easy: null,
         medium: null,
         hard: null
      };
      this.data.currentLdtk;

      // Parallax background layers grouped by Area
      this.images.parallax = {
         area1: [],
         area2: [],
         area3: [],
         area4: []
      };
      this.images.tools = {};
   }

   /**
    * p5.js preload() to use
    * all loadImage / loadJSON here
    */
   preload() {
      // Data and Fonts
      this.data.ldtk.easy = loadJSON('map/map-easy.ldtk');
      this.data.ldtk.medium = loadJSON('map/map-normal.ldtk');
      this.data.ldtk.hard = loadJSON('map/map-main.ldtk');
      this.data.currentLdtk = this.data.ldtk.easy;
      this.data.enemyRules = loadJSON('resources/data/enemies/enemy-check.json');
      this.data.enemyConfigs.cat = loadJSON('resources/data/enemies/enemy-cat.json');
      this.data.enemyConfigs.bat = loadJSON('resources/data/enemies/enemy-bat.json');
      this.fonts.main = loadFont('resources/fonts/monogram.ttf');

      // --- Global Image Assets ---
      this.images.tileset = loadImage('resources/images/map_image/prototypegames_tiny_caverns/content/tilesets/tileset_full.png');
      this.images.ladder = loadImage('resources/images/map_image/ladder.png');
      this.images.button = loadImage('resources/images/map_image/button.png');
      this.images.cleaningEnergy = loadImage('resources/images/map_image/cleaningenergy.png');
      this.images.door1 = loadImage('resources/images/map_image/door1.png');
      this.images.door2 = loadImage('resources/images/map_image/door2.png');
      this.images.pollutionCore = loadImage('resources/images/map_image/pollution_core.png');
      
      // HUD / Tool Icons
      this.images.tools.energy = loadImage('resources/images/map_image/tools/tools_energy.png');
      this.images.tools.hp = loadImage('resources/images/map_image/tools/tools_hp.png');
      this.images.tools.rope = loadImage('resources/images/map_image/tools/tools_rope.png');
      this.images.tools.jump = loadImage('resources/images/map_image/tools/tools_jump.png');
      this.images.tools.attack = loadImage('resources/images/map_image/tools/tools_attack.png');
      this.images.tools.other = loadImage('resources/images/map_image/tools/tools_other.png');
      
      this.images.rest = loadImage('resources/images/map_image/reset.png');
      this.images.cover = loadImage('resources/images/map_image/cover.png');
      
      // Story Intro Sequence
      this.images.storyIntro = [];
      for (let i = 1; i <= 4; i++) {
         this.images.storyIntro.push(
            loadImage(`resources/images/map_image/background_information/${i}.png`)
         );
      }

      this.images.storyCard = loadImage(
         'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Card X3/Card X5.png'
      );
      this.images.resourcePanelCard = loadImage("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Card X2/Card X3.png");

      // World Paintings / Scenery
      this.images.painting = { paintings: [] };
      for (let i = 1; i <= 3; i++) {
         this.images.painting.paintings.push(loadImage(`resources/images/map_image/map_image/forest${i}.png`));
      }
      this.images.painting.paintings.push(loadImage(`resources/images/map_image/background/sky.png`));
      this.images.endings = {
         bad: [
            loadImage('resources/images/end/bad1.png'),
            loadImage('resources/images/end/bad2.png')
         ],
         good: [
            loadImage('resources/images/end/good1.png'),
            loadImage('resources/images/end/good2.png'),
            loadImage('resources/images/end/good3.png'),
            loadImage('resources/images/end/good4.png')
         ],
         best: [
            loadImage('resources/images/end/best1.png'),
            loadImage('resources/images/end/best2.png'),
            loadImage('resources/images/end/best3.png'),
            loadImage('resources/images/end/best4.png'),
            loadImage('resources/images/end/best5.png'),
            loadImage('resources/images/end/best6.png'),
            loadImage('resources/images/end/best7.png')
         ]
      };

        //enemy monster
        this.images.enemy = this.images.enemy || {};
      this.images.enemy.slime = {
         walk: loadImage('resources/images/enemy/Monster_Slime_Walk-Sheet.png'),
         attack: loadImage('resources/images/enemy/Monster_Slime_Attack1-Sheet.png'),
         hurt: loadImage('resources/images/enemy/Monster_Slime_Hurt-Sheet.png'),
      };
      this.images.enemy.cat = {
         stay: loadImage('resources/images/enemy/cat-stay.png'),
         run: loadImage('resources/images/enemy/cat-run.png'),
         attack: loadImage('resources/images/enemy/cat-attack.png')
      };
      this.images.enemy.bat = {
         stay: loadImage('resources/images/enemy/bat-stay.png'),
         fly: loadImage('resources/images/enemy/bat-fly.png'),
         attack: loadImage('resources/images/enemy/bat-attack.png')
      };

      // --- Boss Assets ---
      this.images.boss = {
         idle: loadImage('resources/images/enemy/Boss_Idle-Sheet.png'),
         shoot: loadImage('resources/images/enemy/Boss_Shoot-Sheet.png'),
         move: loadImage('resources/images/enemy/Boss_Walk-Sheet.png'),  
         hurt: loadImage('resources/images/enemy/Boss_Hurt-Sheet.png'),   
         death: loadImage('resources/images/enemy/Boss_Death-Sheet.png')
      };

      //map background
      //this.images.parallax = {};

      // Area1: Ephemeral_0..5 (6 layers)
      this.images.parallax.area1 = [];
      for (let i = 0; i <= 5; i++) {
         this.images.parallax.area1.push(
            loadImage(`resources/images/background/area1bg/Ephemeral_${i}.png`)
         );
      }

      // Area 2: WCP_1 to 5 (5 layers)
      this.images.parallax.area2 = [];
      for (let i = 1; i <= 5; i++) {
         this.images.parallax.area2.push(
            loadImage(`resources/images/background/area2bg/WCP_${i}.png`)
         );
      }

      // Area 3: 4 layers (Order: Far -> Mid -> Near -> Foreground)
      this.images.parallax.area3 = [
         loadImage(`resources/images/background/area3bg/far-buildings.png`),
         loadImage(`resources/images/background/area3bg/bg.png`),
         loadImage(`resources/images/background/area3bg/buildings.png`),
         loadImage(`resources/images/background/area3bg/skill-foreground.png`),
      ];

      // Area 4: 1 to 5 (5 layers)
      this.images.parallax.area4 = [];
      for (let i = 1; i <= 5; i++) {
         this.images.parallax.area4.push(
            loadImage(`resources/images/background/area4bg/${i}.png`)
         );
      }

      // sounds
      this.sounds.rope = {
         ropeblue: loadSound('resources/audios/sides/bluewhoosh.wav'),
         ropered: loadSound('resources/audios/sides/redwhoosh.wav')
      };

      this.sounds.ladder = loadSound('resources/audios/sides/climbladder.wav');
      this.sounds.doorfail = loadSound('resources/audios/sides/doornotopen.wav');
      this.sounds.door = loadSound('resources/audios/sides/dooropen.wav');
      this.sounds.failure = loadSound('resources/audios/sides/failure.wav');
      this.sounds.intowater = loadSound('resources/audios/sides/intowater.wav');
      this.sounds.underwater = loadSound('resources/audios/sides/underwatermove.wav');
      this.sounds.map = loadSound('resources/audios/sides/map.wav');
      this.sounds.click = loadSound('resources/audios/sides/menuclick.wav');

      this.sounds.enemy = this.sounds.enemy || {};
      this.sounds.paper = loadSound('resources/audios/sides/paper.wav');
      this.sounds.enemy.punch = loadSound('resources/audios/sides/punch.wav');
      this.sounds.purify = loadSound('resources/audios/sides/purify.wav');
      this.sounds.tool = loadSound('resources/audios/sides/tools.wav');
      this.sounds.upgrade = loadSound('resources/audios/sides/upgrade.wav');

      // --- Background Music (BGM) ---
      this.sounds.story = loadSound('resources/audios/background/forestdeep.mp3');
      this.sounds.begin = loadSound('resources/audios/background/begin.mp3');
      this.sounds.bgm = loadSound('resources/audios/background/forest.mp3');
      this.sounds.bgmPlaylists = {
         normal: [
            loadSound('resources/audios/background/forest.mp3'),
            loadSound('resources/audios/background/forest2.mp3'),
            loadSound('resources/audios/background/forest3.mp3'),
            loadSound('resources/audios/background/forestdeep.mp3'),
            loadSound('resources/audios/background/river.mp3'),
            loadSound('resources/audios/background/river2.mp3'),
            loadSound('resources/audios/background/wind.mp3')
         ],
         purified: [
            loadSound('resources/audios/background/forestp.mp3'),
            loadSound('resources/audios/background/forest2p.mp3'),
            loadSound('resources/audios/background/forest3p.mp3'),
            loadSound('resources/audios/background/river2p.mp3'),
            loadSound('resources/audios/background/windp.mp3')
         ]
      };
      this.sounds.quieterBgm = [...this.sounds.bgmPlaylists.purified];

      //Boss
      this.sounds.boss = loadSound('resources/audios/background/boss.mp3');
      this.sounds.alarm = loadSound('resources/audios/game_once/alarm.mp3');

      this.sounds.endings = {
         bad: loadSound('resources/audios/game_once/badend.mp3'),
         sad: loadSound('resources/audios/game_once/sadend.mp3'),
         normal: loadSound('resources/audios/game_once/normalend.mp3'),
         better: loadSound('resources/audios/game_once/betterend.mp3'),
         happy: loadSound('resources/audios/game_once/happyend.mp3'),
         // Placeholder: replace null with
         // loadSound('resources/audios/game_once/trueend.mp3')
         // after the true ending track is added.
         true: null
      };
   }

   /** Mark as loaded once preload is complete */
   markLoaded() {
      this._loaded = true;
   }

   get isLoaded() {
      return this._loaded;
   }

   /**get maps according to different levels
   * @param {string} difficulty - three levels: easy/medium/hard
   * @returns {object} 
   */
   setLdtkData(difficulty = "easy") {
      if (!this.data.ldtk[difficulty]) {
         console.warn(`[ResourceManager] No map found for "${difficulty}" difficulty; falling back to "easy".`);
         this.data.currentLdtk = this.data.ldtk.easy;
      } else {
         this.data.currentLdtk = this.data.ldtk[difficulty];
      }
   }

   // --- Getters for common assets ---
   get ldtkData() { return this.data.currentLdtk; }
   get tilesetImage() { return this.images.tileset; }
}
