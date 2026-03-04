class introUI {
   constructor() {
      this.transition = 0;
      this.transitionSpeed = 0.02;
      this.isTransitioning = false;

      // 侧边栏 canvas
      this.leftCanvas = null;
      this.rightCanvas = null;
      this.leftCtx = null;
      this.rightCtx = null;
      this.sidePanelsCreated = false;
      this.sidePanelsVisible = false;
      this.panelWidth = 280;
      this.panelHeight = 700;
   }

   // 侧边栏

   createSidePanels() {
      if (this.sidePanelsCreated) return;

      let pw = this.panelWidth;
      let ph = this.panelHeight;

      // 左侧面板
      this.leftCanvas = document.createElement('canvas');
      this.leftCanvas.width = pw;
      this.leftCanvas.height = ph;
      this.leftCanvas.id = 'instruction-left';
      this.leftCanvas.style.cssText =
         'position:absolute; top:50%; left:50%;' +
         'transform:translate(-50%, -50%);' +
         'margin-left:-' + (500 + pw / 2 + 10) + 'px;' +
         'border-radius:16px; display:none;';
      document.body.appendChild(this.leftCanvas);
      this.leftCtx = this.leftCanvas.getContext('2d');

      // 右侧面板
      this.rightCanvas = document.createElement('canvas');
      this.rightCanvas.width = pw;
      this.rightCanvas.height = ph;
      this.rightCanvas.id = 'instruction-right';
      this.rightCanvas.style.cssText =
         'position:absolute; top:50%; left:50%;' +
         'transform:translate(-50%, -50%);' +
         'margin-left:' + (500 + pw / 2 + 10) + 'px;' +
         'border-radius:16px; display:none;';
      document.body.appendChild(this.rightCanvas);
      this.rightCtx = this.rightCanvas.getContext('2d');

      this.sidePanelsCreated = true;
   }

   showSidePanels(alpha) {
      if (!this.sidePanelsCreated) this.createSidePanels();
      alpha = alpha || 1;

      this.leftCanvas.style.display = 'block';
      this.rightCanvas.style.display = 'block';
      this.sidePanelsVisible = true;

      this._drawLeftPanel(this.leftCtx, this.panelWidth, this.panelHeight, alpha);
      this._drawRightPanel(this.rightCtx, this.panelWidth, this.panelHeight, alpha);
   }

   hideSidePanels() {
      if (!this.sidePanelsCreated) return;
      if (!this.sidePanelsVisible) return;
      this.leftCanvas.style.display = 'none';
      this.rightCanvas.style.display = 'none';
      this.sidePanelsVisible = false;
   }

   // 左面版

   _drawLeftPanel(ctx, w, h, alpha) {
      let a = alpha;
      ctx.clearRect(0, 0, w, h);

      // 背景
      ctx.fillStyle = `rgba(15, 15, 25, ${0.92 * a})`;
      ctx.beginPath();
      this._roundRect(ctx, 0, 0, w, h, 16);
      ctx.fill();

      // 边框
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      this._roundRect(ctx, 4, 4, w - 8, h - 8, 14);
      ctx.stroke();

      // 标题
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Movement & Actions', w / 2, 40);

      // 分隔线
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 65);
      ctx.lineTo(w - 30, 65);
      ctx.stroke();

      // WASD 键
      let centerX = w / 2;
      let startY = 110;
      let keyW = 44;
      let keyH = 34;
      let gap = 8;

      // W
      this._drawKeyCtx(ctx, 'W', centerX, startY, keyW, keyH, a);
      // A S D
      let row2Y = startY + keyH + gap;
      this._drawKeyCtx(ctx, 'A', centerX - keyW - gap, row2Y, keyW, keyH, a);
      this._drawKeyCtx(ctx, 'S', centerX, row2Y, keyW, keyH, a);
      this._drawKeyCtx(ctx, 'D', centerX + keyW + gap, row2Y, keyW, keyH, a);

      // "Move" 标签
      ctx.fillStyle = `rgba(200, 220, 255, ${a})`;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Move', centerX, row2Y + keyH + 25);

      // 其他按键列表
      let listStartY = row2Y + keyH + 65;
      let rowH = 50;
      let keyX = w / 2 + 30;
      let descX = 35;

      const keys = [
         { key: 'F', desc: 'Interact' },
         { key: 'M', desc: 'Map' },
         { key: 'H', desc: 'Help' },
         { key: 'ESC', desc: 'Menu' },
      ];

      for (let i = 0; i < keys.length; i++) {
         let item = keys[i];
         let y = listStartY + i * rowH + 20;

         if (item.type === 'mouse') {
            this._drawMouseIconCtx(ctx, keyX, y, 28, 36, a);
         } else {
            let kw = item.key === 'ESC' ? 56 : 44;
            this._drawKeyCtx(ctx, item.key, keyX, y, kw, 30, a);
         }

         ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
         ctx.font = '16px sans-serif';
         ctx.textAlign = 'left';
         ctx.textBaseline = 'middle';
         ctx.fillText(item.desc, descX, y);
      }
   }

   // 右面板

   _drawRightPanel(ctx, w, h, alpha) {
      let a = alpha;
      ctx.clearRect(0, 0, w, h);

      // 背景
      ctx.fillStyle = `rgba(15, 15, 25, ${0.92 * a})`;
      ctx.beginPath();
      this._roundRect(ctx, 0, 0, w, h, 16);
      ctx.fill();

      // 边框
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      this._roundRect(ctx, 4, 4, w - 8, h - 8, 14);
      ctx.stroke();

      // 标题
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Rope Controls', w / 2, 40);

      // 分隔线
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 65);
      ctx.lineTo(w - 30, 65);
      ctx.stroke();

      // 鼠标说明区域
      let mouseY = 120;
      this._drawMouseIconCtx(ctx, w / 2, mouseY, 40, 52, a);

      // LMB / RMB 标签
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';

      // 左键标注
      ctx.fillStyle = `rgba(0, 255, 255, ${a})`;
      ctx.fillText('LMB', w / 2 - 50, mouseY - 10);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = `rgba(200, 220, 255, ${a})`;
      ctx.fillText('Cyan Rope', w / 2 - 50, mouseY + 8);

      // 右键标注
      ctx.font = '14px sans-serif';
      ctx.fillStyle = `rgba(255, 100, 100, ${a})`;
      ctx.fillText('RMB', w / 2 + 50, mouseY - 10);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = `rgba(255, 200, 200, ${a})`;
      ctx.fillText('Red Rope', w / 2 + 50, mouseY + 8);

      // 绳索按键
      let listStartY = 200;
      let rowH = 55;
      let keyX = w / 2 + 30;
      let descX = 35;

      const ropeKeys = [
         { key: 'E', desc: 'Prolong Rope' },
         { key: 'Q', desc: 'Shorten Rope' },
      ];

      // 小标题
      ctx.fillStyle = `rgba(200, 220, 255, ${a})`;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Rope Actions', w / 2, listStartY - 15);

      for (let i = 0; i < ropeKeys.length; i++) {
         let item = ropeKeys[i];
         let y = listStartY + 40 + i * rowH;

         this._drawKeyCtx(ctx, item.key, keyX, y, 44, 30, a);

         ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
         ctx.font = '16px sans-serif';
         ctx.textAlign = 'left';
         ctx.textBaseline = 'middle';
         ctx.fillText(item.desc, descX, y);
      }

      // 额外提示区
      let tipY = listStartY + 20 + ropeKeys.length * rowH + 30;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, tipY);
      ctx.lineTo(w - 30, tipY);
      ctx.stroke();

      ctx.fillStyle = `rgba(180, 160, 255, ${a})`;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tips', w / 2, tipY + 25);

      ctx.fillStyle = `rgba(200, 200, 220, ${0.9 * a})`;
      ctx.font = '13px sans-serif';
      let tips = [
         '1. Click Left or Right Button to Fire',
         ' Rope',
         '2. Use E/C or Mouse Wheel to adjust ',
         'rope length',
         '3. You can change the Length of the',
         'rope near the Mouse Cursor, and the ',
         'icon represented by this rope will be',
         'Bolded at the bottom of the screen.',
      ];
      for (let i = 0; i < tips.length; i++) {
         ctx.fillText(tips[i], w / 2, tipY + 55 + i * 29);
      }
   }

   // Canvas 2D 绘制辅助

   _roundRect(ctx, x, y, w, h, r) {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
   }

   _drawKeyCtx(ctx, label, x, y, w, h, alpha) {
      let a = alpha;
      // 按键背景
      ctx.fillStyle = `rgba(40, 40, 50, ${a})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      this._roundRect(ctx, x - w / 2, y - h / 2, w, h, 8);
      ctx.fill();
      ctx.stroke();

      // 文字
      ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
   }

   _drawMouseIconCtx(ctx, x, y, w, h, alpha) {
      let a = alpha;

      // 椭圆外框
      ctx.fillStyle = `rgba(40, 40, 50, ${a})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 水平分割线
      let lineY = y - h * 0.1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + 4, lineY);
      ctx.lineTo(x + w / 2 - 4, lineY);
      ctx.stroke();

      // 垂直线（滚轮）
      ctx.beginPath();
      ctx.moveTo(x, y - h / 2 + 4);
      ctx.lineTo(x, lineY - 2);
      ctx.stroke();

      // 左键高亮
      ctx.fillStyle = `rgba(0, 255, 255, ${0.4 * a})`;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.arc(x, lineY, (w - 8) / 2, Math.PI, Math.PI + Math.PI / 2);
      ctx.closePath();
      ctx.fill();

      // 右键高亮
      ctx.fillStyle = `rgba(255, 100, 100, ${0.4 * a})`;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.arc(x, lineY, (w - 8) / 2, Math.PI + Math.PI / 2, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
   }

   drawCover() {
      let cover = resources.images.cover;
      image(cover, 0, 0, 1000, 700);
   }

   drawKey(label, x, y, w, h, alpha) {
      push();
      rectMode(CENTER);
      fill(40, 40, 50, alpha * 255);
      stroke(255, 255, 255, alpha * 255);
      strokeWeight(2);
      rect(x, y, w, h, 8);
      fill(255, 255, 255, alpha * 255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(16);
      text(label, x, y);
      pop();
   }


   drawInstructionPage(alpha) {
      this.showSidePanels(alpha);
   }

   display() {
      this.drawCover();
      if (this.transition > 0) {
         push();
         fill(0, 0, 0, this.transition * 200);
         noStroke();
         rect(0, 0, width, height);
         pop();

         // 显示侧边栏
         this.showSidePanels(this.transition);
      } else {
         this.hideSidePanels();
      }
   }

   startTransition() {
      if (!this.isTransitioning && this.transition < 1) {
         this.isTransitioning = true;
      }
   }

   updateTransition() {
      if (this.isTransitioning) {
         this.transition += this.transitionSpeed;
         if (this.transition >= 1) {
            this.transition = 1;
            this.isTransitioning = false;
         }
      }
   }
}