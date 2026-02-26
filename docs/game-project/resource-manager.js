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
      this.images.tileset = loadImage('resources/images/map_image/test_allgrid_8px.png');
      this.images.ladder = loadImage('resources/images/map_image/ladder.png');
      this.images.painting = { paintings: [] };
      for (let i = 1; i <= 5; i++) {
         this.images.painting.paintings.push(loadImage(`resources/images/map_image/background_${i}.png`));
      }
      // 音效扩展:
      this.sounds.line1 = loadSound('resources/audio/sides/bluewhoosh.mp3');
      this.sounds.line2 = loadSound('resources/audio/sides/redwhoosh.mp3');
      this.sounds.ladder = loadSound('resources/audio/sides/climbladder.mp3');
      this.sounds.doorfail = loadSound('resources/audio/sides/doornotopen.mp3');
      this.sounds.door = loadSound('resources/audio/sides/dooropen.mp3');
      this.sounds.failure = loadSound('resources/audio/sides/failure.mp3');
      this.sounds.water = loadSound('resources/audio/sides/intowater.mp3');
      this.sounds.map = loadSound('resources/audio/sides/map.mp3');
      this.sounds.click = loadSound('resources/audio/sides/menuclick.mp3');
      // 后续剧情用
      // this.sounds.connection = loadSound('resources/audio/sides/noconnection.mp3');
      this.sounds.paper = loadSound('resources/audio/sides/paper.mp3');
      this.sounds.punch = loadSound('resources/audio/sides/punch.mp3');
      this.sounds.purify = loadSound('resources/audio/sides/purify.mp3');
      this.sounds.tool = loadSound('resources/audio/sides/tools.mp3');
      // this.sounds.move = loadSound('resources/audio/sides/underwatermove.mp3');
      this.sounds.upgrade = loadSound('resources/audio/sides/upgrade.mp3');
      
      // this.images.playerSprite = loadImage('resources/images/player.png');
      // this.sounds.jump = loadSound('resources/audio/jump.wav');
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
