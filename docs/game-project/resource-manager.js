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
      // 未来扩展:
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
