class Rest extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
   }

   onPlayerContact(player, gm) {
      player.hp = player.maxHp;
      gm.saveCheckpoint(gm.levelIndex, this.x + this.w * 0.15, this.y - player.h);
      gm.addParticles(this.cx(), this.cy());
   }
}
