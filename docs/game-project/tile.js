class Tile {
   /**
    * @param {number} col
    * @param {number} row
    * @param {number} gridSize
    * @param {string|null} type
    * @param {boolean} isSolid
    * @param {boolean} active
    */
   constructor(col, row, gridSize, type, isSolid) {
      this.col = col;
      this.row = row;
      this.x = col * gridSize;
      this.y = row * gridSize;
      this.w = gridSize;
      this.h = gridSize;
      this.type = type;
      this.isSolid = isSolid;
      this.active = true;

      // data: [{srcX, srcY, flip, gridSize}]
      this.visuals = [];
   }

   addVisual(srcX, srcY, flip, gridSize) {
      this.visuals.push({ srcX, srcY, flip, gridSize });
   }

   destroy() {
      this.active = false;
   }

   // Draw all the textures of this tile
   draw(tilesetImage) {
      if (!this.active || this.visuals.length === 0) return;

      for (let v of this.visuals) {
         if (v.flip === 0) {
            image(tilesetImage, this.x, this.y, v.gridSize, v.gridSize,
               v.srcX, v.srcY, v.gridSize, v.gridSize);
         } else {
            push();
            translate(this.x + v.gridSize / 2, this.y + v.gridSize / 2);
            scale(
               (v.flip === 1 || v.flip === 3) ? -1 : 1,
               (v.flip === 2 || v.flip === 3) ? -1 : 1
            );
            image(tilesetImage, -v.gridSize / 2, -v.gridSize / 2,
               v.gridSize, v.gridSize, v.srcX, v.srcY, v.gridSize, v.gridSize);
            pop();
         }
      }
   }
}
