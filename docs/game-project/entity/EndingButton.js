class EndingButton extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.dialogText = "start to leave earth";
      this._playerNearby = false;
      this.dialogW = 85;
   }

   onPlayerContact(player, gm) {
      player.setPrompt('F');
      let progress = gm.getAreaProgress();
      if (progress >= 90) this._endding1(gm);
      else if (progress >= 60) this._endding2(gm);
      else this._endding3(gm);
      if (keyIsDown(Keys.F)) {
         gm.addParticles(this.cx(), this.cy());
         gm.status = "WIN";
      }
   }

   update(level) {
      if (!this._playerNearby && this.dialogOpen) {
         this.dialogOpen = false;
      }

      this._playerNearby = false;
   }

   _endding1(gm) {
      this.dialogText = "You have almost cleared all the pollution. \n, do you still have any nostalgia for the \npast environment? Stay and continue to \npurify the world.";
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _endding2(gm) {
      this.dialogText = "Good! There are also some pollution but \nlet us shoot to the space now.";
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _endding3(gm) {
      this.dialogText = "Start to leave earth!";
      if (!this.dialogOpen) this.dialogOpen = true;
   }
}