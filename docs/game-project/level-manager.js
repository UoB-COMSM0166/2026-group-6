/**
 * LevelManager — 场景
 * 
 * 每个关卡都有一个LevelManager
 *
 * 核心职责:
 *   1. 解析 LDtk 地图数据
 *   2. 用 2D 网格 (spatial hash) 存储 Tile 对象
 *   3. 提供 O(1) 空间查询代替 O(n) 遍历
 *   4. 统一渲染 (Tile + 装饰图层)
 *
 * @param {int} levelIndex
 *
 */
class LevelManager {
   constructor(levelIndex) {
      // LDtk 数据引用 (用于跨关卡查询)
      this.ldtkData = null;

      // 网格数据
      this.grid = [];           // 2D 数组: grid[row][col] = Tile | null
      this.cols = 0;
      this.rows = 0;
      this.gridSize = 0;
      this.offsetX = 0;         // 图层像素偏移
      this.offsetY = 0;

      // 地图像素尺寸
      this.mapW = 0;
      this.mapH = 0;
      this.bgColor = "#000000";

      // 世界坐标 (本关卡在 LDtk 世界中的绝对位置)
      this.worldX = 0;
      this.worldY = 0;

      // 邻居关系 (来自 LDtk 的 __neighbours)
      // 格式: [{ levelIid: "xxx", dir: "n"|"s"|"e"|"w" }, ...]
      this.neighbours = [];

      // 渲染图层 (保持原始绘制顺序)
      // 每个条目: { type: 'tiles' } 或 { type: 'decor', layer: ldtkLayerData }
      this.renderLayers = [];

      // 实体数据 (解析后的原始数据, 由 GameManager 消费)
      this.playerStart = null;  // {x, y}
      this.enemySpawns = [];    // [{x, y, hp, damage}]
      this.entitySpawns = [];   // [{x, y, w, h, identifier, color, fields}] 所有其他实体
      this.enemies;
      this.entities;
      this.levelIndex = levelIndex;
   }

   // ========================================================
   //  加载关卡
   // ========================================================

   /**
    * 解析 LDtk 关卡, 填充网格和图层
    * @param {Object} ldtkData  完整 LDtk JSON
    * @param {number} levelIndex  关卡索引
    */
   load(ldtkData, levelIndex) {
      let level = ldtkData.levels[levelIndex];
      this.ldtkData = ldtkData;
      this.mapW = level.pxWid;
      this.mapH = level.pxHei;
      this.bgColor = level.__bgColor;

      // 世界坐标与邻居
      this.worldX = level.worldX;
      this.worldY = level.worldY;
      this.neighbours = level.__neighbours || [];

      // 重置
      this.grid = [];
      this.renderLayers = [];
      this.playerStart = null;
      this.enemySpawns = [];
      this.entitySpawns = [];

      // 构建 IntGrid 名称查找表
      let lookup = this._buildIntGridLookup(ldtkData, "Collisions");

      // 从后往前遍历图层 (LDtk 图层顺序: 0=最上层, length-1=最底层)
      // 我们反转为 渲染顺序: 先画底层, 后画上层
      let layers = level.layerInstances;
      for (let i = layers.length - 1; i >= 0; i--) {
         let layer = layers[i];

         if (layer.__identifier === "Entities") {
            this._parseEntities(layer);
         }
         else if (layer.__identifier === "Collisions" && layer.__type === "IntGrid") {
            this._parseCollisionLayer(layer, lookup);
            // 在渲染顺序中标记 "这里画 Tiles"
            this.renderLayers.push({ type: 'tiles' });
         }
         else {
            // 装饰图层, 保留原始数据直接渲染
            this.renderLayers.push({ type: 'decor', layer: layer });
         }
      }
   }

   /**
    * 获取推荐的画布尺寸
    */
   getCanvasSize() {
      let scale = GameConfig.Display.GAME_SCALE;
      return {
         w: min(this.mapW * scale, GameConfig.Display.MAX_CANVAS_WIDTH),
         h: min(this.mapH * scale, GameConfig.Display.MAX_CANVAS_HEIGHT),
      };
   }

   // ========================================================
   //  空间查询 (核心性能优化)
   // ========================================================

   /** O(1) 查询: 获取指定网格位置的 Tile */
   getTileAt(col, row) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      let tile = this.grid[row][col];
      return (tile && tile.active) ? tile : null;
   }

   /** O(1) 查询: 指定网格位置是否是固体 */
   isSolidAt(col, row) {
      let tile = this.getTileAt(col, row);
      return tile !== null && tile.isSolid;
   }

   // 查询tile的类型
   getTiletype(col, row) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      let tile = this.grid[row][col];
      return (tile && tile.active) ? tile.type : null;
   }

   /** World coordinates → grid coordinates */
   worldToGrid(px, py) {
      return {
         col: Math.floor((px - this.offsetX) / this.gridSize),
         row: Math.floor((py - this.offsetY) / this.gridSize),
      };
   }

   /** 便捷方法：只返回固体 Tile */
   getSolidTilesInRect(x, y, w, h, margin = 1) {
      return this.getTilesInRect(x, y, w, h, { margin, solidOnly: true });
   }

   /**
    * 获取矩形区域内的所有 active Tile
    *
    * @param {number} x  世界像素 x
    * @param {number} y  世界像素 y
    * @param {number} w  宽度
    * @param {number} h  高度
    * @param {Object} [opts]
    *   - margin {int}    额外扩展的格子数 (默认 1)
    *   - type {string|null}   限定 tile 类型
    *   - solidOnly {boolean} 是否只返回固体 (默认 false)
    * @returns {Tile[]}
    */
   getTilesInRect(x, y, w, h, opts = {}) {
      let margin = opts.margin ?? 1;
      let solidOnly = opts.solidOnly ?? false;
      let type = opts.type || null;

      let g = this.gridSize;
      let startCol = Math.floor((x - this.offsetX) / g) - margin;
      let endCol = Math.floor((x + w - this.offsetX) / g) + margin;
      let startRow = Math.floor((y - this.offsetY) / g) - margin;
      let endRow = Math.floor((y + h - this.offsetY) / g) + margin;

      startCol = Math.max(0, startCol);
      startRow = Math.max(0, startRow);
      endCol = Math.min(this.cols - 1, endCol);
      endRow = Math.min(this.rows - 1, endRow);

      let result = [];
      for (let r = startRow; r <= endRow; r++) {
         for (let c = startCol; c <= endCol; c++) {
            let tile = this.grid[r][c];
            if (tile && tile.active) {
               if (type === null) {
                  if (!solidOnly || tile.isSolid) {
                     result.push(tile);
                  }
               }
               else if (tile.type === type) {
                  result.push(tile);
               }
            }
         }
      }
      return result;
   }

   /**
 * 检测一个矩形是否与指定类型（或固体）的 Tile 重叠
 * @param {number} x, y, w, h  世界坐标矩形
 * @param {Object} [opts]
 *   - solidOnly {boolean}  只查固体 (默认 true)
 *   - type {string|null}   限定 tile 类型 (如 "toxic_poor")
 *   - margin {number}      碰撞检测内缩量 (默认 0.1)
 * @returns {boolean}
 */
   isRectOverlappingTile(x, y, w, h, opts = {}) {
      let solidOnly = opts.solidOnly !== false;
      let type = opts.type || null;
      let m = opts.margin ?? 0.1;

      let bx = x + m, by = y + m, bw = w - m * 2, bh = h - m * 2;
      let tiles = solidOnly
         ? this.getSolidTilesInRect(bx, by, bw, bh, 0)
         : this.getTilesInRect(bx, by, bw, bh, 0);

      for (let t of tiles) {
         if (type && t.type !== type) continue;
         if (Physics.rectIntersect(bx, by, bw, bh, t.x, t.y, t.w, t.h)) {
            return true;
         }
      }
      return false;
   }

   /**
    * 获取某一列、从 startRow 到 endRow 之间的固体 Tile
    * 用于敌人悬崖检测
    */
   hasSolidInColumn(col, startRow, endRow) {
      startRow = Math.max(0, startRow);
      endRow = Math.min(this.rows - 1, endRow);
      for (let r = startRow; r <= endRow; r++) {
         let tile = this.grid[r]?.[col];
         if (tile && tile.active && tile.isSolid) return true;
      }
      return false;
   }

   /**
    * 检测一个世界坐标点是否在固体内
    * 用于绳索节点碰撞
    */
   isPointSolid(worldX, worldY) {
      let { col, row } = this.worldToGrid(worldX, worldY);
      return this.isSolidAt(col, row);
   }

   /**
    * 射线检测: 在线段路径上查找最近的固体碰撞点
    * 用于绳索发射
    */
   rayCast(x1, y1, x2, y2) {
      // 计算射线经过区域的包围盒, 获取该区域内所有固体
      let minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      let minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
      let tiles = this.getSolidTilesInRect(minX, minY, maxX - minX, maxY - minY, 1);

      let closestHit = null;
      let minDst = Infinity;
      for (let t of tiles) {
         let hit = Physics.lineRectIntersect(x1, y1, x2, y2, t.x, t.y, t.w, t.h);
         if (hit) {
            let d = dist(x1, y1, hit.x, hit.y);
            if (d < minDst) { minDst = d; closestHit = hit; }
         }
      }
      return closestHit;
   }

   // ========================================================
   //  关卡过渡 (Level Transition)
   // ========================================================

   /**
    * 检测玩家是否走到了地图边缘, 且该方向有邻居关卡
    *
    * === 工作原理 ===
    *
    * LDtk 每个 level 有:
    *   worldX, worldY  — 在世界中的绝对像素位置
    *   pxWid, pxHei    — 像素尺寸
    *   __neighbours     — [{ levelIid, dir:"n"|"s"|"e"|"w" }]
    *
    * 坐标转换公式:
    *   玩家世界坐标 = 当前关卡.worldX + player.x
    *   新关卡本地坐标 = 玩家世界坐标 - 目标关卡.worldX
    *
    * 同一方向可能有多个邻居 (例如东边并排两个小关卡):
    *   需要根据玩家的世界坐标判断到底进哪个
    *
    * @param {Player} player
    * @returns {{ levelIndex: number, newX: number, newY: number } | null}
    */
   checkEdgeTransition(player) {
      // 1. 判断玩家越过了哪个边
      let dir = null;
      if (player.x + player.w > this.mapW) dir = 'e';
      else if (player.x < 0) dir = 'w';
      else if (player.y + player.h > this.mapH) dir = 's';
      else if (player.y < 0) dir = 'n';

      if (!dir) return null;

      // 2. 筛选该方向的所有邻居候选
      let candidates = this.neighbours.filter(n => n.dir === dir);
      if (candidates.length === 0) return null;

      // 3. 玩家的世界绝对坐标
      let worldPX = this.worldX + player.x;
      let worldPY = this.worldY + player.y;

      // 4. 遍历候选邻居, 找到与玩家位置真正重叠的那个
      for (let candidate of candidates) {
         let idx = this._findLevelIndexByIid(candidate.levelIid);
         if (idx === -1) continue;

         let target = this.ldtkData.levels[idx];

         // 判断玩家是否在这个邻居的范围内
         let overlaps = false;
         if (dir === 'e' || dir === 'w') {
            // 左右过渡 → 检查 Y 轴是否重叠
            overlaps = (worldPY + player.h > target.worldY) &&
               (worldPY < target.worldY + target.pxHei);
         } else {
            // 上下过渡 → 检查 X 轴是否重叠
            overlaps = (worldPX + player.w > target.worldX) &&
               (worldPX < target.worldX + target.pxWid);
         }

         if (!overlaps) continue;

         // 5. 计算在目标关卡中的本地坐标
         let newX = worldPX - target.worldX;
         let newY = worldPY - target.worldY;

         // 6. 在过渡方向上微调位置, 防止立刻触发反向过渡
         let margin = 2;
         if (dir === 'e') newX = margin;
         if (dir === 'w') newX = target.pxWid - player.w - margin;
         if (dir === 's') newY = margin;
         if (dir === 'n') newY = target.pxHei - player.h - margin;

         // 7. 钳制非过渡轴, 确保不超出目标地图范围
         newX = Math.max(0, Math.min(newX, target.pxWid - player.w));
         newY = Math.max(0, Math.min(newY, target.pxHei - player.h));

         return { levelIndex: idx, newX, newY };
      }

      return null; // 没有匹配的邻居
   }

   /** 通过 LDtk iid 查找关卡在 levels[] 中的索引 (带缓存) */
   _findLevelIndexByIid(iid) {
      if (!this.ldtkData) return -1;

      // 懒初始化 iid→index 查找表 (只建一次)
      if (!this._iidCache) {
         this._iidCache = {};
         for (let i = 0; i < this.ldtkData.levels.length; i++) {
            this._iidCache[this.ldtkData.levels[i].iid] = i;
         }
      }

      let idx = this._iidCache[iid];
      return (idx !== undefined) ? idx : -1;
   }

   resetPlayerStart(x, y) {
      this.playerStart = { x: x, y: y };
   }

   // ========================================================
   //  渲染
   // ========================================================

   /**
    * 按正确的图层顺序渲染整个关卡
    * @param {p5.Image} tilesetImage
    */
   draw(tilesetImage) {
      for (let entry of this.renderLayers) {
         if (entry.type === 'tiles') {
            this._drawAllTiles(tilesetImage);
         } else {
            this._drawDecorLayer(entry.layer, tilesetImage);
         }
      }
   }

   // ========================================================
   //  内部: 解析
   // ========================================================


   // 加载地图中Collision（intgrid）中各个类型的tile
   _parseCollisionLayer(layer, lookup) {
      let g = layer.__gridSize;
      let cols = layer.__cWid;
      let rows = layer.__cHei;
      let csv = layer.intGridCsv;

      this.gridSize = g;
      this.cols = cols;
      this.rows = rows;
      this.offsetX = layer.__pxTotalOffsetX;
      this.offsetY = layer.__pxTotalOffsetY;

      // 1. 初始化 2D 网格
      this.grid = [];
      for (let r = 0; r < rows; r++) {
         this.grid[r] = new Array(cols).fill(null);
      }

      // 2. 从 IntGrid 创建 Tile (碰撞数据)
      let SOLID = GameConfig.World.SOLID_TYPES;
      for (let i = 0; i < csv.length; i++) {
         let tileId = csv[i];
         if (tileId === 0) continue;

         let col = i % cols;
         let row = Math.floor(i / cols);
         let typeName = lookup[tileId] || "Unknown";
         let solid = SOLID.includes(typeName);

         let tile = new Tile(col, row, g, typeName, solid);
         // 应用图层偏移到像素坐标
         tile.x += this.offsetX;
         tile.y += this.offsetY;

         this.grid[row][col] = tile;
      }

      // 3. 从 autoLayerTiles 附加视觉数据
      let autoTiles = layer.autoLayerTiles || [];
      for (let at of autoTiles) {
         // 计算此贴图对应的网格位置
         let col = Math.floor(at.px[0] / g);
         let row = Math.floor(at.px[1] / g);

         let tile = (row >= 0 && row < rows && col >= 0 && col < cols)
            ? this.grid[row][col]
            : null;

         if (!tile) {
            // 该位置没有 IntGrid 值 (空气格子上的边缘装饰)
            // 创建一个纯视觉 Tile
            tile = new Tile(col, row, g, null, false);
            tile.x += this.offsetX;
            tile.y += this.offsetY;
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
               this.grid[row][col] = tile;
            }
         }

         tile.addVisual(at.src[0], at.src[1], at.f, g);
      }
   }

   _parseEntities(layer) {
      for (let entity of layer.entityInstances) {
         let spawn = this._addEntitySpawn(entity, layer);
         if (entity.__identifier === GameConfig.Entity.PlayerStart) {
            this.playerStart = { x: spawn.x, y: spawn.y };
         }
         else if (entity.__identifier === "Enemy") {
            let hpField = entity.fieldInstances.find(f => f.__identifier === "hp");
            let dmgField = entity.fieldInstances.find(f => f.__identifier === "damage");
            if (hpField) spawn.hp = hpField.__value;
            if (dmgField) spawn.damage = dmgField.__value;
            this.enemySpawns.push(spawn);
         }
         else {
            this.entitySpawns.push(spawn);
         }
      }
   }

   _addEntitySpawn(entity, layer) {
      let pivot = entity.__pivot || [0, 0];
      let x = entity.px[0] + layer.__pxTotalOffsetX - entity.width * pivot[0];
      let y = entity.px[1] + layer.__pxTotalOffsetY - entity.height * pivot[1];
      let fields = {};
      for (let f of entity.fieldInstances) {
         fields[f.__identifier] = f.__value;
      }
      return {
         x, y,
         w: entity.width,
         h: entity.height,
         identifier: entity.__identifier,
         color: entity.__smartColor || '#FF00FF',
         fields,
      };
   }

   _buildIntGridLookup(ldtkData, layerName) {
      let lookup = {};
      let layerDef = ldtkData.defs.layers.find(l => l.identifier === layerName);
      if (!layerDef) {
         console.error(`找不到图层定义: "${layerName}"`);
         return lookup;
      }
      for (let v of layerDef.intGridValues) {
         lookup[v.value] = v.identifier;
      }
      return lookup;
   }

   // ========================================================
   //  内部: 渲染
   // ========================================================

   /** 遍历所有 active Tile 绘制 */
   _drawAllTiles(tilesetImage) {
      for (let r = 0; r < this.rows; r++) {
         for (let c = 0; c < this.cols; c++) {
            let tile = this.grid[r][c];
            if (tile && tile.active) {
               tile.draw(tilesetImage);
            }
         }
      }
   }

   /** 传统方式绘制装饰图层 (非碰撞层) */
   _drawDecorLayer(layer, tilesetImage) {
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
            image(tilesetImage, destX, destY, gridSize, gridSize,
               srcX, srcY, gridSize, gridSize);
         } else {
            push();
            translate(destX + gridSize / 2, destY + gridSize / 2);
            scale(
               (tile.f === 1 || tile.f === 3) ? -1 : 1,
               (tile.f === 2 || tile.f === 3) ? -1 : 1
            );
            image(tilesetImage, -gridSize / 2, -gridSize / 2,
               gridSize, gridSize, srcX, srcY, gridSize, gridSize);
            pop();
         }
      }
   }

   drawMiniMap(player) {
      let miniMapW = width * 0.2; // 相对屏幕宽度的缩小比例
      let miniMapH = (this.mapH / this.mapW) * miniMapW; // 保持关卡的原始比例
      let padding = 15;
      let mapX = width - miniMapW - padding;
      let mapY = padding;

      // 画半透明底板
      fill(0, 0, 0, 150);
      noStroke();
      rect(mapX, mapY, miniMapW, miniMapH, 5);

      // 计算小地图里的 1 个方块等于多少像素
      let scaleX = miniMapW / this.cols;
      let scaleY = miniMapH / this.rows;

      // 画小地图
      for (let y = 0; y < this.rows; y++) {
         for (let x = 0; x < this.cols; x++) {
            let tile = this.grid[y][x];
            if (tile && tile.active) {
               let color;
               switch (tile.type) {
                  case 'ground': color = "#b86f50"; break;
                  case 'water': color = "#2CE8F5"; break;
                  case 'toxic_poor': color = "#640d47"; break;
                  case 'spaceship': color = "#FFFFFF"; break;
                  default: color = "#1d1717";
               }
               color = color + "a0"; // 透明度
               fill(color);
            }
            else {
               continue
            };

            rect(mapX + x * scaleX, mapY + y * scaleY, scaleX, scaleY);
         }
      }

      // 画玩家
      fill(255, 50, 50);
      let px = (player.x / this.mapW) * miniMapW;
      let py = (player.y / this.mapH) * miniMapH;
      ellipse(mapX + px, mapY + py, 8, 8);
   }
}
