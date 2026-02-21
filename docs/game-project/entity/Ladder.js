class Ladder extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.sprite = resources.images.ladder;
   }

   onPlayerContact(player, gm) {
      player.grounded = true;
      // 接触梯子时：取消重力，允许上下爬 可以跳跃
      if (keyIsDown(UP_ARROW) || keyIsDown(Keys.W)) {
         player.vy = -2;  // W/上
         player.vx *= 0.7;
      }
      if (keyIsDown(DOWN_ARROW) || keyIsDown(Keys.S)) {
         player.vy = 2;   // S/下
         player.vx *= 0.7;
      }

      // 没按上下键时悬停
      if (!keyIsDown(UP_ARROW) && !keyIsDown(Keys.W) &&
         !keyIsDown(DOWN_ARROW) && !keyIsDown(Keys.S)) {
         player.vy = 0;
         player.vy -= GameConfig.World.GRAVITY; //抵消重力
      }

   }
}
