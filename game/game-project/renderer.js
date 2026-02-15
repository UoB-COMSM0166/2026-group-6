class Renderer {

   /** 绘制 LDtk 图块图层 */
   static drawLayerTiles(layer, tilesetImage) {
      let gridSize = layer.__gridSize;
      let allTiles = [];
      if (layer.autoLayerTiles) allTiles = allTiles.concat(layer.autoLayerTiles);
      if (layer.gridTiles) allTiles = allTiles.concat(layer.gridTiles);

      for (let tile of allTiles) {
         let destX = tile.px[0] + layer.__pxTotalOffsetX;
         let destY = tile.px[1] + layer.__pxTotalOffsetY;
         let srcX = tile.src[0];
         let srcY = tile.src[1];

         if (tile.f === 0) {
            // 无翻转
            image(tilesetImage, destX, destY, gridSize, gridSize, srcX, srcY, gridSize, gridSize);
         } else {
            // 翻转: f=1 水平, f=2 垂直, f=3 双向
            push();
            translate(destX + gridSize / 2, destY + gridSize / 2);
            scale(
               (tile.f === 1 || tile.f === 3) ? -1 : 1,
               (tile.f === 2 || tile.f === 3) ? -1 : 1
            );
            image(tilesetImage, -gridSize / 2, -gridSize / 2, gridSize, gridSize, srcX, srcY, gridSize, gridSize);
            pop();
         }
      }
   }
}
