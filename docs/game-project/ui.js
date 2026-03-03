class UI {

   static drawHUD(player, level, gm) {
      fill(255); noStroke();
      textSize(20);
      textAlign(LEFT, TOP);

      // player entity
      fill("rgb(161, 53, 53)");
      text("HP  " + player.hp, 25, 15);
      fill("rgb(31, 139, 143)");
      text("CleanEnergy  " + player.cleanEnergy, 25, 50);

      push();
      textAlign(CENTER, TOP);
      textSize(24);

      // 获取当前 Area 的百分比进度（0 到 100）
      let progress = gm.getAreaProgress();
      let areaNumber = level.areaNumber;
      if (areaNumber === "5") areaNumber = "Total";

      fill("rgba(29, 11, 29, 0.45)");
      // 阴影
      text(`Area${areaNumber} Purified: ${progress}%`, width / 2 + 2, 22);

      // 文字
      if (progress <= GameConfig.World.PURIFY_CHANGE_THRESHOLD) fill("rgb(119, 14, 119)");
      else fill("rgb(13, 153, 67)");
      text(`Area${areaNumber} Purified: ${progress}%`, width / 2, 20);
      pop();

      this._drawMouseButtons(player);
   }

   static _drawMouseButtons(player) {
      let cx = width / 2, by = height - 60;
      let bw = 50, bh = 40, gap = 5;
      let lActive = player.ropeL.state !== "IDLE";
      let rActive = player.ropeR.state !== "IDLE";
      let matL = player.ropeL.material;
      let matR = player.ropeR.material;

      push();

      textAlign(CENTER, CENTER); textSize(14);

      // 左键
      strokeWeight(matL === 'HARD' ? 5 : 2);
      if (lActive) { fill(100); stroke(150); }
      else { fill(0, 200, 200, 200); stroke(0, 255, 255); }
      rect(cx - bw - gap / 2, by, bw, bh, 10, 100, 0, 50);
      fill(255); noStroke();
      text("LMB", cx - bw / 2 - gap / 2, by + bh / 2);

      // 右键
      strokeWeight(matR === 'HARD' ? 5 : 2);
      if (rActive) { fill(100); stroke(150); }
      else { fill(200, 50, 50, 200); stroke(255, 100, 100); }
      rect(cx + gap / 2, by, bw, bh, 100, 10, 50, 0);
      fill(255); noStroke();
      text("RMB", cx + bw / 2 + gap / 2, by + bh / 2);

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

   static drawMapPrompt(prompt, elapsed, duration) {
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
      textSize(22);
      let tw = textWidth(prompt) + 40;
      rect(width / 2, yPos + 10, tw, 40, 8);

      // 白色区域：地图名
      fill(255, 255, 255, alpha);
      textSize(22);
      text(prompt, width / 2, yPos);

      pop();
   }
}

class SideUI {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.pad = 16;
    this.colGap = 16;
    this.rowH = 28;
  }

  render(leftList, rightList) {
    const x = this.x, y = this.y, w = this.w, h = this.h;

    push();

    // 侧边栏背景
    noStroke();
    fill(0, 0, 0, 120);
    rect(x, y, w, h);

    // 卡片
    const cx = x + this.pad;
    const cy = y + 30;
    const cw = w - this.pad * 2;
    const ch = h - 60;

    fill(25, 28, 40, 220);
    stroke(255, 255, 255, 70);
    strokeWeight(2);
    rect(cx, cy, cw, ch, 16);

    // 标题
    noStroke();
    fill(235);
    textAlign(LEFT, TOP);
    textSize(18);
    textStyle(BOLD);
    text("Controls", cx + 14, cy + 14);

    // 两列布局
    textStyle(NORMAL);
    textSize(14);

    const innerX = cx + 14;
    const innerY = cy + 54;
    const innerW = cw - 28;
    const colW = (innerW - this.colGap) / 2;

    const lx = innerX;
    const rx = innerX + colW + this.colGap;

    let yL = innerY;
    let yR = innerY;

    const drawItem = (xx, yy, item) => {
      // key cap
      fill(40, 40, 55, 230);
      stroke(255, 255, 255, 70);
      rect(xx, yy, 46, 22, 6);

      noStroke();
      fill(255);
      textAlign(CENTER, CENTER);
      text(item.key, xx + 23, yy + 11);

      // desc
      fill(235);
      textAlign(LEFT, CENTER);
      text(item.desc, xx + 58, yy + 11);

      return yy + this.rowH;
    };

    for (const it of leftList) yL = drawItem(lx, yL, it);
    for (const it of rightList) yR = drawItem(rx, yR, it);

    pop();
  }
}