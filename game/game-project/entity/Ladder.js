class Ladder extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
   }

   onPlayerContact(player, gm) {
      player.grounded = true;
      // 接触梯子时：取消重力，允许上下爬 可以跳跃
      player.vy *= 0.8;  // 阻尼，防止自由落体
      if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
         player.vy = -2;  // W/上
         player.vx *= 0.7;
      }
      if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
         player.vy = 2;   // S/下
         player.vx *= 0.7;
      }

      // 没按上下键时悬停
      if (!keyIsDown(UP_ARROW) && !keyIsDown(87) &&
         !keyIsDown(DOWN_ARROW) && !keyIsDown(83)) {
         player.vy = 0;
      }

   }
}
