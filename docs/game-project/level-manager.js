/**
 * @param {int} levelIndex
 */
class LevelManager {
   constructor(levelIndex) {
      // LDtk data reference (used for cross-level queries)
      this.ldtkData = null;

      // Grid data
      this.grid = [];  // 2D arrays: grid[row][col] = Tile | null
      this.cols = 0;
      this.rows = 0;
      this.gridSize = 0;
      this.offsetX = 0;  // Layer pixel offset X
      this.offsetY = 0;  // Layer pixel offset Y

      // Map dimensions in pixels
      this.mapW = 0;
      this.mapH = 0;
      this.bgColor = "#000000";

      // World coordinates (Absolute position of this level in the LDtk world)
      this.worldX = 0;
      this.worldY = 0;

      // Neighboring relationships (sourced from LDtk __neighbours)
      // Format: [{ levelIid: "xxx", dir: "n"|"s"|"e"|"w" }, ...]
      this.neighbours = [];

      // Render layers (preserves the original drawing order)
      // Each entry: { type: 'tiles' } or { type: 'decor', layer: ldtkLayerData }
      this.renderLayers = [];

      // Entity data (parsed raw data, consumed by GameManager)
      this.areaNumber;
      this.playerStart = null;  // {x, y}
      this.enemySpawns = [];    // [{x, y, hp, damage}]
      this.entitySpawns = [];   // [{x, y, w, h, identifier, color, fields}] All other entities
      this.entities;
      this.levelIndex = levelIndex;
      this.totalPollutionCore = 0;
      this.toalEnemies = 0;
      this.totalBoss = 0;
      this.toxicConverted = false;
      this.mapOpen = false;
   }

   /**
    * Parses the LDtk level data, populating the grid and layers
    * @param {Object} ldtkData - Full LDtk JSON
    * @param {number} levelIndex - Index of the level to load
    */
   load(ldtkData, levelIndex) {
      let level = ldtkData.levels[levelIndex];
      this.ldtkData = ldtkData;
      this.areaNumber = this._getAreaNumber(ldtkData.levels[this.levelIndex]);
      this.mapW = level.pxWid;
      this.mapH = level.pxHei;
      this.bgColor = level.__bgColor;

      // Set world coordinates and neighbors
      this.worldX = level.worldX;
      this.worldY = level.worldY;
      this.neighbours = level.__neighbours || [];

      // Reset existing data
      this.grid = [];
      this.renderLayers = [];
      this.playerStart = null;
      this.enemySpawns = [];
      this.entitySpawns = [];

      // Build IntGrid name lookup table
      let lookup = this._buildIntGridLookup(ldtkData, "Collisions");

      // Iterate through layers from back to front 
      // (LDtk layer order: 0 = top-most, length-1 = bottom-most)
      // We reverse this for rendering: draw the bottom layer first, then top
      let layers = level.layerInstances;
      for (let i = layers.length - 1; i >= 0; i--) {
         let layer = layers[i];

         if (layer.__identifier === "Entities") {
            this._parseEntities(layer);
         }
         else if (layer.__identifier === "Collisions" && layer.__type === "IntGrid") {
            this._parseCollisionLayer(layer, lookup);
            // Mark the position in the render order to draw tiles
            this.renderLayers.push({ type: 'tiles' });
         }
         else {
            // Decoration layers: preserve raw data for direct rendering
            this.renderLayers.push({ type: 'decor', layer: layer });
         }
      }
   }

   /**
    * Returns the recommended canvas dimensions
    */
   getCanvasSize() {
      let scale = GameConfig.Display.GAME_SCALE;
      return {
         w: min(this.mapW * scale, GameConfig.Display.MAX_CANVAS_WIDTH),
         h: min(this.mapH * scale, GameConfig.Display.MAX_CANVAS_HEIGHT),
      };
   }

   getTileAt(col, row) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
      let tile = this.grid[row][col];
      return (tile && tile.active) ? tile : null;
   }

   isSolidAt(col, row) {
      let tile = this.getTileAt(col, row);
      return tile !== null && tile.isSolid;
   }

   /** Query the type of a specific tile */
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

   /** Convenience method: Returns only solid Tiles in the specified area */
   getSolidTilesInRect(x, y, w, h, margin = 1) {
      // Get standard solid tiles from the grid
      let colliders = this.getTilesInRect(x, y, w, h, { margin, solidOnly: true });

      // Append collisions from entities acting as walls
      if (this.entities && this.entities.length > 0) {
         for (let e of this.entities) {
            if (!e || !e.active) continue;
            if (!e.blocksPlayer) continue;
            const hit =
               e.x < x + w && e.x + e.w > x &&
               e.y < y + h && e.y + e.h > y;

            if (hit) colliders.push(e);
         }
      }
      return colliders;
   }

   /**
    * Gets all active Tiles within a rectangular area
    *
    * @param {number} x - World pixel X
    * @param {number} y - World pixel Y
    * @param {number} w - Width
    * @param {number} h - Height
    * @param {Object} [opts]
    * - margin {int}: Extra grid padding (default 1)
    * - type {string|null}: Filter by specific tile type
    * - solidOnly {boolean}: Return only solid tiles (default false)
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
    * Checks if a rectangle overlaps with a Tile of a specified type (or solid)
    * @param {number} x, y, w, h - Rectangle in world coordinates
    * @param {Object} [opts]
    * - solidOnly {boolean}: Only check solid tiles (default true)
    * - type {string|null}: Filter by tile type (e.g., "toxic_poor")
    * - margin {number}: Collision inset/shrink value (default 0.1)
    * @returns {Tile|null}
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
            return t;
         }
      }
      return null;
   }

   /**
    * Checks for solid tiles in a column between startRow and endRow.
    * Used for enemy ledge/cliff detection.
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
    * Detects if a world coordinate point is inside a solid tile.
    * Used for rope node collisions.
    */
   isPointSolid(worldX, worldY) {
      let { col, row } = this.worldToGrid(worldX, worldY);
      return this.isSolidAt(col, row);
   }

   /**
    * Raycasting: Finds the nearest solid collision point along a line segment.
    * Used for grappling rope mechanics.
    */
   rayCast(x1, y1, x2, y2) {
      // Calculate the bounding box of the line segment to fetch relevant solid tiles
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
   //  Level Transition
   // ========================================================

   /**
    * Detects if the player has reached the map edge and if a neighbor exists in that direction.
    *
    * === How it works ===
    * LDtk level data includes:
    * worldX, worldY  — Absolute pixel position in the world.
    * pxWid, pxHei    — Pixel dimensions.
    * __neighbours    — [{ levelIid, dir:"n"|"s"|"e"|"w" }]
    *
    * Coordinate mapping:
    * Player World X = currentLevel.worldX + player.x
    * Target Level Local X = Player World X - targetLevel.worldX
    *
    * Multiple neighbors can exist in one direction (e.g., two small levels on the East):
    * We check the player's world coordinates to find the correct overlapping neighbor.
    *
    * @param {Player} player
    * @returns {{ levelIndex: number, newX: number, newY: number } | null}
    */
   checkEdgeTransition(player) {
      // 1. Determine which edge the player crossed
      let dir = null;
      if (player.x + player.w > this.mapW) dir = 'e';
      else if (player.x < 0) dir = 'w';
      else if (player.y + player.h > this.mapH) dir = 's';
      else if (player.y < 0) dir = 'n';

      if (!dir) return null;

      // 2. Filter candidate neighbors for that direction
      let candidates = this.neighbours.filter(n => n.dir === dir);
      if (candidates.length === 0) return null;

      // 3. Get player's absolute world coordinates
      let worldPX = this.worldX + player.x;
      let worldPY = this.worldY + player.y;

      // 4. Iterate through candidates to find the one overlapping with player position
      for (let candidate of candidates) {
         let idx = this._findLevelIndexByIid(candidate.levelIid);
         if (idx === -1) continue;

         let target = this.ldtkData.levels[idx];

         // Verify if the player is within the bounds of this neighbor
         let overlaps = false;
         if (dir === 'e' || dir === 'w') {
            // Horizontal transition → Check Y overlap
            overlaps = (worldPY + player.h > target.worldY) &&
               (worldPY < target.worldY + target.pxHei);
         } else {
            // Vertical transition → Check X overlap
            overlaps = (worldPX + player.w > target.worldX) &&
               (worldPX < target.worldX + target.pxWid);
         }

         if (!overlaps) continue;

         // 5. Calculate local coordinates in the target level
         let newX = worldPX - target.worldX;
         let newY = worldPY - target.worldY;

         // 6. Fine-tune position in transition direction to prevent immediate re-triggering
         let margin = 2;
         if (dir === 'e') newX = margin;
         if (dir === 'w') newX = target.pxWid - player.w - margin;
         if (dir === 's') newY = margin;
         if (dir === 'n') newY = target.pxHei - player.h - margin;

         // 7. Clamp the non-transition axis to keep player within map bounds
         newX = Math.max(0, Math.min(newX, target.pxWid - player.w));
         newY = Math.max(0, Math.min(newY, target.pxHei - player.h));

         return { levelIndex: idx, newX, newY };
      }

      return null; // No matching neighbor found
   }

   /** Finds level index in levels[] via LDtk iid (with caching) */
   _findLevelIndexByIid(iid) {
      if (!this.ldtkData) return -1;

      // Lazy initialization for the iid -> index lookup table
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
   //  Rendering
   // ========================================================

   /**
    * Renders the entire level using the correct layer order
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
   //  Internal Parsing
   // ========================================================

   /** Loads various tile types from the Collision (IntGrid) layer */
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

      // 1. Initialize 2D grid
      this.grid = [];
      for (let r = 0; r < rows; r++) {
         this.grid[r] = new Array(cols).fill(null);
      }

      // 2. Create Tiles from IntGrid (Collision data)
      let SOLID = GameConfig.World.SOLID_TYPES;
      for (let i = 0; i < csv.length; i++) {
         let tileId = csv[i];
         if (tileId === 0) continue;

         let col = i % cols;
         let row = Math.floor(i / cols);
         let typeName = lookup[tileId] || "Unknown";
         let solid = SOLID.includes(typeName);

         let tile = new Tile(col, row, g, typeName, solid);
         // Apply layer offsets to pixel coordinates
         tile.x += this.offsetX;
         tile.y += this.offsetY;

         this.grid[row][col] = tile;
      }

      // 3. Attach visual data from autoLayerTiles
      let autoTiles = layer.autoLayerTiles || [];
      for (let at of autoTiles) {
         // Calculate corresponding grid position for this tile
         let col = Math.floor(at.px[0] / g);
         let row = Math.floor(at.px[1] / g);

         let tile = (row >= 0 && row < rows && col >= 0 && col < cols)
            ? this.grid[row][col]
            : null;

         if (!tile) {
            // Position has no IntGrid value (e.g., edge decor on an air tile)
            // Create a purely visual Tile
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
         else if (this._isEnemyEntity(entity.__identifier)) {
            let hpField = entity.fieldInstances.find(f => f.__identifier === "hp");
            let dmgField = entity.fieldInstances.find(f => f.__identifier === "damage");
            if (hpField) spawn.hp = hpField.__value;
            if (dmgField) spawn.damage = dmgField.__value;
            spawn.areaNumber = Number(this.areaNumber);
            spawn.levelIndex = this.levelIndex;
            spawn.worldX = this.worldX + spawn.x;
            spawn.worldY = this.worldY + spawn.y;
            spawn.enemyType = this._resolveEnemyType(entity, spawn);
            this.enemySpawns.push(spawn);
         }
         else {
            this.entitySpawns.push(spawn);
         }
      }
   }


   // Tile conversion is directly modified based on relative positions in the tileset png.
   transformPollutedTiles() {
      if (this.toxicConverted) return;
      this.toxicConverted = true;

      let g = this.gridSize;
      for (let r = 0; r < this.rows; r++) {
         for (let c = 0; c < this.cols; c++) {
            let tile = this.grid[r][c];
            if (tile && tile.active && tile.type === GameConfig.Collision.ToxicPool) {
               tile.type = "water";
               for (let v of tile.visuals) {
                  v.srcX += 8 * g;
               }
            }
            if (tile && tile.active && tile.type === GameConfig.Collision.Ground) {
               for (let v of tile.visuals) {
                  v.srcX += 13 * g;
               }
            }
         }
      }
   }

   getEntityCount(type) {
      let entityCount = 0;
      for (let e of this.entities) {
         if (e.type === type && e.active) {
            entityCount += 1;
         }
      }
      return entityCount;
   }

   _getAreaNumber(level) {
      let field = level.fieldInstances.find(f => f.__identifier === "areaNumber");
      return field ? field.__value : null;
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
         iid: entity.iid,
         x, y,
         w: entity.width,
         h: entity.height,
         identifier: entity.__identifier,
         color: entity.__smartColor || '#FF00FF',
         fields,
      };
   }

   _isEnemyEntity(identifier) {
      const normalized = String(identifier || '').toLowerCase();
      return normalized === String(GameConfig.Entity.Enemy).toLowerCase()
         || normalized === String(GameConfig.Entity.EnemyCat).toLowerCase()
         || normalized === String(GameConfig.Entity.EnemyBat).toLowerCase()
         || normalized === 'enemy-cat'
         || normalized === 'enemy_bat'
         || normalized === 'enemy-bat'
         || normalized === 'enemycat';
   }

   _resolveEnemyType(entity, spawn) {
      const explicitType = entity.fieldInstances.find((field) => field.__identifier === 'enemyType')?.__value;
      if (typeof explicitType === 'string' && explicitType.trim()) {
         return explicitType.trim().toLowerCase();
      }

      const ruleType = this._resolveEnemyTypeFromRules(spawn);
      if (ruleType) return ruleType;

      const normalized = String(entity.__identifier || '').toLowerCase();
      if (normalized.includes('cat')) return 'cat';
      if (normalized.includes('bat')) return 'bat';
      return 'slime';
   }

   _resolveEnemyTypeFromRules(spawn) {
      const rules = resources?.data?.enemyRules;
      if (!rules || !spawn) return null;

      const waterRule = rules.preserveNearbyWater;
      if (waterRule?.enabled && this._isNearWater(spawn, waterRule.paddingTiles ?? 1)) {
         return waterRule.enemyType || 'slime';
      }

      const areaOverrides = Array.isArray(rules.areaOverrides) ? rules.areaOverrides : [];
      for (const rule of areaOverrides) {
         if (Number(rule.areaNumber) !== Number(spawn.areaNumber)) continue;

         const maxYRatio = rule.highPosition?.maxYRatio;
         if (typeof maxYRatio === 'number') {
            const enemyBottom = spawn.y + spawn.h;
            if (enemyBottom <= this.mapH * maxYRatio) {
               return rule.enemyType || rules.defaultEnemyType || 'cat';
            }
            continue;
         }

         return rule.enemyType || rules.defaultEnemyType || 'cat';
      }

      return rules.defaultEnemyType || 'cat';
   }

   _isNearWater(spawn, paddingTiles = 1) {
      const padding = Math.max(0, paddingTiles) * this.gridSize;
      const width = spawn.w + padding * 2;
      const height = spawn.h + padding * 2;
      const x = spawn.x - padding;
      const y = spawn.y - padding;

      return !!this.isRectOverlappingTile(x, y, width, height, {
         solidOnly: false,
         type: GameConfig.Collision.Water,
         margin: 0
      }) || !!this.isRectOverlappingTile(x, y, width, height, {
         solidOnly: false,
         type: GameConfig.Collision.ToxicPool,
         margin: 0
      });
   }

   _buildIntGridLookup(ldtkData, layerName) {
      let lookup = {};
      let layerDef = ldtkData.defs.layers.find(l => l.identifier === layerName);
      if (!layerDef) {
         console.error(`Layer definition not found: "${layerName}"`);
         return lookup;
      }
      for (let v of layerDef.intGridValues) {
         lookup[v.value] = v.identifier;
      }
      return lookup;
   }

   // ========================================================
   //  Internal Rendering
   // ========================================================

   /** Iterates through all active Tiles to draw them */
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

   /** Renders decoration layers (non-collision) using standard method */
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
      let miniMapW = width * 0.15;
      let miniMapH = (this.mapH / this.mapW) * miniMapW;
      let padding = 15;
      let mapX = width - miniMapW - padding;
      let mapY = padding;

      fill(0, 0, 0, 90);
      noStroke();
      rect(mapX, mapY, miniMapW, miniMapH, 5);

      let scaleX = miniMapW / this.cols;
      let scaleY = miniMapH / this.rows;

      for (let y = 0; y < this.rows; y++) {
         for (let x = 0; x < this.cols; x++) {
            let tile = this.grid[y][x];
            if (tile && tile.active) {
               let colorHex;
               switch (tile.type) {
                  case 'ground': colorHex = "#b86f50"; break;
                  case 'water': colorHex = "#2CE8F5"; break;
                  case 'toxic_poor': colorHex = "#640d47"; break;
                  case 'spaceship': colorHex = "#FFFFFF"; break;
                  default: colorHex = "#1d1717";
               }
               fill(colorHex + "30"); // transparency
               rect(mapX + x * scaleX, mapY + y * scaleY, scaleX, scaleY);
            }
         }
      }

      if (this.entities) {
         for (let ent of this.entities) {
            if (ent.isDead) continue;

            let ex = mapX + (ent.x / this.mapW) * miniMapW;
            let ey = mapY + (ent.y / this.mapH) * miniMapH;

            let ew = Math.max(4, (ent.w / this.mapW) * miniMapW);
            let eh = Math.max(4, (ent.h / this.mapH) * miniMapH);
            let alpha = 100;
            if (ent.type === GameConfig.Entity.Enemy) {
               fill(255, 150, 0, alpha);
               rect(ex, ey, ew, eh);
            }
            else if (ent.type === GameConfig.Entity.PollutionCore) {
               push();
               stroke(0);
               strokeWeight(0.5);
               fill(200, 100, 255);
               rect(ex, ey, ew, eh);
               pop();
            }
            else if (ent.type === GameConfig.Entity.CleanEnergy) {
               fill(0, 255, 255, alpha);
               rect(ex, ey, ew, eh);
            }
         }
      }

      fill(255, 50, 50);
      stroke(255);
      strokeWeight(1);
      let px = (player.x / this.mapW) * miniMapW;
      let py = (player.y / this.mapH) * miniMapH;
      ellipse(mapX + px, mapY + py, 8, 8);
      noStroke();
   }

   /**
    * Displays a zoomed-in version of the current and adjacent maps in the center of the screen
    */
   drawLargeMap(player, gm) {
      if (!resources.sounds.map.isPlaying() && !this.mapOpen) {
         this.mapOpen = true
         resources.sounds.map.play();
      }
      // 1. Draw semi-transparent black overlay to cover the background screen
      fill(0, 0, 0, 200);
      noStroke();
      rect(0, 0, width, height);

      // 2. Collect levels to display: Current level + Neighbors
      let levelsToShow = [this.ldtkData.levels[this.levelIndex]];
      for (let n of this.neighbours) {
         let nIdx = this._findLevelIndexByIid(n.levelIid);
         if (nIdx !== -1) {
            levelsToShow.push(this.ldtkData.levels[nIdx]);
         }
      }

      // 3. Calculate the overall bounding box in world coordinates for the total map size
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let lvl of levelsToShow) {
         minX = Math.min(minX, lvl.worldX);
         minY = Math.min(minY, lvl.worldY);
         maxX = Math.max(maxX, lvl.worldX + lvl.pxWid);
         maxY = Math.max(maxY, lvl.worldY + lvl.pxHei);
      }

      let worldW = maxX - minX;
      let worldH = maxY - minY;

      // 4. Calculate map scale (Map occupies max 70% of screen width/height)
      let maxMapW = width * 0.7;
      let maxMapH = height * 0.7;
      let mapScale = Math.min(maxMapW / worldW, maxMapH / worldH);

      let mapDrawW = worldW * mapScale;
      let mapDrawH = worldH * mapScale;

      // Center the entire world map on the screen
      let offsetX = (width - mapDrawW) / 2;
      let offsetY = (height - mapDrawH) / 2;

      // 5. Iterate and draw each level
      for (let lvl of levelsToShow) {
         let lx = offsetX + (lvl.worldX - minX) * mapScale;
         let ly = offsetY + (lvl.worldY - minY) * mapScale;
         let lw = lvl.pxWid * mapScale;
         let lh = lvl.pxHei * mapScale;

         let isCurrent = (lvl.iid === this.ldtkData.levels[this.levelIndex].iid);

         // Draw level background (current level is highlighted, others are dimmed)
         fill(isCurrent ? "rgba(60, 60, 60, 0.8)" : "rgba(30, 30, 30, 0.6)");
         stroke(isCurrent ? "#ffffff" : "#666666");
         strokeWeight(isCurrent ? 2 : 1);
         rect(lx, ly, lw, lh, 5);
         noStroke();

         // Read parsed grid data from levelsInfo to draw the terrain
         let lvlIdx = this._findLevelIndexByIid(lvl.iid);
         let lvlInfo = (lvlIdx !== -1) ? gm.levelsInfo[lvlIdx] : null;
         if (lvlInfo && lvlInfo.grid) {
            let scaleX = lw / lvlInfo.cols;
            let scaleY = lh / lvlInfo.rows;

            for (let r = 0; r < lvlInfo.rows; r++) {
               for (let c = 0; c < lvlInfo.cols; c++) {
                  let tile = lvlInfo.grid[r][c];
                  if (tile && tile.active && tile.type) {
                     let colorHex = "#1d1717";
                     if (tile.type === 'ground') colorHex = "#b86f50";
                     else if (tile.type === 'water') colorHex = "#2CE8F5";
                     else if (tile.type === 'toxic_poor') colorHex = "#640d47";
                     else if (tile.type === 'spaceship') colorHex = "#FFFFFF";

                     fill(colorHex + "a0");
                     rect(lx + c * scaleX, ly + r * scaleY, scaleX, scaleY);
                  }
               }
            }
         }
      }

      // Pollution Core rendering
      for (let lvl of levelsToShow) {
         let level = gm.levelsInfo[this._findLevelIndexByIid(lvl.iid)];
         let entities = level.entities;
         if (entities) {
            for (let ent of entities) {
               if (ent.isDead) continue;
               let ex = level.worldX + ent.x;
               ex = offsetX + (ex - minX) * mapScale;
               let ey = level.worldY + ent.y;
               ey = offsetY + (ey - minY) * mapScale;
               if (ent.type === GameConfig.Entity.PollutionCore) {
                  push();
                  stroke(0);
                  strokeWeight(0.75);
                  fill(200, 100, 255);
                  rect(ex, ey, 12 * mapScale, 12 * mapScale);
                  pop();
               }
            }
         }
      }

      // 6. Draw player's current position (converted to world coordinates)
      let playerWorldX = this.worldX + player.x;
      let playerWorldY = this.worldY + player.y;
      let px = offsetX + (playerWorldX - minX) * mapScale;
      let py = offsetY + (playerWorldY - minY) * mapScale;

      fill(255, 50, 50); // Red represents the player
      stroke(255);
      strokeWeight(1.5);
      ellipse(px, py, 12 * mapScale, 12 * mapScale);
      noStroke();

      // 7. Top Title
      fill(255);
      textAlign(CENTER, TOP);
      textSize(24);
      text("WORLD MAP", width / 2, offsetY - 40);
   }
}
