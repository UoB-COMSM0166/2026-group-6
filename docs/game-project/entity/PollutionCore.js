class PollutionCore extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.sprite = resources.images.pollutionCore;
      this.polluteDegree = 50; // clear need energy
      this.purifySound = resources.sounds.purify;
   }

   onPlayerContact(player, gm) {
      if (this.polluteDegree > 0) {
         player.setPrompt('F');
         if (keyIsDown(Keys.F)) {
            let consume = 2;
            if (player.checkRemainCleanEnergy(consume)) {
               gm.addParticles(this.cx(), this.cy());
               player.reduceCleanEnergy(consume);
               this.polluteDegree -= consume;
            }
         }
      }
      else {
         if (!this.purifySound.isPlaying()) this.purifySound.play();
         this.destroy();
      }
   }

   onRopeContact(rope, player, gm) {
      if (this.isDead) return;
      if (rope.state !== "SWINGING") rope.state = "SWINGING";

      if (this.polluteDegree > 0) {
         player.setPrompt('F');
         if (keyIsDown(Keys.F)) {
            let consume = 2;
            if (player.checkRemainCleanEnergy(consume)) {
               gm.addParticles(this.cx(), this.cy());
               player.reduceCleanEnergy(consume);
               this.polluteDegree -= consume;
            }
         }
      }
      else {
         if (rope.state !== "RETRACTING") rope.state = "RETRACTING";
         if (!this.purifySound.isPlaying()) this.purifySound.play();
         this.destroy();
      }
   }
}
