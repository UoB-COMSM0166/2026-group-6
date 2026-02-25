class Rest extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
   }

   onPlayerContact(player, gm) {
      player.setPrompt('F');
      if (keyIsDown(Keys.F)) {
         player.hp = player.maxHp;
         gm.level.resetPlayerStart(this.x + this.w * 0.15, this.y - player.h);
         gm.addParticles(this.cx(), this.cy());
      }
   }
}
