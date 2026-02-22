class PollutionCore extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.polluteDegree = 75; // clear need energy
   }

   onPlayerContact(player, gm) {
      if (this.polluteDegree > 0) {
         player.setPrompt('F');
         if (keyIsDown(Keys.F)) {
            let consume = 2;
            player.reduceCleanEnergy(consume);
            this.polluteDegree -= consume;
         }
      }
      else {
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
            gm.addParticles(this.cx(), this.cy());
            player.reduceCleanEnergy(consume);
            this.polluteDegree -= consume;
         }
      }
      else {
         if (rope.state !== "RETRACTING") rope.state = "RETRACTING";
         this.destroy();
      }
   }
}
