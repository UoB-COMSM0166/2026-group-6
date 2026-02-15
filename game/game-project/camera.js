class Camera {
   constructor() {
      this.x = 0;
      this.y = 0;
   }

   /** 平滑跟随目标，限制在地图范围内 */
   follow(target, mapW, mapH, viewW, viewH) {
      let targetX = target.x - viewW / 2;
      let targetY = target.y - viewH / 2;

      targetX = constrain(targetX, 0, mapW - viewW);
      targetY = constrain(targetY, 0, mapH - viewH);

      this.x = lerp(this.x, targetX, 0.1);
      this.y = lerp(this.y, targetY, 0.1);
   }

   /** 将屏幕坐标转换为世界坐标 */
   screenToWorld(screenX, screenY, scale) {
      return {
         x: screenX / scale + this.x,
         y: screenY / scale + this.y,
      };
   }

   reset() {
      this.x = 0;
      this.y = 0;
   }
}
