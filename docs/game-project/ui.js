class UI {
   static setLoadingStyle() {
      const fontLink = document.createElement('link');

      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);

      const styleTag = document.createElement('style');
      styleTag.textContent = `
      @keyframes loadingPulse {
         0%, 100% { opacity: 0.7; text-shadow: 0 0 10px #00FFCC, 0 0 30px #00FFCC; }
         50%      { opacity: 1;   text-shadow: 0 0 20px #00FFCC, 0 0 60px #00FFCC, 0 0 80px #006666; }
      }
      #p5_loading {
         font-size: 48px !important;
         font-weight: 700 !important;
         color: #00FFCC !important;
         letter-spacing: 6px !important;
         background-color: transparent !important;
         padding: 0 !important;
         border: none !important;
         position: absolute !important;
         top: 50% !important;
         left: 50% !important;
         transform: translate(-50%, -50%) !important;
         text-align: center !important;
         animation: loadingPulse 2s ease-in-out infinite !important;
         text-shadow: 0 0 15px #00FFCC, 0 0 40px #00FFCC !important;
      }
   `;
      document.head.appendChild(styleTag);
   }

   static drawHUD(player, level, gm) {
      fill(255); noStroke();
      textSize(20);
      textAlign(LEFT, TOP);

      // ── HP Bar ──
      let hpBarWidth = 100;
      hpBarWidth = hpBarWidth * player.maxHp / GameConfig.Player.MAX_HP;
      this._drawBar(
         20, 15, hpBarWidth, 22,
         player.hp, player.maxHp,
         [180, 40, 40],
         [80, 10, 10],
         [220, 60, 60],
         "HP",
         player.hp + " / " + player.maxHp
      );

      // ── CleanEnergy Bar ──
      let currentEnergy = player.cleanEnergy;
      let maxEnergy = GameConfig.Player.MAXCleanEnergy;
      let logRatio = (currentEnergy > 0) ? Math.log(1 + currentEnergy / maxEnergy) / Math.log(2) : 0;
      let energyBarWidth = 100;
      energyBarWidth = logRatio * energyBarWidth;
      this._drawBar(
         20, 48, energyBarWidth, 22,
         currentEnergy, currentEnergy,
         [30, 160, 170],
         [10, 50, 55],
         [50, 200, 210],
         "Energy",
         currentEnergy
      );

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
      if (progress <= GameConfig.World.PURIFY_CHANGE_THRESHOLD) fill("rgb(210, 205, 210)");
      else fill("rgb(13, 153, 67)");
      text(`Area${areaNumber} Purified: ${progress}%`, width / 2, 20);
      pop();

      this._drawMouseButtons(player);
   }

   static _drawBar(x, y, w, h, current, max, barColor, bgColor, borderColor, label, valueText) {
      let ratio = constrain(current / max, 0, 1);

      push();
      rectMode(CORNER);
      let textLen = 50;
      // shadow
      noStroke();
      fill(0, 0, 0, 80);
      rect(x + 2 + textLen, y + 2, w, h, 4);

      // background
      fill(bgColor[0], bgColor[1], bgColor[2], 200);
      stroke(borderColor[0], borderColor[1], borderColor[2], 180);
      strokeWeight(1.5);
      rect(x + textLen, y, w, h, 4);

      // filled portion
      noStroke();
      if (ratio > 0) {
         // gradient-like effect: brighter at top
         fill(barColor[0], barColor[1], barColor[2], 220);
         rect(x + 2 + textLen, y + 2, (w - 4) * ratio, h - 4, 3);

         // highlight strip on top half
         fill(255, 255, 255, 45);
         rect(x + 2 + textLen, y + 2, (w - 4) * ratio, (h - 4) * 0.4, 3, 3, 0, 0);
      }

      // label (left) + value (right)
      fill(barColor[0], barColor[1], barColor[2], 240);
      noStroke();
      textSize(12);
      textAlign(LEFT, CENTER);
      text(label, x + 6, y + h / 2);
      if (w > 15) {
         textAlign(RIGHT, CENTER);
         textSize(11);
         fill(255, 255, 255, 200);
         text(valueText, x + w - 5 + textLen, y + h / 2);
      }
      pop();
   }

   static _drawMouseButtons(player) {
      let cx = width / 2, by = height - 60;
      let bw = 50, bh = 40, gap = 5;
      let lActive = player.ropeL.state !== "IDLE";
      let rActive = player.ropeR.state !== "IDLE";

      push();

      textAlign(CENTER, CENTER); textSize(14);

      // 左键
      strokeWeight(player.currentRope.includes(player.ropeL) ? 5 : 2);
      if (lActive) { fill(100); stroke(150); }
      else { fill(0, 200, 200, 200); stroke(0, 255, 255); }
      beginShape();
      let lx = cx - bw - gap / 2;
      let ly = by;
      let indent = 15;
      vertex(lx, ly);
      vertex(lx + bw - indent, ly);
      vertex(lx + bw, ly + indent);
      vertex(lx + bw, ly + bh);
      vertex(lx + indent, ly + bh);
      vertex(lx, ly + bh - indent);
      endShape(CLOSE);
      fill(255); noStroke();
      text("LMB", cx - bw / 2 - gap / 2, by + bh / 2);

      // 右键
      strokeWeight(player.currentRope.includes(player.ropeR) ? 5 : 2);
      if (rActive) { fill(100); stroke(150); }
      else { fill(200, 50, 50, 200); stroke(255, 100, 100); }
      rect(cx + gap / 2, by, bw, bh, 500, 0, 500, 0);
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

      let yPos = 80 + slideOffset;

      push();
      textAlign(CENTER, CENTER);
      textSize(22);

      const lines = prompt.split('\n');
      const lineH = 30;
      const paddingX = 40;
      const paddingY = 20;

      let maxW = 0;
      for (let line of lines) {
         let w = textWidth(line);
         if (w > maxW) maxW = w;
      }

      const boxW = maxW + paddingX;
      const boxH = lineH * lines.length + paddingY;
      const boxCenterY = yPos + boxH / 2;

      // 半透明黑色背景
      noStroke();
      fill(0, 0, 0, alpha * 0.8);
      rectMode(CENTER);
      rect(width / 2, boxCenterY, boxW, boxH, 8);

      // 白色文字
      fill(255, 255, 255, alpha);
      for (let i = 0; i < lines.length; i++) {
         let ly = yPos + paddingY / 2 + lineH * i + lineH / 2;
         text(lines[i], width / 2, ly);
      }

      pop();
   }
}