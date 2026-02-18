class Rest extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
   }

   onPlayerContact(player, gm) {
      gm.level.resetPlayerStart(this.x + this.w * 0.15, this.y - player.h);
   }
}
