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
      let ldtk = gm.resources.ldtkData;
      for (let i = 0; i < ldtk.levels.length; i++) {
         let lvl = ldtk.levels[i];
         if (lvl.iid !== this.targetRef.levelIid) continue;
         for (let layer of lvl.layerInstances) {
            if (layer.__type !== "Entities") continue;
            for (let entity of layer.entityInstances) {
               if (entity.iid === this.targetRef.entityIid) {
                  let pivot = entity.__pivot || [0, 0];
                  let gateX = entity.px[0] + layer.__pxTotalOffsetX - entity.width * pivot[0];
                  let gateY = entity.px[1] + layer.__pxTotalOffsetY - entity.height * pivot[1];

                  let newX = gateX + entity.width / 2 - player.w / 2;
                  let newY = gateY + entity.height - player.h;

                  newX = Math.max(0, Math.min(newX, lvl.pxWid - player.w));
                  newY = Math.max(0, Math.min(newY, lvl.pxHei - player.h));

                  return { levelIndex: i, newX, newY };
               }
            }
         }
      }
      return null;
   }
}