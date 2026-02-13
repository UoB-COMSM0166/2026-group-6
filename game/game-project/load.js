//  LDtk 解析与加载

function loadLevel(index) {
   let level = ldtkData.levels[index];
   let requiredWidth = level.pxWid * GAME_SCALE;
   let requiredHeight = level.pxHei * GAME_SCALE;
 
   // 取最小值：如果地图很小，就用地图大小；如果地图超大，就限制在最大尺寸
   let finalWidth = min(requiredWidth, MAX_CANVAS_WIDTH);
   let finalHeight = min(requiredHeight, MAX_CANVAS_HEIGHT);

   resizeCanvas(finalWidth, finalHeight);
   platforms = [];
   enemies = [];
   particles = [];
   player = null;

   // 解析墙壁 (Collisions)
   for (let layer of level.layerInstances) {
      if (layer.__identifier === "Collisions" && layer.__type === "IntGrid") {
         parseCollisionLayer(layer);
      }
   }

   // 解析实体 (Entities)
   for (let layer of level.layerInstances) {
      if (layer.__identifier === "Entities") {
         parseEntityLayer(layer);
      }
   }
   if (!player) player = new Player(50, 50);

   camX = 0;
   camY = 0;
   gameStatus = "PLAY";

}

function parseCollisionLayer(layer) {
   let gridSize = layer.__gridSize;
   let cols = layer.__cWid;
   let csv = layer.intGridCsv;
   //有碰撞体积的collision对应的id
   const SOLID_IDS = [1, 4, 5];
   for (let i = 0; i < csv.length; i++) {
      let tileId = csv[i];
      if (SOLID_IDS.includes(tileId)) {
         let px = (i % cols) * gridSize + layer.__pxTotalOffsetX;
         let py = Math.floor(i / cols) * gridSize + layer.__pxTotalOffsetY;
         platforms.push(new Platform(px, py, gridSize, gridSize));
      }
   }
}

function parseEntityLayer(layer) {
   for (let entity of layer.entityInstances) {
      let x = entity.px[0] + layer.__pxTotalOffsetX;
      let y = entity.px[1] + layer.__pxTotalOffsetY;
      if (entity.__identifier === "PlayerStart") player = new Player(x, y);
      else if (entity.__identifier === "Enemy") {
         let hp = 3;
         let field = entity.fieldInstances.find(f => f.__identifier === "hp");
         if (field) hp = field.__value;
         enemies.push(new Enemy(x, y, hp));
      }
   }
}

function drawLayerTiles(layer) {
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
         image(tilesetImage, destX, destY, gridSize, gridSize, srcX, srcY, gridSize, gridSize);
      } else {
         push();
         translate(destX + gridSize / 2, destY + gridSize / 2);
         scale((tile.f === 1 || tile.f === 3) ? -1 : 1, (tile.f === 2 || tile.f === 3) ? -1 : 1);
         image(tilesetImage, -gridSize / 2, -gridSize / 2, gridSize, gridSize, srcX, srcY, gridSize, gridSize);
         pop();
      }
   }
}

function hexToRgb(hex) { return color(hex); }

class Platform {
   constructor(x, y, w, h) {
      this.x = x; this.y = y; this.w = w; this.h = h;
   }
   display() { }
}