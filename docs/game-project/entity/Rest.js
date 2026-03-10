class Rest extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.sprite = resources.images.rest;
   }

   onPlayerContact(player, gm) {
      player.restoreHp(player.maxHp - player.hp);
      gm.saveCheckpoint(gm.levelIndex, this.x + this.w * 0.15, this.y - player.h);
      gm.addParticles(this.cx(), this.cy());
   }
}
