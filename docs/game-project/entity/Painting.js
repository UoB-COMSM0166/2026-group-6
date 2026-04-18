class Painting extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.dialogKey = random([
         'dialogue.paintings.sky',
         'dialogue.paintings.smog',
         'dialogue.paintings.trees',
         'dialogue.paintings.cleanAir',
         'dialogue.paintings.nature',
         'dialogue.paintings.stillness',
         'dialogue.paintings.painter',
         'dialogue.paintings.leaves',
         'dialogue.paintings.stepInside',
         'dialogue.paintings.light',
         'dialogue.paintings.somewhere',
         'dialogue.paintings.scenery',
      ]);
      this.dialogText = this._getLocalizedDialog();
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
      this.dialogText = this._getLocalizedDialog();
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

   _getLocalizedDialog() {
      if (typeof t !== 'function' || !this.dialogKey) {
         return "The sky was once\nthis clear every day.";
      }

      return [
         t(`${this.dialogKey}.0`),
         t(`${this.dialogKey}.1`)
      ].join('\n');
   }
}
