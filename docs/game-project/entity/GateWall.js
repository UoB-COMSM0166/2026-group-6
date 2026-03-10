/**
 * GateWall 两种触发方式
 * Gatetype = "CleanedTrigger"：区域净化>=80 自动打开
 * Gatetype = "MechanismTrigger"：按钮触发打开
 */
// 净化达到75%开门
const PURIFY_OPEN_THRESHOLD = GameConfig.World.PURIFY_CHANGE_THRESHOLD;

class GateWall extends Entity {
   constructor(x, y, w, h, spawnData = {}) {
      super(x, y, w, h, spawnData);

      this.iid = spawnData.iid || spawnData.fields?.iid || null;
      // lDtk 字段：fields.Gatetype
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
      if (this.gateType === "CleanedTrigger") gm.setMapPrompt("Continue exploring this area, return to explore the previous level.", 5000);
      else gm.setMapPrompt("Find button to open the door.", 5000);
   }

   updateWithGM(gm) {
      if (!this.active) return;

      // 只处理 cleaned 门
      if (this.gateType === "CleanedTrigger") {
         const reqArea = Number(this.fields?.requiredArea ?? 0);

         // reqArea 没填就退回当前区域逻辑（兼容旧门）
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
      // 简单占位：黑色门
      fill(20);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
   }
}