class ToxicBullet extends Entity {
   constructor(x, y, targetX, targetY) {
      super(x - 6, y - 6, 12, 12, { identifier: 'ToxicBullet' });
      this.damage = 1;

      // Set gravity for the bullet
      this.gravity = 0.25;

      // Calculate the distance vector between the target and the launch point
      let dx = targetX - x;
      let dy = targetY - y;

      // Set the intended travel time (in frames) to reach the target
      let time = 45; 

      // Horizontal movement is constant velocity: $$x = v_x t$$
      this.vx = dx / time;
      
      // Vertical movement is constant acceleration: $$y = v_y t + \frac{1}{2} g t^2$$
      this.vy = (dy - 0.5 * this.gravity * time * time) / time;
   }

   update(level, gm) {
      // Apply gravity and update position
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;

      // Check for collision with solid tiles (walls or ground)
      if (level.isRectOverlappingTile(this.x, this.y, this.w, this.h, { solidOnly: true, margin: 0.1 })) {
         this.destroy(); // Call base Entity method to remove from game
         if (gm) gm.addParticles(this.cx(), this.cy(), 5); // Spawn purple particles on impact
      }

      // Destroy if the bullet falls below the map boundary
      if (this.y > level.mapH) {
         this.destroy();
      }
   }

   onPlayerContact(player, gm) {
      if (player.invulnerableTimer <= 0) {
         player.takeDamage(this.damage, gm);
         player.knockTimer = GameConfig.Player.KnockInterval;
         
         // Apply a slight knockback effect
         let dir = (player.x < this.x) ? -1 : 1;
         player.vx = dir * 4;
         player.vy = -2;
      }
      this.destroy(); // Destroy bullet upon hitting the player
   }

   _drawShape() {
      push(); // Use push/pop to prevent style leakage to other entities
      fill(200, 50, 255); // Toxic bright purple
      stroke(255);        // Pure white outline
      strokeWeight(2);    // Thicker stroke for high visibility against dark backgrounds
      ellipse(this.cx(), this.cy(), this.w, this.h);
      pop();
   }
}
