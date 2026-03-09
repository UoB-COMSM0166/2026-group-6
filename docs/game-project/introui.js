class introUI {
   constructor() {
      this.transition = 0;
      this.transitionSpeed = 0.02;
      this.isTransitioning = false;
      this.page = 0; //cover
      this.fxCanvas = null;
      this.fxCtx = null;
      this.fxCreated = false;
      this.fxW = 1600;
      this.fxH = 900;
      this.fxOffsetX = 300;
      this.fxOffsetY = 100;

      // 侧边栏 canvas
      this.leftCanvas = null;
      this.rightCanvas = null;
      this.leftCtx = null;
      this.rightCtx = null;
      this.sidePanelsCreated = false;
      this.sidePanelsVisible = false;
      this.panelWidth = 260;
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

   //新增一层画布
   createFxCanvas() {
   if (this.fxCreated) return;

   this.fxCanvas = document.createElement('canvas');
   this.fxCanvas.width = this.fxW;
   this.fxCanvas.height = this.fxH;
   this.fxCanvas.id = 'intro-fx';
   this.fxCanvas.style.cssText =
      'position:absolute; top:50%; left:50%;' +
      'transform:translate(-50%, -50%);' +
      'display:none; pointer-events:none; z-index:2;';
   document.body.appendChild(this.fxCanvas);

   this.fxCtx = this.fxCanvas.getContext('2d');
   this.fxCreated = true;
}

   showFx(alpha) {
      if (!this.fxCreated) this.createFxCanvas();
      
      this.fxCanvas.style.display = 'block';
      this._drawFxLayer(alpha);
   }
   
   hideFx() {
      if (!this.fxCreated) return;
      this.fxCanvas.style.display = 'none';
   }

   _drawFxLayer(alpha = 1) {
   const ctx = this.fxCtx;
   const a = alpha;

   ctx.clearRect(0, 0, this.fxW, this.fxH);

   const main = {
      x: this.fxOffsetX,
      y: this.fxOffsetY,
      w: 1000,
      h: 700
   };

   const leftPanel = {
      x: this.fxOffsetX - this.panelWidth - 10,
      y: this.fxOffsetY,
      w: this.panelWidth,
      h: this.panelHeight
   };

   const rightPanel = {
      x: this.fxOffsetX + 1000 + 10,
      y: this.fxOffsetY,
      w: this.panelWidth,
      h: this.panelHeight
   };

   this._drawFxStars(ctx, a, main);
   this._drawPanelWrapFx(ctx, leftPanel, a, 'left');
   this._drawPanelWrapFx(ctx, rightPanel, a, 'right');
   this._drawMainFrameFx(ctx, main, a);
   this._drawMainStreaks(ctx, main, a);
}

_drawFxStars(ctx, alpha, main) {
   let seed = 7;
   function rand() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
   }

   function inRect(x, y, r) {
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
   }

   ctx.save();

   for (let i = 0; i < 46; i++) {
      let x = rand() * 1600;
      let y = rand() * 900;
      if (inRect(x, y, main)) continue;

      let s = rand() < 0.8 ? 1 : 2;
      ctx.fillStyle = `rgba(170,210,255,${0.28 * alpha})`;
      ctx.fillRect(x, y, s, s);
   }

   for (let i = 0; i < 18; i++) {
      let x = rand() * 1600;
      let y = rand() * 900;
      if (inRect(x, y, main)) continue;

      let s = rand() < 0.75 ? 2 : 3;
      ctx.fillStyle = `rgba(120,200,255,${0.46 * alpha})`;
      ctx.fillRect(x, y, s, s);
   }

   ctx.restore();
}

_drawPanelWrapFx(ctx, r, alpha, side = 'left') {
   ctx.save();

   ctx.strokeStyle = `rgba(120,220,255,${0.35 * alpha})`;
   ctx.lineWidth = 1;
   ctx.shadowBlur = 12;
   ctx.shadowColor = `rgba(80,220,255,${0.28 * alpha})`;
   ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);

   this._drawFxCorner(ctx, r.x - 10, r.y - 8, alpha, 'tl');
   this._drawFxCorner(ctx, r.x + r.w - 8, r.y - 8, alpha, 'tr');
   this._drawFxCorner(ctx, r.x - 10, r.y + r.h - 8, alpha, 'bl');
   this._drawFxCorner(ctx, r.x + r.w - 8, r.y + r.h - 8, alpha, 'br');

   if (side === 'left') {
      this._drawFxSquare(ctx, r.x - 18, r.y + 120, 8, alpha);
      this._drawFxSquare(ctx, r.x - 14, r.y + 370, 6, alpha);
      this._drawFxSquare(ctx, r.x - 16, r.y + 590, 8, alpha);
   } else {
      this._drawFxSquare(ctx, r.x + r.w + 8, r.y + 120, 8, alpha);
      this._drawFxSquare(ctx, r.x + r.w + 6, r.y + 370, 6, alpha);
      this._drawFxSquare(ctx, r.x + r.w + 8, r.y + 590, 8, alpha);
   }

   ctx.restore();
}

_drawMainFrameFx(ctx, r, alpha) {
   ctx.save();

   ctx.strokeStyle = `rgba(120,220,255,${0.22 * alpha})`;
   ctx.lineWidth = 1;
   ctx.shadowBlur = 10;
   ctx.shadowColor = `rgba(80,220,255,${0.22 * alpha})`;
   ctx.strokeRect(r.x, r.y, r.w, r.h);

   this._drawFxSquare(ctx, r.x - 6, r.y + 140, 7, alpha * 0.7);
   this._drawFxSquare(ctx, r.x - 6, r.y + 470, 7, alpha * 0.7);

   this._drawFxSquare(ctx, r.x + r.w - 1, r.y + 180, 7, alpha * 0.7);
   this._drawFxSquare(ctx, r.x + r.w - 1, r.y + 520, 7, alpha * 0.7);

   ctx.restore();
}

_drawMainStreaks(ctx, r, alpha) {
   this._drawFxStreak(ctx, r.x + 120, r.y + 18, 64, alpha * 0.50);
   this._drawFxStreak(ctx, r.x + 770, r.y + 24, 56, alpha * 0.45);

   this._drawFxStreak(ctx, r.x + 170, r.y + r.h - 40, 58, alpha * 0.45);
   this._drawFxStreak(ctx, r.x + 805, r.y + r.h - 44, 70, alpha * 0.50);
}


_drawFxStreak(ctx, x, y, len, alpha) {
   ctx.save();
   ctx.globalAlpha = alpha;

   for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(80,220,255,${0.035 * (5 - i)})`;
      ctx.fillRect(x - i * 14, y, len, 3);
   }

   ctx.fillStyle = `rgba(220,245,255,0.65)`;
   ctx.fillRect(x, y, len * 0.20, 2);

   ctx.fillStyle = `rgba(80,220,255,0.45)`;
   ctx.fillRect(x + len * 0.20, y, len * 0.42, 2);

   ctx.restore();
}

_drawFxCorner(ctx, x, y, alpha, type) {
   const blocks = [
      [0, 0, 12],
      [10, 0, 8],
      [20, 0, 6],
      [0, 10, 8],
      [0, 20, 6]
   ];

   for (const [dx, dy, s] of blocks) {
      let px = x;
      let py = y;

      if (type === 'tl') {
         px = x + dx;
         py = y + dy;
      } else if (type === 'tr') {
         px = x - dx - s;
         py = y + dy;
      } else if (type === 'bl') {
         px = x + dx;
         py = y - dy - s;
      } else if (type === 'br') {
         px = x - dx - s;
         py = y - dy - s;
      }

      ctx.fillStyle = `rgba(80,220,255,${0.16 * alpha})`;
      ctx.fillRect(px - 2, py - 2, s + 4, s + 4);

      ctx.fillStyle = `rgba(110,240,255,${0.92 * alpha})`;
      ctx.fillRect(px, py, s, s);
   }
}

_drawFxSquare(ctx, x, y, s, alpha) {
   ctx.fillStyle = `rgba(80,220,255,${0.16 * alpha})`;
   ctx.fillRect(x - 2, y - 2, s + 4, s + 4);

   ctx.fillStyle = `rgba(110,240,255,${0.92 * alpha})`;
   ctx.fillRect(x, y, s, s);
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
      ctx.fillStyle = `rgba(8, 14, 28, ${0.62 * a})`;
      ctx.beginPath();
      this._roundRect(ctx, 0, 0, w, h, 16);
      ctx.fill();
      //效果
      this._drawPanelAccent(ctx, w, h, a, 'left');
      this._drawPanelFx(ctx, w, h, a, 'left');

      // 外发光细边
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = `rgba(80,220,255,${0.20 * a})`;
      ctx.strokeStyle = `rgba(120,200,255,${0.28 * a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this._roundRect(ctx, 2, 2, w - 4, h - 4, 18);
      ctx.stroke();
      ctx.restore();

      // 内边框
      ctx.strokeStyle = `rgba(255,255,255,${0.62 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      this._roundRect(ctx, 6, 6, w - 12, h - 12, 15);
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
      ctx.fillStyle = `rgba(8, 14, 28, ${0.62 * a})`;
      ctx.beginPath();
      this._roundRect(ctx, 0, 0, w, h, 18);
      ctx.fill();
      //效果
      this._drawPanelAccent(ctx, w, h, a, 'right');
      this._drawPanelFx(ctx, w, h, a, 'right');

      /// 外发光细边
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = `rgba(80,220,255,${0.20 * a})`;
      ctx.strokeStyle = `rgba(120,200,255,${0.28 * a})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this._roundRect(ctx, 2, 2, w - 4, h - 4, 18);
      ctx.stroke();
      ctx.restore();

      // 内边框
      ctx.strokeStyle = `rgba(255,255,255,${0.62 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      this._roundRect(ctx, 6, 6, w - 12, h - 12, 15);
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
         '2. Use Q/E or Mouse Wheel to adjust ',
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

   _drawGlowSquare(ctx, x, y, size, alpha, dir = 'right') {
   const a = alpha;

   //拖尾效果
   for (let i = 3; i >= 1; i--) {
      let tailAlpha = 0.04 * i * a;
      ctx.fillStyle = `rgba(80, 220, 255, ${tailAlpha})`;

      if (dir === 'right') {
         ctx.fillRect(x - i * size * 0.9, y, size, size);
      } else if (dir === 'left') {
         ctx.fillRect(x + i * size * 0.9, y, size, size);
      } else if (dir === 'down') {
         ctx.fillRect(x, y - i * size * 0.9, size, size);
      } else if (dir === 'up') {
         ctx.fillRect(x, y + i * size * 0.9, size, size);
      }
   }

   ctx.fillStyle = `rgba(80, 220, 255, ${0.12 * a})`;
   ctx.fillRect(x - 1.5, y - 1.5, size + 3, size + 3);

   ctx.fillStyle = `rgba(110, 240, 255, ${0.90 * a})`;
   ctx.fillRect(x, y, size, size);
}

_drawPixelCluster(ctx, x, y, count, spreadX, spreadY, alpha) {
   for (let i = 0; i < count; i++) {
      let px = x + Math.random() * spreadX;
      let py = y + Math.random() * spreadY;
      let s = 4 + Math.random() * 8;

      ctx.fillStyle = `rgba(80, 220, 255, ${0.14 * alpha})`;
      ctx.fillRect(px - 2, py - 2, s + 4, s + 4);

      ctx.fillStyle = `rgba(110, 240, 255, ${0.75 * alpha})`;
      ctx.fillRect(px, py, s, s);
   }
}

_drawPanelAccent(ctx, w, h, alpha, side = 'left') {
   const a = alpha;

   // 1. 外侧窄渐变带
   const bandW = 14;
   let grad;

   if (side === 'left') {
      grad = ctx.createLinearGradient(0, 0, bandW, 0);
      grad.addColorStop(0.0, `rgba(80,220,255,${0.18 * a})`);
      grad.addColorStop(0.5, `rgba(80,220,255,${0.06 * a})`);
      grad.addColorStop(1.0, `rgba(80,220,255,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, bandW, h);

      this._drawCornerL(ctx, 8, 14, a, false);      // 左上
      this._drawCornerL(ctx, 8, h - 54, a, false);  // 左下
   } else {
      grad = ctx.createLinearGradient(w, 0, w - bandW, 0);
      grad.addColorStop(0.0, `rgba(80,220,255,${0.18 * a})`);
      grad.addColorStop(0.5, `rgba(80,220,255,${0.06 * a})`);
      grad.addColorStop(1.0, `rgba(80,220,255,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(w - bandW, 0, bandW, h);

      this._drawCornerL(ctx, w - 8, 14, a, true);      // 右上
      this._drawCornerL(ctx, w - 8, h - 54, a, true);  // 右下
   }
}

_drawCornerL(ctx, x, y, alpha, mirror = false) {
   const blocks = [
      [0, 0, 10],
      [12, 0, 6],
      [0, 12, 6],
      [0, 24, 4]
   ];

   for (const [dx, dy, s] of blocks) {
      const px = mirror ? x - dx - s : x + dx;
      const py = y + dy;

      ctx.fillStyle = `rgba(80,220,255,${0.12 * alpha})`;
      ctx.fillRect(px - 2, py - 2, s + 4, s + 4);

      ctx.fillStyle = `rgba(110,240,255,${0.80 * alpha})`;
      ctx.fillRect(px, py, s, s);
   }
}

_drawPanelFx(ctx, w, h, alpha, side = 'left') {
   return;
}

drawIntroBackground() {
   push();

   for (let y = 0; y < height; y++) {
      let t = y / height;
      let r = lerp(4, 1, t);
      let g = lerp(12, 6, t);
      let b = lerp(30, 18, t);
      stroke(r, g, b);
      line(0, y, width, y);
   }

   noStroke();
   for (let i = 0; i < 7; i++) {
      fill(60, 180, 255, 8);
      ellipse(70, height / 2, 180 + i * 40, 420 + i * 30);
      ellipse(width - 70, height / 2, 180 + i * 40, 420 + i * 30);
   }

   pop();
}

drawCover() {
   let cover = resources.images.cover;

   push();
   image(cover, 0, 0, 1000, 700);
   pop();
}

display() {
   this.drawIntroBackground();
   this.drawCover();

   if (this.page === 0) {
      this.hideFx();
      this.hideSidePanels();
      return;
   }

   if (this.page === 1) {
      this.showFx(this.transition);
      this.showSidePanels(this.transition);
   }
}

startTransition() {
   this.page = 1;
   this.isTransitioning = true;
}

updateTransition() {
   if (!this.isTransitioning) return;

   this.transition += this.transitionSpeed;
   if (this.transition >= 1) {
      this.transition = 1;
      this.isTransitioning = false;
   }
}

}