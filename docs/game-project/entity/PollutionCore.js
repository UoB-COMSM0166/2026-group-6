class PollutionCore extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.polluteDegree = 50; // clear need energy
   }

   onPlayerContact(player, gm) {
      if (this.polluteDegree > 0) {
         player.setPrompt('F');
         if (keyIsDown(Keys.F)) {
            let consume = 2;
            // 先检查玩家是否有足够的能量可以消耗
            if (player.checkRemainCleanEnergy(consume)) {
               player.reduceCleanEnergy(consume);
               this.polluteDegree -= consume;
            }
         }
      }
      else {
         this.destroy(); // 净化完成，销毁实体
      }
   }

   onRopeContact(rope, player, gm) {
      if (this.isDead) return;
      if (rope.state !== "SWINGING") rope.state = "SWINGING";

      if (this.polluteDegree > 0) {
         player.setPrompt('F');
         if (keyIsDown(Keys.F)) {
            let consume = 2;
            // 增加能量检查，能量足够时才触发粒子、扣除能量和净化
            if (player.checkRemainCleanEnergy(consume)) {
               gm.addParticles(this.cx(), this.cy());
               player.reduceCleanEnergy(consume);
               this.polluteDegree -= consume;
            }
         }
      }
      else {
         if (rope.state !== "RETRACTING") rope.state = "RETRACTING";
         this.destroy();
      }
   }
}
