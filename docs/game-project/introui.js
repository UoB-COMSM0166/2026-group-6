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

      let arcH = (lineY - (y - h / 2 + 4)) * 2;
      // 左键点击高亮
      noStroke();
      fill(0, 255, 255, aVal * 0.5);
      arc(x, lineY, w - 8, arcH, PI, PI + HALF_PI, PIE);

      // 右键点击高亮
      fill(255, 100, 100, aVal * 0.5);
      arc(x, lineY, w - 8, arcH, PI + HALF_PI, TWO_PI, PIE);

      pop();
   }

   // 绘制说明页
   drawInstructionPage(alpha) {
      push();
      alpha = alpha || 1;
      let aVal = alpha * 255;

      // 背景卡片
      const cardwidth = 450;
      const cardheight = 600;
      const cardmargin = 20;
      fill(0, 0, 0, aVal * 0.7);
      noStroke();
      rect(width / 2 - cardwidth / 2, 55, cardwidth, cardheight, 20);

      fill(30, 30, 40, aVal * 0.8);
      stroke(255, 255, 255, aVal);
      strokeWeight(2);
      rect(width / 2 - cardwidth / 2 + cardmargin / 2, 55 + cardmargin / 2,
         cardwidth - cardmargin, cardheight - cardmargin, 16);

      // 标题
      fill(255, 255, 255, aVal);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(28);
      text("Game Instructions", width / 2, 100);

      let leftXBase = width / 2 - 150; // 左侧按键
      let rightXBase = width / 2 + 50; // 右侧按键
      let startY = 185; // Y
      let keyWidth = 40;
      let keyHeight = 30;
      let horizontalSpacing = 8; // 水平
      let verticalSpacing = 36; // 垂直

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
      let midX = width / 2;
      let midY = startY;
      fill(255, 255, 255, aVal);
      textAlign(CENTER, CENTER);
      textSize(20);
      text("Move", midX, midY);

      // other keys
      let otherStartY = secondY + verticalSpacing + 20;
      let rowHeight = 39;

      const singleKeys = [
         { key: "Space", desc: "Jump" },
         { key: "F", desc: "Interact" },
         { key: "R", desc: "Restart" },
         { key: "M", desc: "Map" },
         { key: "ESC", desc: "Menu" },
         { key: "T", desc: "KeyBoards" },
         { type: "mouse", desc: "Fire Rope" },//之后记得改成左右键不同
      ];
      const leftX = width / 2 - 60;
      const leftDescX = width / 2 - 180;
      for (let i = 0; i < singleKeys.length; i++) {
         let item = singleKeys[i];
         let y = otherStartY + i * rowHeight;

         if (item.type === "mouse") {
            this.drawMouseIcon(leftX, y + 5, 25, 33, alpha);
         } else {
            let keyW = item.key === "Space" ? 80 : 50;
            this.drawKey(item.key, leftX, y, keyW, 28, alpha);
         }

         fill(255, 255, 255, aVal);
         textAlign(LEFT, CENTER);
         textSize(16);
         text(item.desc, leftDescX, y);
      }

      // sideui
      const ropeKeys = [
         { key: "1", desc: "Toggle Cyan Material" },
         { key: "2", desc: "Toggle Red Material" },
         { key: "Q", desc: "Prolong Blue Rope" },
         { key: "Z", desc: "Shorten Blue Rope" },
         { key: "E", desc: "Prolong Red Rope" },
         { key: "C", desc: "Shorten Red Rope" },
      ];

      let ropeStartY = otherStartY;
      let ropeKeyX = width / 2 + 40;
      let ropeDescX = width / 2 + 70;

      for (let i = 0; i < ropeKeys.length; i++) {
         let item = ropeKeys[i];
         let y = ropeStartY + i * rowHeight;

         this.drawKey(item.key, ropeKeyX, y, 40, 28, alpha);

         fill(255, 255, 255, aVal);
         textAlign(LEFT, CENTER);
         textSize(14);
         text(item.desc, ropeDescX, y);
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
