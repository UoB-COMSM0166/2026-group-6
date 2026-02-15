class Camera {
   constructor() {
      this.x = 0;
      this.y = 0;
   }

   follow(target, mapW, mapH, viewW, viewH) {
      let tx = constrain(target.x - viewW / 2, 0, mapW - viewW);
      let ty = constrain(target.y - viewH / 2, 0, mapH - viewH);
      this.x = lerp(this.x, tx, 0.1);
      this.y = lerp(this.y, ty, 0.1);
   }

   screenToWorld(screenX, screenY, scale) {
      return {
         x: screenX / scale + this.x,
         y: screenY / scale + this.y,
      };
   }

   reset() { this.x = 0; this.y = 0; }
}
