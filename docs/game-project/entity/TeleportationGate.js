class TeleportationGate extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.targetRef = this.fields.target;
      this.cooldown = 0;
   }

   update(level) {
      if (this.cooldown > 0) this.cooldown--;
   }

   onPlayerContact(player, gm) {
      if (this.cooldown > 0 || !this.targetRef) return;

      player.setPrompt('F');
      if (keyIsDown(Keys.F)) {
         let result = this._resolveTarget(player, gm);
         if (!result) return;
         gm.pendingTeleport = result;
         this.cooldown = 30;
      }
   }

   _resolveTarget(player, gm) {
      if (!this.targetRef || !this.targetRef.entityIid) return null;

      let result = gm.findEntityAndLevelByIid(this.targetRef.entityIid);
      if (!result) return null;

      let target = result.entity;
      let lvl = gm.resources.ldtkData.levels[result.levelIndex];

      let newX = target.x + target.w / 2 - player.w / 2;
      let newY = target.y + target.h - player.h;

      newX = Math.max(0, Math.min(newX, lvl.pxWid - player.w));
      newY = Math.max(0, Math.min(newY, lvl.pxHei - player.h));

      return { levelIndex: result.levelIndex, newX, newY };
   }
}