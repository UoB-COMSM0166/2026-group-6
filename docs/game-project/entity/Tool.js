class Tool extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.sprite = resources.images.tools;
      this.toolType = this.fields.toolType;
      this.sprite = resources.images.tools;
   }

   onPlayerContact(player, gm) {
      if (!resources.sounds.tool.isPlaying()) resources.sounds.tool.play();
      switch (this.toolType) {
         case "Clean":
            this._getClean(player);
            break;
         case "Jump":
            this._getJumpEnhance(player);
            break;
         case "RopeLength":
            this._getRopeStretch(player);
            break;
         case "Hp":
            this._getHp(player);
            break;
         default: {
            this.destroy();
            break;
         }
      }
   }

   _getClean(player) {
      gm.addParticles(this.cx(), this.cy());
      let energy = 25;
      player.supplyCleanEnergy(energy);
      this.destroy();
   }

   _getRopeStretch(player) {
      gm.addParticles(this.cx(), this.cy());
      const G = GameConfig.World.GRID_SIZE;
      [player.ropeL, player.ropeR].forEach(rope => {
         rope.maxLen += G;
      });
      this.destroy();
   }

   _getHp(player) {
      gm.addParticles(this.cx(), this.cy());
      let restoreHp = 20;
      player.hp += restoreHp;
      this.destroy();
   }

   _getJumpEnhance(player) {
      gm.addParticles(this.cx(), this.cy());
      let enhance = 0.3;
      player.jumpForce += enhance;
      this.destroy();
   }
}
