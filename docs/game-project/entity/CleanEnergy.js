class CleanEnergy extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.energy = 100;
      this.sprite = resources.images.cleanenergy;
   }

   onPlayerContact(player, gm) {
      if (this.energy > 0) {
         player.setPrompt('F');
         if (keyIsDown(Keys.F)) {
            gm.addParticles(this.cx(), this.cy());
            let consume = 2;
            player.supplyCleanEnergy(consume);
            this.energy -= consume;
         }
      }
   }
}
