class Physics {

   static pointRect(px, py, rx, ry, rw, rh) {
      return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
   }

   static rectIntersect(x, y, w, h, px, py, pw, ph) {
      return px < x + w && px + pw > x && py < y + h && py + ph > y;
   }

   static lineRectIntersect(x1, y1, x2, y2, rx, ry, rw, rh) {
      let left = this.lineLineIntersect(x1, y1, x2, y2, rx, ry, rx, ry + rh);
      let right = this.lineLineIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
      let top = this.lineLineIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry);
      let bottom = this.lineLineIntersect(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);
      let closest = null;
      let minDst = Infinity;
      for (let pt of [left, right, top, bottom]) {
         if (pt) {
            let d = dist(x1, y1, pt.x, pt.y);
            if (d < minDst) { minDst = d; closest = pt; }
         }
      }
      return closest;
   }

   static lineLineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
      let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
      if (denom === 0) return null;
      let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
      let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
      if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
         return { x: x1 + uA * (x2 - x1), y: y1 + uA * (y2 - y1) };
      }
      return null;
   }
}
