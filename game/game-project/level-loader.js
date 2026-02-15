class LevelLoader {

   /**
    * 解析 LDtk 关卡数据，返回所有游戏对象
    * @returns {{ player, platforms, solidPlatforms, enemies, canvasWidth, canvasHeight }}
    */
   static load(ldtkData, levelIndex) {
      let level = ldtkData.levels[levelIndex];
      let scale = GameConfig.Display.GAME_SCALE;

      let canvasWidth = min(level.pxWid * scale, GameConfig.Display.MAX_CANVAS_WIDTH);
      let canvasHeight = min(level.pxHei * scale, GameConfig.Display.MAX_CANVAS_HEIGHT);

      let platforms = [];
      let solidPlatforms = [];
      let enemies = [];
      let player = null;

      // 解析碰撞层
      for (let layer of level.layerInstances) {
         if (layer.__identifier === "Collisions" && layer.__type === "IntGrid") {
            let result = this.parseCollisionLayer(layer, ldtkData);
            platforms = result.platforms;
            solidPlatforms = result.solidPlatforms;
         }
      }

      // 解析实体层
      for (let layer of level.layerInstances) {
         if (layer.__identifier === "Entities") {
            let result = this.parseEntityLayer(layer, solidPlatforms);
            player = result.player;
            enemies = result.enemies;
         }
      }

      // 如果没有找到 PlayerStart 实体，创建默认玩家
      if (!player) player = new Player(50, 50);

      return { player, platforms, solidPlatforms, enemies, canvasWidth, canvasHeight };
   }

   // ========== 内部解析方法 ==========

   static parseCollisionLayer(layer, ldtkData) {
      let gridSize = layer.__gridSize;
      let cols = layer.__cWid;
      let csv = layer.intGridCsv;
      let lookup = this.getIntGridLookup(ldtkData, "Collisions");
      let SOLID_TYPES = GameConfig.World.COLLISIONTYPE;

      let platforms = [];
      let solidPlatforms = [];

      for (let i = 0; i < csv.length; i++) {
         let tileId = csv[i];
         if (tileId === 0) continue;

         let px = (i % cols) * gridSize + layer.__pxTotalOffsetX;
         let py = Math.floor(i / cols) * gridSize + layer.__pxTotalOffsetY;
         let typeName = lookup[tileId] || "Unknown";

         let platform = new Platform(px, py, gridSize, gridSize, typeName);
         platforms.push(platform);

         if (SOLID_TYPES.includes(typeName)) {
            solidPlatforms.push(platform);
         }
      }

      return { platforms, solidPlatforms };
   }

   static parseEntityLayer(layer, solidPlatforms) {
      let player = null;
      let enemies = [];

      for (let entity of layer.entityInstances) {
         let x = entity.px[0] + layer.__pxTotalOffsetX;
         let y = entity.px[1] + layer.__pxTotalOffsetY;

         if (entity.__identifier === "Player_start") {
            player = new Player(x, y);
         } else if (entity.__identifier === "Enemy") {
            let hp = 3, damage = 1;
            let hpField = entity.fieldInstances.find(f => f.__identifier === "hp");
            let dmgField = entity.fieldInstances.find(f => f.__identifier === "damage");
            if (hpField) hp = hpField.__value;
            if (dmgField) damage = dmgField.__value;
            enemies.push(new Enemy(x, y, hp, damage, solidPlatforms));
         }
      }

      return { player, enemies };
   }

   /** 构建 IntGrid ID → 名称 映射表 */
   static getIntGridLookup(ldtkData, layerName) {
      let lookup = {};
      let layerDef = ldtkData.defs.layers.find(l => l.identifier === layerName);
      if (!layerDef) {
         console.error(`找不到名为 "${layerName}" 的图层定义`);
         return lookup;
      }
      for (let valDef of layerDef.intGridValues) {
         lookup[valDef.value] = valDef.identifier;
      }
      return lookup;
   }
}
