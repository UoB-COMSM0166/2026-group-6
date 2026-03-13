/**
 * ResourceManager — Resource Repository
 *
 * Centrally manages the loading of all resources (images, JSON files, and audio).
 * Ensures each asset is loaded only once, and all modules obtain resource references from here.
 *
 *
 * ========= The images resources must be placed before the audios resources.
 * Be careful to keep this order when adding new image resources. =====
 *
 * Usage:
 *   Call resources.preload() inside preload()
 *   Then access resources via resources.images.tileset / resources.data.ldtk
 */
class ResourceManager {
   constructor() {
      // (dict)
      this.images = {};
      this.data = {};
      this.fonts = {};
      this.sounds = {
         rope: {},
         enemy: {}
   };

      //地图难度preload
      this.data.ldtk = {
         easy: null,
         medium: null,
         hard: null
      };
      this.data.currentLdtk;
      this.images.parallax = {
         area1: [],
         area2: [],
         area3: [],
         area4: []
      };
      this.images.tools={};
   }

   /**
    * 在 p5.js preload() 中调用
    * 所有 loadImage / loadJSON 都写在这里
    */
   preload() {
      this.data.ldtk.easy = loadJSON('map/map-easy.ldtk');
      //this.data.ldtk.easy = loadJSON('map/help.ldtk');
      this.data.ldtk.medium = loadJSON('map/map-normal.ldtk');
      this.data.ldtk.hard = loadJSON('map/map-main.ldtk');
      this.data.currentLdtk = this.data.ldtk.easy;
      this.fonts.main = loadFont('resources/fonts/monogram.ttf');

      //images
      this.images.tileset = loadImage('resources/images/map_image/prototypegames_tiny_caverns/content/tilesets/tileset_full.png');
      this.images.ladder = loadImage('resources/images/map_image/ladder.png');
      this.images.button = loadImage('resources/images/map_image/button.png');
      this.images.cleaningEnergy = loadImage('resources/images/map_image/cleaningenergy.png');
      this.images.door1 = loadImage('resources/images/map_image/door1.png');
      this.images.door2 = loadImage('resources/images/map_image/door2.png');
      this.images.pollutionCore = loadImage('resources/images/map_image/pollution_core.png');
      this.images.tools.energy = loadImage('resources/images/map_image/tools/tools_energy.png');
      this.images.tools.hp = loadImage('resources/images/map_image/tools/tools_hp.png');
      this.images.tools.rope = loadImage('resources/images/map_image/tools/tools_rope.png');
      this.images.tools.jump = loadImage('resources/images/map_image/tools/tools_jump.png');
      this.images.tools.attack = loadImage('resources/images/map_image/tools/tools_attack.png');
      this.images.tools.other = loadImage('resources/images/map_image/tools/tools_other.png');
      this.images.rest = loadImage('resources/images/map_image/reset.png');
      this.images.cover = loadImage('resources/images/map_image/cover.png');
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

      this.images.painting = { paintings: [] };
      for (let i = 1; i <= 3; i++) {
         this.images.painting.paintings.push(loadImage(`resources/images/map_image/map_image/forest${i}.png`));
      }
      this.images.painting.paintings.push(loadImage(`resources/images/map_image/background/sky.png`));

      //怪物
      this.images.enemy = this.images.enemy || {};
      this.images.enemy.slime = {
         walk: loadImage('resources/images/enemy/Monster_Slime_Walk-Sheet.png'),
         attack: loadImage('resources/images/enemy/Monster_Slime_Attack1-Sheet.png'),
         hurt: loadImage('resources/images/enemy/Monster_Slime_Hurt-Sheet.png'),
      };

      //Boss
      this.images.boss = {
         idle: loadImage('resources/images/enemy/Boss_Idle-Sheet.png'),
         shoot: loadImage('resources/images/enemy/Boss_Shoot-Sheet.png'),
         move: loadImage('resources/images/enemy/Boss_Walk-Sheet.png'),  
         hurt: loadImage('resources/images/enemy/Boss_Hurt-Sheet.png'),   
         death: loadImage('resources/images/enemy/Boss_Death-Sheet.png')
      };

      //地图背景
      //this.images.parallax = {};

      // Area1: Ephemeral_0..5 (6 layers)
      this.images.parallax.area1 = [];
      for (let i = 0; i <= 5; i++) {
         this.images.parallax.area1.push(
            loadImage(`resources/images/background/area1bg/Ephemeral_${i}.png`)
         );
      }

      // Area2: WCP_1..5 (5 layers)
      this.images.parallax.area2 = [];
      for (let i = 1; i <= 5; i++) {
         this.images.parallax.area2.push(
            loadImage(`resources/images/background/area2bg/WCP_${i}.png`)
         );
      }

      // Area3: 4 layers (order matters: far -> mid -> near -> foreground)
      this.images.parallax.area3 = [
         loadImage(`resources/images/background/area3bg/far-buildings.png`),
         loadImage(`resources/images/background/area3bg/bg.png`),
         loadImage(`resources/images/background/area3bg/buildings.png`),
         loadImage(`resources/images/background/area3bg/skill-foreground.png`),
      ];

      // Area4: 1..5 (5 layers)  (folder name in zip is "aera4bg")
      this.images.parallax.area4 = [];
      for (let i = 1; i <= 5; i++) {
         this.images.parallax.area4.push(
            loadImage(`resources/images/background/area4bg/${i}.png`)
         );
      }

      // 音效：
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

      //bgm:
      this.sounds.story = loadSound('resources/audios/background/forestdeep.mp3');
      //this.sounds.begin = loadSound('resources/audios/background/begin.mp3');
      this.sounds.bgm = loadSound('resources/audios/background/forest.mp3');

      //Boss
      //Boss音效
      //this.sounds.boss = loadSound('resources/audios/background/boss.mp3');
      //this.sounds.alarm = loadSound('resources/audios/game_once/alarm.mp3');

      //END之后用
      //this.sounds.bad = loadSound('resources/audios/game_once/badend.mp3');
      //this.sounds.better = loadSound('resources/audios/game_once/betterend.mp3');
      //this.sounds.happy = loadSound('resources/audios/game_once/happyend.mp3');
      //this.sounds.normal = loadSound('resources/audios/game_once/normalend.mp3');
      //this.sounds.sad = loadSound('resources/audios/game_once/sadend.mp3');
   }


   /** preload 完成后标记 */
   markLoaded() {
      this._loaded = true;
   }

   get isLoaded() {
      return this._loaded;
   }

   /**按难度获取对应地图
   * @param {string} difficulty - 难度分级: easy/medium/hard
   * @returns {object} 
   */
   setLdtkData(difficulty = "easy") {
      if (!this.data.ldtk[difficulty]) {
         console.warn(`[ResourceManager] 未找到${difficulty}难度对应地图则回到easy`);
         this.data.currentLdtk = this.data.ldtk.easy;
      }
      this.data.currentLdtk = this.data.ldtk[difficulty];
   }

   //兼顾访问器
   //测试临时改动
   get ldtkData() { return this.data.currentLdtk; }

   get tilesetImage() { return this.images.tileset; }
}
