/**
 * ResourceManager — 资源仓库
 *
 * 集中管理所有资源（图片、JSON、音效）的加载。
 * 保证每个素材只加载一次，所有模块从这里获取资源引用。
 *
 * 用法:
 *   preload() 中调用 resources.preload()
 *   之后通过 resources.images.tileset / resources.data.ldtk 访问字典
 */
class ResourceManager {
   constructor() {
      // (dict)
      this.images = {};
      this.data = {};
      this.sounds = {};
      this._loaded = false;
   }

   /**
    * 在 p5.js preload() 中调用
    * 所有 loadImage / loadJSON 都写在这里
    */
   preload() {
      this.data.ldtk = loadJSON('map/map-main.ldtk');
      this.images.tileset = loadImage('resources/images/map_image/prototypegames_tiny_caverns/content/tilesets/tileset_full.png');
      this.images.ladder = loadImage('resources/images/map_image/ladder.png');
      this.images.button = loadImage('resources/images/map_image/button.png');
      this.images.cleaningEnergy = loadImage('resources/images/map_image/cleaningenergy.png');
      this.images.door1 = loadImage('resources/images/map_image/door1.png');
      this.images.door2 = loadImage('resources/images/map_image/door2.png');
      this.images.pollutionCore = loadImage('resources/images/map_image/pollution_core.png');
      this.images.tools = loadImage('resources/images/map_image/tools.png');
      this.images.rest = loadImage('resources/images/map_image/reset.png');
      this.images.cover = loadImage('resources/images/map_image/cover.png');
      this.images.painting = { paintings: [] };
      for (let i = 1; i <= 5; i++) {
         this.images.painting.paintings.push(loadImage(`resources/images/map_image/background/background_${i}.png`));
      }


      // 音效扩展:

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
      // 后续剧情用
      this.sounds.enemy = this.sounds.enemy || {};
      this.sounds.paper = loadSound('resources/audios/sides/paper.wav');
      this.sounds.enemy.punch = loadSound('resources/audios/sides/punch.wav');
      this.sounds.purify = loadSound('resources/audios/sides/purify.wav');
      this.sounds.tool = loadSound('resources/audios/sides/tools.wav');
      this.sounds.upgrade = loadSound('resources/audios/sides/upgrade.wav');

      //怪物
      this.images.enemy = this.images.enemy || {};
      this.images.enemy.slime = {
         walk: loadImage('resources/images/enemy/Monster_Slime_Walk-Sheet.png'),
         attack: loadImage('resources/images/enemy/Monster_Slime_Attack1-Sheet.png'),
         hurt: loadImage('resources/images/enemy/Monster_Slime_Hurt-Sheet.png'),
      };

      //地图背景
      this.images.parallax = {};

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

   }

   /** preload 完成后标记 */
   markLoaded() {
      this._loaded = true;
   }

   get isLoaded() {
      return this._loaded;
   }

   // 便捷访问器
   get ldtkData() { return this.data.ldtk; }
   get tilesetImage() { return this.images.tileset; }
}
