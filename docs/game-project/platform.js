class Platform {
   constructor(x, y, w, h, type) {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.type = type;
   }
   display() {

      rect(this.x, this.y, this.w, this.h);
   }
}