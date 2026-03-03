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
      this.images.pollutionCore = loadImage('resources/images/map_image/pollution_core.png');
      this.images.tools = loadImage('resources/images/map_image/tools.png');
      this.images.painting = { paintings: [] };
      for (let i = 1; i <= 5; i++) {
         this.images.painting.paintings.push(loadImage(`resources/images/map_image/background/background_${i}.png`));
      }
      

      // 音效扩展:

      this.sounds.rope = {
         ropeblue: loadSound('resources/audios/sides/bluewhoosh.mp3'),
         ropered: loadSound('resources/audios/sides/redwhoosh.mp3')
      };

      this.sounds.ladder = loadSound('resources/audios/sides/climbladder.mp3');
      this.sounds.doorfail = loadSound('resources/audios/sides/doornotopen.mp3');
      this.sounds.door = loadSound('resources/audios/sides/dooropen.mp3');
      this.sounds.failure = loadSound('resources/audios/sides/failure.mp3');
      this.sounds.intowater = loadSound('resources/audios/sides/intowater.mp3');
      this.sounds.underwater = loadSound('resources/audios/sides/underwatermove.mp3');
      this.sounds.map = loadSound('resources/audios/sides/map.mp3');
      this.sounds.click = loadSound('resources/audios/sides/menuclick.mp3');
      // 后续剧情用
      this.sounds.enemy = this.sounds.enemy || {};
      this.sounds.paper = loadSound('resources/audios/sides/paper.mp3');
      this.sounds.enemy.punch = loadSound('resources/audios/sides/punch.mp3');
      this.sounds.purify = loadSound('resources/audios/sides/purify.mp3');
      this.sounds.tool = loadSound('resources/audios/sides/tools.mp3');
      this.sounds.upgrade = loadSound('resources/audios/sides/upgrade.mp3');

      //怪物
      this.images.enemy = this.images.enemy || {};
      this.images.enemy.slime = {
         walk: loadImage('resources/images/enemy/Monster_Slime_Walk-Sheet.png'),
         attack: loadImage('resources/images/enemy/Monster_Slime_Attack1-Sheet.png'),
         hurt: loadImage('resources/images/enemy/Monster_Slime_Hurt-Sheet.png'),
      };
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
