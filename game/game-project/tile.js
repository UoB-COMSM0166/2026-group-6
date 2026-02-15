/**
 * Tile — 物理与视觉统一体
 *
 * 每个 Tile 对应地图上一个格子，同时持有：
 *   - 碰撞类型 (type) → 物理引擎用
 *   - 贴图数据 (visuals[]) → 渲染用
 *   - active 标志 → destroy() 同时关闭物理和渲染
 *
 * 这解决了"画面和物理分离导致删不掉"的 Bug。
 */
class Tile {
   /**
    * @param {number} col  网格列号
    * @param {number} row  网格行号
    * @param {number} gridSize  格子像素尺寸
    * @param {string|null} type  碰撞类型 ("ground", "Wall" 等)，null 表示纯视觉
    * @param {boolean} isSolid  是否参与碰撞
    * @param {boolean} active  是否存在，激活
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

      // 视觉贴图数据: [{srcX, srcY, flip, gridSize}]
      // 一个格子可能有多张贴图叠加（LDtk 自动图块规则）
      this.visuals = [];
   }

   /** 添加一张视觉贴图 */
   addVisual(srcX, srcY, flip, gridSize) {
      this.visuals.push({ srcX, srcY, flip, gridSize });
   }

   /** 销毁：物理和渲染同时失效 */
   destroy() {
      this.active = false;
   }

   /** 绘制此格子的所有贴图 */
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
