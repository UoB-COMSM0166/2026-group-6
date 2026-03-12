class Ladder extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.sprite = resources.images.ladder;
      this.climbSound = resources.sounds.ladder;
   }

   onPlayerContact(player, gm) {
      player.grounded = true;
      if (keyIsDown(UP_ARROW) || keyIsDown(Keys.W)) {
         player.vy = -2;
         player.vx *= 0.7;
      }
      if (keyIsDown(DOWN_ARROW) || keyIsDown(Keys.S)) {
         player.vy = 2;
         player.vx *= 0.7;
      }

      if (!keyIsDown(UP_ARROW) && !keyIsDown(Keys.W) &&
         !keyIsDown(DOWN_ARROW) && !keyIsDown(Keys.S)) {
         player.vy = 0;
         player.vy -= GameConfig.World.GRAVITY; // Counteract gravity
      }

      //ladder sound
      const climbing =
         (keyIsDown(UP_ARROW) || keyIsDown(Keys.W) ||
            keyIsDown(DOWN_ARROW) || keyIsDown(Keys.S));


      if (climbing) {
         if (!this.climbSound.isPlaying()) this.climbSound.play();
      }
      // else {
      //    if (this.climbSound.isPlaying()) this.climbSound.stop();
      // }
   }
}
