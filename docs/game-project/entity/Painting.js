class Painting extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      const dialogPool = [
         "The sky was once\nthis clear every day.",
         "A world without smog.\nWas it ever real?",
         "Look at those trees.\nSo alive, so green.",
         "The air in this painting\nfeels clean. I miss that.",
         "Nature in its purest form.\nWe almost lost it all.",
         "Such stillness.\nNo pollution, no monster.",
         "The painter must have\nloved this world deeply.",
         "Every leaf, every wave—\nperfect as they are.",
         "If only we could\nstep inside this world.",
         "The light here is warm.\nNot filtered through dust.",
         "Somewhere, this place\nstill exists. Maybe.",
         "The scenery in the past, \nit was really beautiful!",
      ];
      // 对话框内容：优先读取 LDtk 自定义字段 "text"，否则使用默认文字
      this.dialogText = random(dialogPool);
      this.sprite = random(resources.images.painting.paintings);
      // 对话框状态
      this.dialogOpen = false;     // 当前是否展开
      this._playerNearby = false;  // 本帧玩家是否接触（每帧重置）
   }

   onPlayerContact(player, gm) {
      let fNow = keyIsDown(Keys.F);
      if (fNow) {
         this.dialogOpen = !this.dialogOpen;
      }
      if (this.dialogOpen === true) return;
      player.setPrompt('F');
      this._playerNearby = true;
   }

   update(level) {
      // 玩家离开后自动关闭对话框
      if (!this._playerNearby && this.dialogOpen) {
         this.dialogOpen = false;
      }
      // 每帧重置接触标志（由 onPlayerContact 在接触时置 true）
      this._playerNearby = false;
   }

   display() {
      this._drawFrame();
      super.display();
   }

   _drawFrame() {
      const f = 3;   // 画框厚度（像素）
      const fx = this.x - f;
      const fy = this.y - f;
      const fw = this.w + f * 2;
      const fh = this.h + f * 2;

      noStroke();

      // ── 最外层深色阴影边 ──
      fill(30, 20, 10);
      rect(fx - 1, fy - 1, fw + 2, fh + 2);

      // ── 主框体：木质棕金色 ──
      fill(120, 80, 30);
      rect(fx, fy, fw, fh);

      // ── 内层高光（左/上边缘） ──
      fill(180, 130, 60);
      rect(fx, fy, fw, 1);              // 顶边高光
      rect(fx, fy, 1, fh);              // 左边高光

      // ── 内层阴影（右/下边缘） ──
      fill(70, 45, 15);
      rect(fx + fw - 1, fy, 1, fh);     // 右边阴影
      rect(fx, fy + fh - 1, fw, 1);     // 底边阴影

      // ── 四角装饰铆钉 ──
      fill(200, 160, 70);
      const cs = 2;
      rect(fx, fy, cs, cs);  // 左上
      rect(fx + fw - cs, fy, cs, cs);  // 右上
      rect(fx, fy + fh - cs, cs, cs);  // 左下
      rect(fx + fw - cs, fy + fh - cs, cs, cs);  // 右下
   }
}