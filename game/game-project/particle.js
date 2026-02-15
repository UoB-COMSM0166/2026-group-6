class Particle {
   constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = random(-2, 2);
      this.vy = random(-2, 2);
      this.life = 255;
   }

   update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 15;
   }

   get isDead() { return this.life <= 0; }

   display() {
      fill(0, 255, 255, this.life);
      noStroke();
      ellipse(this.x, this.y, 2, 2);
   }

   static spawn(x, y, count = 5) {
      let out = [];
      for (let i = 0; i < count; i++) out.push(new Particle(x, y));
      return out;
   }
}
