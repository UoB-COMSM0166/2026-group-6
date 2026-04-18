class EndingButton extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.dialogText = this._getEndingText('prompt');
      this._playerNearby = false;
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
      this.dialogText = this._getEndingText('stay');
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _endding2(gm) {
      this.dialogText = this._getEndingText('leave');
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _endding3(gm) {
      this.dialogText = this._getEndingText('launch');
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _getEndingText(mode) {
      if (typeof t !== 'function') {
         return "Start to leave Earth!";
      }

      switch (mode) {
         case 'stay':
            return [
               t('dialogue.ending.stay.0'),
               t('dialogue.ending.stay.1'),
               t('dialogue.ending.stay.2'),
               t('dialogue.ending.stay.3'),
            ].join('\n');
         case 'leave':
            return [
               t('dialogue.ending.leave.0'),
               t('dialogue.ending.leave.1'),
            ].join('\n');
         case 'prompt':
            return t('dialogue.ending.prompt');
         case 'launch':
         default:
            return t('dialogue.ending.launch');
      }
   }
}
