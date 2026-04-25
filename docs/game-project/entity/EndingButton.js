class EndingButton extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.dialogText = this._getEndingText('prompt');
      this._playerNearby = false;
   }

   onPlayerContact(player, gm) {
      player.setPrompt('F');
      const endingOutcome = gm.getEndingOutcome();
      this._showEndingDialog(this._getEndingDialogMode(endingOutcome?.key));

      if (keyIsDown(Keys.F)) {
         gm.addParticles(this.cx(), this.cy());
         gm.finalizeEnding();
      }
   }

   update(level) {
      if (!this._playerNearby && this.dialogOpen) {
         this.dialogOpen = false;
      }

      this._playerNearby = false;
   }

   _showEndingDialog(mode) {
      this.dialogText = this._getEndingText(mode);
      this.dialogOpen = true;
   }

   _getEndingDialogMode(endingKey) {
      if (endingKey === 'true' || endingKey === 'happy' || endingKey === 'better') {
         return 'stay';
      }

      if (endingKey === 'normal' || endingKey === 'sad') {
         return 'leave';
      }

      return 'launch';
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
