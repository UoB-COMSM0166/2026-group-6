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
      else{
         this.destroy();
      }
   }
}
