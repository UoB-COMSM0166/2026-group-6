/**
 * Entity — 所有游戏实体的基类
 *
 * 提供:
 *   - 位置、尺寸、碰撞检测
 *   - 默认显示 (p5 形状, 颜色取自 LDtk 编辑器)
 *   - 精灵占位 (this.sprite), 将来替换为图片
 *   - onPlayerContact() 接口, 子类覆写实现各种交互
 */
class Entity {
   /**
    * @param {number} x  像素坐标 x
    * @param {number} y  像素坐标 y
    * @param {number} w  宽度 (像素)
    * @param {number} h  高度 (像素)
    * @param {Object} [spawnData]  LDtk 原始数据
    */
   constructor(x, y, w, h, spawnData = {}) {
      // 位置与尺寸
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;

      // 状态
      this.active = true;

      // 实体类型标识 (LDtk 中的 __identifier)
      this.type = spawnData.identifier || 'Entity';

      // 显示颜色 (LDtk 编辑器中定义的颜色, 作为默认绘制色)
      this.displayColor = spawnData.color || '#2600ff';

      // ★ 精灵占位 — 将来用 loadImage() 设置
      // 设置后 display() 会自动用精灵替代形状
      this.sprite = null;

      // LDtk 自定义字段 (方便子类读取)
      this.fields = spawnData.fields || {};
   }

   // ====== 中心点 ======

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   // ====== 生命周期 ======

   get isDead() { return !this.active; }

   /** 销毁此实体 */
   destroy() { this.active = false; }

   // ====== 碰撞检测 ======

   /**
    * 检测是否与玩家接触
    * @param {Player} player
    * @returns {boolean}
    */
   isTouchingPlayer(player) {
      if (!this.active) return false;
      return Physics.rectIntersect(
         this.x, this.y, this.w, this.h,
         player.x, player.y, player.w, player.h
      );
   }

   /**
    * 玩家接触时的行为 — 子类覆写此方法
    *
    * @param {Player} player
    * @param {GameManager} gm
    */
   onPlayerContact(player, gm) {
      // 默认无行为, 子类覆写
   }

   /**
    * 检测是否与绳子接触
    * @param {Player} player
    * @param {Rope} rope
    * @returns {boolean}
    */
   isTouchingRope(rope, player) {
      if (!this.active) return false;
      if (rope.state !== "EXTENDING" && rope.state !== "SWINGING") return false;
      let tip = rope.getTip(player);
      return dist(tip.x, tip.y, this.cx(), this.cy()) < 10;
   }

   /**
    * 绳子接触时的行为 — 子类覆写此方法
    *
    * @param {Player} player
    * @param {Rope} rope
    * @param {GameManager} gm
    */
   onRopeContact(rope, player, gm) {
      // 默认无行为
   }

   // ====== 更新 ======

   /**
    * 每帧更新 — 子类覆写添加AI/动画等
    * @param {LevelManager} level
    */
   update(level) {
      // 默认无行为
   }

   // ====== 显示 ======

   /**
    * 渲染实体
    *
    * 优先级: sprite > 子类覆写的 _drawShape() > 默认矩形
    *
    * 将来给实体加图片只需:
    *   entity.sprite = loadImage('xxx.png');
    */
   display() {
      if (!this.active) return;

      if (this.sprite) {
         // 有sprite时直接绘制图片
         image(this.sprite, this.x, this.y, this.w, this.h);
      } else {
         // 无精灵时用 p5 形状绘制
         this._drawShape();
      }
   }

   /**
    * 用 p5 形状绘制实体 — 子类可覆写定制外观
    *
    * 默认: 用 LDtk 编辑器颜色画填充矩形
    */
   _drawShape() {
      fill(this.displayColor);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
   }
}
