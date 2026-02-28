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
    text("✨ Group 6 ✨", width / 2, 570);
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

  // 绘制鼠标图标：椭圆形，中间一分为二（上下），上半部分再左右分割
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

    // 中间水平分割线（将椭圆分为上下两半）
    stroke(255, 255, 255, aVal);
    strokeWeight(1.5);
    let lineY = y - h * 0.1; // 水平线略偏上，使得上下比例接近真实鼠标（上半略小）
    line(x - w / 2 + 4, lineY, x + w / 2 - 4, lineY);

    // 上半部分垂直分割线（左右两半）
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
    let leftXBase = 200; // 左侧按键区域基准X
    let rightXBase = 480; // 右侧按键区域基准X
    let startY = 200; // 起始Y
    let keyWidth = 40;
    let keyHeight = 32;
    let horizontalSpacing = 10; // 水平间距
    let verticalSpacing = 40; // 垂直间距

    // 左侧WASD布局：W放在S正上方
    let aX = leftXBase;
    let sX = leftXBase + keyWidth + horizontalSpacing;
    let dX = leftXBase + 2 * (keyWidth + horizontalSpacing);
    let wX = sX; // W的x坐标与S相同

    this.drawKey("W", wX, startY, keyWidth, keyHeight, alpha);
    let secondY = startY + verticalSpacing;
    this.drawKey("A", aX, secondY, keyWidth, keyHeight, alpha);
    this.drawKey("S", sX, secondY, keyWidth, keyHeight, alpha);
    this.drawKey("D", dX, secondY, keyWidth, keyHeight, alpha);

    // 右侧箭头布局
    let leftArrowX = rightXBase;
    let downArrowX = rightXBase + keyWidth + horizontalSpacing;
    let rightArrowX = rightXBase + 2 * (keyWidth + horizontalSpacing);
    let upX = (leftArrowX + rightArrowX) / 2;

    this.drawKey("↑", upX, startY, keyWidth, keyHeight, alpha);
    this.drawKey("←", leftArrowX, secondY, keyWidth, keyHeight, alpha);
    this.drawKey("↓", downArrowX, secondY, keyWidth, keyHeight, alpha);
    this.drawKey("→", rightArrowX, secondY, keyWidth, keyHeight, alpha);

    // 绘制中间的 "Move" 说明
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
      { type: "mouse", desc: "Fire Rope" }, // 鼠标图标
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

class UI {

   static drawHUD(player, level, gm) {
      fill(255); noStroke(); textSize(12); textAlign(LEFT, TOP);

      // player entity
      text("HP: " + player.hp, 25, 15);
      text("clean energy: " + player.cleanEnergy, 25, 30);

      let matL = player.ropeL.material;
      let matR = player.ropeR.material;

      fill(matL === 'HARD' ? 255 : color(0, 255, 255));
      text(`[1] Left Mode: ${matL}`, 10, 50);

      fill(matR === 'HARD' ? 255 : color(255, 100, 100));
      text(`[2] Right Mode: ${matR}`, 10, 70);

      push();
      textAlign(CENTER, TOP);
      textSize(24);

      // 获取当前 Area 的百分比进度（0 到 100）
      let percentage = gm.getAreaProgress();
      let areaNumber = level.areaNumber;
      if (areaNumber === "5") areaNumber = "Total";

      fill(0, 150);
      // 阴影
      text(`Area${areaNumber} Purified: ${percentage}%`, width / 2 + 2, 22);

      // 文字
      fill(200, 100, 255);
      text(`Area${areaNumber} Purified: ${percentage}%`, width / 2, 20);
      pop();

      this._drawMouseButtons(player);

      textAlign(CENTER); fill(150); textSize(12);
      text("[SPACE] Jump   [Q/Z] Left Winch   [E/C] Right Winch", width / 2, height - 16);
   }

   static _drawMouseButtons(player) {
      let cx = width / 2, by = height - 60;
      let bw = 50, bh = 40, gap = 5;
      let lActive = player.ropeL.state !== "IDLE";
      let rActive = player.ropeR.state !== "IDLE";

      push();
      strokeWeight(2); textAlign(CENTER, CENTER); textSize(14);

      // 左键
      if (lActive) { fill(100); stroke(150); }
      else { fill(0, 200, 200, 200); stroke(0, 255, 255); }
      rect(cx - bw - gap / 2, by, bw, bh, 10, 100, 0, 50);
      fill(255); noStroke();
      text("LMB", cx - bw / 2 - gap / 2, by + bh / 2);
      textSize(10); fill(0, 255, 255);
      text("CYAN ROPE", cx - bw / 2 - gap / 2, by - 15);

      // 右键
      strokeWeight(2); textSize(14);
      if (rActive) { fill(100); stroke(150); }
      else { fill(200, 50, 50, 200); stroke(255, 100, 100); }
      rect(cx + gap / 2, by, bw, bh, 100, 10, 50, 0);
      fill(255); noStroke();
      text("RMB", cx + bw / 2 + gap / 2, by + bh / 2);
      textSize(10); fill(255, 100, 100);
      text("RED ROPE", cx + bw / 2 + gap / 2, by - 15);

      pop();
   }

   static drawWinScreen() {
      background(0, 150);
      fill(255); textAlign(CENTER); textSize(40);
      text("YOU WON!", width / 2, height / 2);
   }

   static drawGameOverScreen() {
      background(50, 0, 0, 150);
      fill(255); textAlign(CENTER); textSize(40);
      text("DIED", width / 2, height / 2);
      textSize(20); text("Press R to Restart", width / 2, height / 2 + 50);
   }

   static drawAreaName(name, elapsed, duration) {
      let fadeIn = 700;    // 0.7秒
      let fadeOut = 800;   // 0.8秒
      let remaining = duration - elapsed;

      let alpha;
      // apear
      if (elapsed < fadeIn) {
         alpha = map(elapsed, 0, fadeIn, 0, 255);
      }
      // disappear
      else if (remaining < fadeOut) {
         alpha = map(remaining, 0, fadeOut, 0, 255);
      }
      else {
         alpha = 255;
      }

      let slideOffset = 0;
      if (elapsed < fadeIn) {
         slideOffset = map(elapsed, 0, fadeIn, -20, 0);
      }

      let yPos = 50 + slideOffset;

      push();
      textAlign(CENTER, TOP);

      // 半透明黑色背景条
      noStroke();
      fill(0, 0, 0, alpha * 0.4);
      rectMode(CENTER);
      rect(width / 2, yPos + 10, 250, 40, 8);

      // 白色区域：地图名
      fill(255, 255, 255, alpha);
      textSize(22);
      text(name, width / 2, yPos);

      pop();
   }
}
