class ToxicBullet extends Entity {
   constructor(x, y, targetX, targetY) {
      super(x - 6, y - 6, 12, 12, { identifier: 'ToxicBullet' });
      this.damage = 1;

      // 设定子弹的重力
      this.gravity = 0.25;

      // 计算目标点与发射点的距离差
      let dx = targetX - x;
      let dy = targetY - y;

      // 设定子弹飞行到目标所需的时间 (例如 45 帧到达)
      // 你可以调小这个值让子弹飞得更快，调大让子弹飞得更慢
      let time = 45; 

      // 【核心物理公式】：计算精准命中目标的初速度
      // 水平方向是匀速运动: x = v_x * t
      this.vx = dx / time;
      
      // 垂直方向是匀加速运动: y = v_y * t + 0.5 * g * t^2
      // 反推 v_y = (y - 0.5 * g * t^2) / t
      this.vy = (dy - 0.5 * this.gravity * time * time) / time;
   }

   // 接收 level 和 gm
   update(level, gm) {
      // 施加重力与位移
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;

      // 检测是否撞到固体墙壁或地面
      if (level.isRectOverlappingTile(this.x, this.y, this.w, this.h, { solidOnly: true, margin: 0.1 })) {
         this.destroy(); // 调用 Entity 基类的方法销毁自己
         if (gm) gm.addParticles(this.cx(), this.cy(), 5); // 撞墙爆点紫色粒子
      }

      // 飞出地图底部则销毁
      if (this.y > level.mapH) {
         this.destroy();
      }
   }

   onPlayerContact(player, gm) {
      if (player.invulnerableTimer <= 0) {
         player.takeDamage(this.damage, gm);
         player.knockTimer = GameConfig.Player.KnockInterval;
         // 添加轻微的击退效果
         let dir = (player.x < this.x) ? -1 : 1;
         player.vx = dir * 4;
         player.vy = -2;
      }
      this.destroy(); // 击中玩家后销毁
   }

   // 覆写 Entity 基类的 _drawShape 方法
   _drawShape() {
      push(); // 使用 push/pop 防止样式污染其他实体
      fill(200, 50, 255); // 毒液的亮紫色
      stroke(255);        // 【新增】：纯白色的描边
      strokeWeight(2);    // 【新增】：加粗描边让它在深色背景下非常显眼
      ellipse(this.cx(), this.cy(), this.w, this.h);
      pop();
   }
}