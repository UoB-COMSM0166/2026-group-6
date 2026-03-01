class introUI {
   constructor() {
      this.stars = [];
      this.starCount = 200;
      for (let i = 0; i < this.starCount; i++) {
         this.stars.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            phase: random(TWO_PI),
         });
      }
      this.transition = 0;
      this.transitionSpeed = 0.02;
      this.isTransitioning = false;
   }

   drawBackground() {
      push();
      for (let i = 0; i <= height; i++) {
         let inter = map(i, 0, height, 0, 1);
         let c = lerpColor(color(100, 210, 180), color(200, 170, 210), inter);
         stroke(c);
         line(0, i, width, i);
      }
      noStroke();
      for (let s of this.stars) {
         let alpha = map(sin(frameCount * 0.02 + s.phase), -1, 1, 80, 255);
         fill(255, 255, 255, alpha);
         ellipse(s.x, s.y, s.size, s.size);
      }
      pop();
   }

   drawTitle() {
      push();
      textAlign(CENTER, CENTER);
      textSize(70);
      for (let i = 4; i > 0; i--) {
         fill(100, 150, 255, 30);
         text("in the natural", width / 2 + i, height / 2 + i);
      }
      fill(255);
      text("Purifying", width / 2, height / 2);
      textSize(20);
      fill(200, 220, 255);
      text("—— Click to see Instruction ——", width / 2, 400);
      pop();
   }

   drawFooter() {
      push();
      textAlign(CENTER, CENTER);
      textSize(16);
      fill(255, 255, 255);
      text("✨ UoB-COMSM0166/2026-group-6 ✨", width / 2, 570);
      pop();
   }

   // 绘制单个按键（矩形）
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

   // 绘制鼠标图标：椭圆形
   drawMouseIcon(x, y, w, h, alpha) {
      push();
      rectMode(CENTER);
      ellipseMode(CENTER);
      let aVal = alpha * 255;

      // 椭圆外框
      fill(40, 40, 50, aVal);
      stroke(255, 255, 255, aVal);
      strokeWeight(2);
      ellipse(x, y, w, h);

      // 鼠标
      stroke(255, 255, 255, aVal);
      strokeWeight(1.5);
      let lineY = y - h * 0.1; // 水平线略偏上点
      line(x - w / 2 + 4, lineY, x + w / 2 - 4, lineY);

      // 鼠标
      line(x, y - h / 2 + 4, x, lineY - 2);

      pop();
   }

   // 绘制说明页
   drawInstructionPage(alpha) {
      push();
      let aVal = alpha * 255;

      // 背景卡片
      fill(0, 0, 0, aVal * 0.7);
      noStroke();
      rect(120, 100, 560, 400, 20);

      fill(30, 30, 40, aVal * 0.8);
      stroke(255, 255, 255, aVal);
      strokeWeight(2);
      rect(130, 110, 540, 380, 16);

      // 标题
      fill(255, 255, 255, aVal);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(28);
      text("Game Instructions", width / 2, 150);

      // ========== 移动部分：左右两列，每列两层 ==========
      let leftXBase = 200; // 左侧按键
      let rightXBase = 480; // 右侧按键
      let startY = 200; // Y
      let keyWidth = 40;
      let keyHeight = 32;
      let horizontalSpacing = 10; // 水平
      let verticalSpacing = 40; // 垂直

      // WASD
      let aX = leftXBase;
      let sX = leftXBase + keyWidth + horizontalSpacing;
      let dX = leftXBase + 2 * (keyWidth + horizontalSpacing);
      let wX = sX;

      this.drawKey("W", wX, startY, keyWidth, keyHeight, alpha);
      let secondY = startY + verticalSpacing;
      this.drawKey("A", aX, secondY, keyWidth, keyHeight, alpha);
      this.drawKey("S", sX, secondY, keyWidth, keyHeight, alpha);
      this.drawKey("D", dX, secondY, keyWidth, keyHeight, alpha);

      // Arrows按键
      let leftArrowX = rightXBase;
      let downArrowX = rightXBase + keyWidth + horizontalSpacing;
      let rightArrowX = rightXBase + 2 * (keyWidth + horizontalSpacing);
      let upX = (leftArrowX + rightArrowX) / 2;

      this.drawKey("↑", upX, startY, keyWidth, keyHeight, alpha);
      this.drawKey("←", leftArrowX, secondY, keyWidth, keyHeight, alpha);
      this.drawKey("↓", downArrowX, secondY, keyWidth, keyHeight, alpha);
      this.drawKey("→", rightArrowX, secondY, keyWidth, keyHeight, alpha);

      //  Move 
      let midX =
         (leftXBase + 2.5 * (keyWidth + horizontalSpacing) + rightXBase) / 2;
      let midY = startY + verticalSpacing / 2;
      fill(255, 255, 255, aVal);
      textAlign(CENTER, CENTER);
      textSize(20);
      text("Move", midX, midY);

      // ========== 其他单键 ==========
      let otherStartY = secondY + verticalSpacing + 10;
      let rowHeight = 40;

      const singleKeys = [
         { key: "Space", desc: "Jump" },
         { key: "F", desc: "Save" },
         { key: "R", desc: "Restart" },
         { key: "M", desc: "Map" },
         { type: "mouse", desc: "Fire Rope" },//之后记得改成左右键不同
      ];

      for (let i = 0; i < singleKeys.length; i++) {
         let item = singleKeys[i];
         let y = otherStartY + i * rowHeight;

         if (item.type === "mouse") {
            this.drawMouseIcon(280, y + 5, 25, 33, alpha);
         } else {
            let keyW = item.key === "Space" ? 80 : 50;
            this.drawKey(item.key, 280, y, keyW, 32, alpha);
         }

         fill(255, 255, 255, aVal);
         textAlign(LEFT, CENTER);
         textSize(18);
         text(item.desc, 480, y);
      }

      pop();
   }

   display() {
      this.drawBackground();
      this.drawTitle();
      this.drawFooter();

      if (this.transition > 0) {
         push();
         fill(0, 0, 0, this.transition * 200);
         noStroke();
         rect(0, 0, width, height);
         pop();

         this.drawInstructionPage(this.transition);
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
