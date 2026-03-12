class Tool extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.toolType = this.fields.toolType;
      switch (this.toolType) {
         case "Clean":
            this.sprite = resources.images.tools.energy;
            break;
         case "Hp":
            this.sprite = resources.images.tools.hp;
            break;
         case "RopeLength":
            this.sprite = resources.images.tools.rope;
            break;
         case "Jump":
            this.sprite = resources.images.tools.jump;
            break;
         case "Attack":
            this.sprite = resources.images.tools.attack;
            break;
         default: {
            this.sprite = resources.images.tools.other;
            break;
         }
      }
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
         case "Attack":
            this._getDamageEnhance(player);
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
      player.addFloatingText("rope length +" + G, color(0, 255, 255), 8, 110);
      this.destroy();
   }

   _getHp(player) {
      gm.addParticles(this.cx(), this.cy());
      let restoreHp = 20;
      player.maxHp += restoreHp;
      player.restoreHp(restoreHp);
      this.destroy();
   }

   _getJumpEnhance(player) {
      gm.addParticles(this.cx(), this.cy());
      player.addJumpForce(0.3);
      this.destroy();
   }

   _getDamageEnhance(player) {
      gm.addParticles(this.cx(), this.cy());
      player.addAttackDamage(0.5);
      this.destroy();
   }
}
