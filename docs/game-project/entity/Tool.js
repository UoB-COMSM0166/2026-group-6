class Tool extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
   }

   onPlayerContact(player, gm) {
      // 暂时留空, 以后加拾取逻辑
   }
}
