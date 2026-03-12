/**
 * Two trigger methods for GateWall
 * Gatetype = "CleanedTrigger": opens automatically when area purification >= 80
 * Gatetype = "MechanismTrigger": opens when triggered by a button
 */
// The gate opens when purification reaches 75%
const PURIFY_OPEN_THRESHOLD = GameConfig.World.PURIFY_CHANGE_THRESHOLD;

class GateWall extends Entity {
   constructor(x, y, w, h, spawnData = {}) {
      super(x, y, w, h, spawnData);

      this.iid = spawnData.iid || spawnData.fields?.iid || null;
      // lDtk ：fields.Gatetype
      this.gateType = spawnData.fields?.Gatetype || null;
      this.blocksPlayer = true;
      this.isOpen = false;
      this.sprite = (this.gateType === "CleanedTrigger") ? resources.images.door1 : resources.images.door2;
   }

   open() {
      if (this.isOpen) return;
      if (!resources.sounds.door.isPlaying()) resources.sounds.door.play();
      this.isOpen = true;
      this.destroy();
   }

   onPlayerContact(player, gm) {
      // setprompt after last prompt disappear
      if (millis() - gm.mapPromptStartTime < gm.mapPromptDuration) return;
      if (this.gateType === "CleanedTrigger") gm.setMapPrompt("Explore other sub-areas to increase purification.\nReach " 
         + GameConfig.World.PURIFY_CHANGE_THRESHOLD + "% purification to unlock the next area.", 5000);
      else gm.setMapPrompt("Find button to open the door.", 5000);
   }

   updateWithGM(gm) {
      if (!this.active) return;
      // Only handle gates
      if (this.gateType === "CleanedTrigger") {
         const reqArea = Number(this.fields?.requiredArea ?? 0);

         let progress;
         if (reqArea > 0) {
            progress = gm.getAreaProgress(reqArea);
         } else {
            progress = gm.getAreaProgress();
         }
         if (progress >= PURIFY_OPEN_THRESHOLD) {
            this.open();
         }
      }
   }

   _drawShape() {

      fill(20);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
   }
}