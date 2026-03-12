class Painting extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      const dialogPool = [
         "The sky was once\nthis clear every day.",
         "A world without smog.\nWas it ever real?",
         "Look at those trees.\nSo alive, so green.",
         "The air in this painting\nfeels clean. I miss that.",
         "Nature in its purest form.\nWe almost lost it all.",
         "Such stillness.\nNo pollution, no monster.",
         "The painter must have\nloved this world deeply.",
         "Every leaf, every wave—\nperfect as they are.",
         "If only we could\nstep inside this world.",
         "The light here is warm.\nNot filtered through dust.",
         "Somewhere, this place\nstill exists. Maybe.",
         "The scenery in the past, \nit was really beautiful!",
      ];
      this.dialogText = random(dialogPool);
      this.sprite = random(resources.images.painting.paintings);

      this.dialogOpen = false;
      this._playerNearby = false;
   }

   onPlayerContact(player, gm) {
      this._playerNearby = true;
      let fNow = keyIsDown(Keys.F);
      if (fNow && !this.dialogOpen) {
         this.dialogOpen = true;
         if (!resources.sounds.paper.isPlaying()) resources.sounds.paper.play();
      }
      if (this.dialogOpen === true) return;

      player.setPrompt('F');
   }

   update(level) {
      if (!this._playerNearby && this.dialogOpen) {
         this.dialogOpen = false;
      }

      this._playerNearby = false;
   }

   display() {
      this._drawFrame();
      super.display();
   }

   _drawFrame() {
      const f = 3;
      const fx = this.x - f;
      const fy = this.y - f;
      const fw = this.w + f * 2;
      const fh = this.h + f * 2;

      noStroke();

      fill(30, 20, 10);
      rect(fx - 1, fy - 1, fw + 2, fh + 2);

      fill(120, 80, 30);
      rect(fx, fy, fw, fh);

      fill(180, 130, 60);
      rect(fx, fy, fw, 1);
      rect(fx, fy, 1, fh);

      fill(70, 45, 15);
      rect(fx + fw - 1, fy, 1, fh);
      rect(fx, fy + fh - 1, fw, 1);

      fill(200, 160, 70);
      const cs = 2;
      rect(fx, fy, cs, cs);
      rect(fx + fw - cs, fy, cs, cs);
      rect(fx, fy + fh - cs, cs, cs);
      rect(fx + fw - cs, fy + fh - cs, cs, cs);
   }
}