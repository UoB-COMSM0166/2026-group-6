/**
 * Entity — 所有游戏实体的基类
 *
 * 提供:
 *   - 位置、尺寸、碰撞检测
 *   - 默认显示 (rect 形状)
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

      // 精灵占位 — 将来用 loadImage() 设置
      // 设置后 display() 会自动用精灵替代形状
      this.sprite = null;

      // LDtk 自定义字段 (方便子类读取)
      this.fields = spawnData.fields || {};

      this.dialogOpen = false;     // 当前是否展开
      this._playerNearby = false;  // 本帧玩家是否接触（每帧重置）
      this.dialogText;
      this.dialogW;
      // LDtk 实体唯一 id（跨 level 引用、按钮开门用）
      this.iid = spawnData.iid || null;
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
      if (rope.state === "IDLE" || rope.state === "RETRACTING") return false;
      let tip = rope.getTip(player);
      return Physics.pointRect(tip.x, tip.y, this.x, this.y, this.w, this.h);
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
   display(level) {
      if (!this.active) return;

      if (this.sprite) {
         // 有sprite时直接绘制图片
         image(this.sprite, this.x, this.y, this.w, this.h);
      } else {
         // 无精灵时用 p5 形状绘制，顺便把 level 也传给子类的绘制方法
         this._drawShape(level);
      }
      if (!this.dialogOpen) return;

      this._drawDialog(this.dialogW);
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

   _drawDialog(w) {
      const lines = this.dialogText.split('\n');
      const fontSize = 4;
      const lineH = fontSize + 1.5;
      const padX = 3;
      const padY = 3;
      const boxW = w || 55;
      const boxH = lines.length * lineH + padY * 2;

      // 对话框居中于画作上方
      const bx = this.cx() - boxW / 2;
      const by = this.y - boxH - 10;

      // ── 外框阴影──
      fill(0, 0, 0, 100);
      noStroke();
      rect(bx + 2, by + 2, boxW, boxH, 3);

      // ── 主体背景 ──
      fill(10, 10, 20, 230);
      stroke(180, 140, 255);
      strokeWeight(1);
      rect(bx, by, boxW, boxH, 3);


      // ── 文字 ──
      fill(230, 210, 255);
      noStroke();
      textAlign(LEFT, TOP);
      textSize(fontSize);
      for (let i = 0; i < lines.length; i++) {
         text(lines[i], bx + padX + 3, by + padY + i * lineH);
      }

      // ── 尾巴（三角形指向画作）──
      fill(10, 10, 20, 230);
      stroke(180, 140, 255);
      strokeWeight(1);
      let tx = this.cx();
      triangle(
         tx - 4, by + boxH,
         tx + 4, by + boxH,
         tx, by + boxH + 8
      );
      // 遮掉尾巴与框之间的边框线
      noStroke();
      fill(10, 10, 20, 230);
      rect(tx - 3, by + boxH - 1, 6, 3);
   }
}
