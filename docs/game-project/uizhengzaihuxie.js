class UI {

   // 🟩🟩🟩 [NEW] START SEQUENCE + HELP PANEL STATE (ADD THIS BLOCK) 🟩🟩🟩
   static start = {
      phase: "COVER",          // "COVER" -> "FADING" -> "RUNNING"
      areaName: "area1",       // ✅ changeable first area name
      coverAlpha: 220,         // black overlay alpha
      titleAlpha: 255,         // title alpha
      titleYOffset: 0,         // title slide up
      fadeSpeed: 220,          // cover fade speed (alpha/sec)
      titleFadeSpeed: 260,     // title fade speed (alpha/sec)
      titleMoveSpeed: 45,      // title move speed (px/sec)

      helpShownOnce: false,    // show help once after start
      helpVisible: false,      // current visibility
      helpAlpha: 0,            // smooth alpha
      helpFadeSpeed: 520,      // alpha/sec

      areaTimer: 0,            // ms
      areaDuration: 1600       // ms (how long the first == area == shows)
   };

   // 🟩🟩🟩 [NEW] API: change first area name from elsewhere 🟩🟩🟩
   static setFirstAreaName(name) { this.start.areaName = name; }

   // 🟩🟩🟩 [NEW] API: start by left click; also click-to-close help panel 🟩🟩🟩
   static onLeftClickStart() {
      const s = this.start;
      if (s.phase === "COVER") { s.phase = "FADING"; return true; }
      if (s.phase === "RUNNING" && s.helpVisible) { s.helpVisible = false; return true; }
      return false;
   }

   // 🟩🟩🟩 [NEW] API: toggle help panel (e.g., key 'H') 🟩🟩🟩
   static toggleHelpPanel() {
      if (this.start.phase === "RUNNING") this.start.helpVisible = !this.start.helpVisible;
   }

   // 🟩🟩🟩 [NEW] update per frame: call UI.updateStartSequence(deltaTime) 🟩🟩🟩
   static updateStartSequence(dtMs) {
      const s = this.start;
      const dt = dtMs / 1000.0;

      // help alpha smooth
      const helpTarget = s.helpVisible ? 255 : 0;
      if (s.helpAlpha < helpTarget) s.helpAlpha = min(helpTarget, s.helpAlpha + s.helpFadeSpeed * dt);
      if (s.helpAlpha > helpTarget) s.helpAlpha = max(helpTarget, s.helpAlpha - s.helpFadeSpeed * dt);

      // start fade sequence
      if (s.phase === "FADING") {
         s.coverAlpha = max(0, s.coverAlpha - s.fadeSpeed * dt);
         s.titleAlpha = max(0, s.titleAlpha - s.titleFadeSpeed * dt);
         s.titleYOffset -= s.titleMoveSpeed * dt;

         if (s.coverAlpha === 0) {
            s.phase = "RUNNING";

            // auto show first area name (timer starts)
            s.areaTimer = 0;

            // auto show help panel once
            if (!s.helpShownOnce) {
               s.helpShownOnce = true;
               s.helpVisible = true;
            }
         }
      }

      // area timer runs after start
      if (s.phase === "RUNNING" && s.areaTimer < s.areaDuration) {
         s.areaTimer += dtMs;
      }
   }

   // 🟩🟩🟩 [NEW] draw cover + title (call at end of draw) 🟩🟩🟩
   static drawStartOverlay() {
      const s = this.start;
      if (s.phase !== "COVER" && s.phase !== "FADING") return;

      noStroke();
      fill(0, s.coverAlpha);
      rect(0, 0, width, height);

      push();
      textAlign(CENTER, CENTER);
      textSize(40);
      fill(255, s.titleAlpha);
      text("GAME TITLE", width / 2, height / 2 - 70 + s.titleYOffset);

      textSize(16);
      fill(210, s.titleAlpha);
      text("Left click to start", width / 2, height / 2 + s.titleYOffset);
      pop();
   }

   // 🟩🟩🟩 [NEW] draw controls help panel (call at end of draw) 🟩🟩🟩
   static drawHelpPanel() {
      const s = this.start;
      if (s.helpAlpha <= 1) return;

      const panelW = min(740, width * 0.78);
      const panelH = min(360, height * 0.62);
      const x = (width - panelW) / 2;
      const y = (height - panelH) / 2;

      // light dim
      noStroke();
      fill(0, 90 * (s.helpAlpha / 255));
      rect(0, 0, width, height);

      // panel
      fill(18, 18, 22, s.helpAlpha);
      rect(x, y, panelW, panelH, 14);

      fill(235, s.helpAlpha);
      textAlign(LEFT, TOP);
      textSize(18);
      text("Controls", x + 18, y + 16);

      textSize(14);
      fill(210, s.helpAlpha);

      const lines = [
         "W / A / S / D : Move",
         "SPACE         : Jump",
         "M             : Open Map",
         "",
         "LEFT CLICK    : Fire BLUE rope (rigid)",
         "               - Attack monsters",
         "               - Gain height for jumps",
         "",
         "RIGHT CLICK   : Fire RED rope (soft)",
         "               - Stick to walls",
         "               - Use physics to reach destinations",
         "",
         "Click anywhere to close   (Press H to toggle later)"
      ];

      let ty = y + 52;
      for (const ln of lines) {
         text(ln, x + 18, ty);
         ty += 20;
      }
   }

   static drawHUD(player, level, gm) {

      // 🟥🟥🟥 [CHANGED] Do not draw HUD before start finishes 🟥🟥🟥
      if (this.start.phase !== "RUNNING") return;

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

      // 🟩🟩🟩 [NEW] Auto first area name once after start 🟩🟩🟩
      if (this.start.areaTimer < this.start.areaDuration) {
         this.drawAreaName(`== ${this.start.areaName} ==`, this.start.areaTimer, this.start.areaDuration);
      }

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

/*
🟦🟦🟦 REQUIRED OUTSIDE CHANGES (NOT IN UI FILE) 🟦🟦🟦

1) In draw():
   UI.updateStartSequence(deltaTime);
   ... (your game draw + UI.drawHUD etc)
   UI.drawHelpPanel();
   UI.drawStartOverlay();

2) In mousePressed():
   if (mouseButton === LEFT) {
      if (UI.onLeftClickStart()) return; // consume click during start / close help
   }
   // then continue to your existing rope firing logic

3) Optional: in keyPressed():
   if (key === 'h' || key === 'H') UI.toggleHelpPanel();

4) Optional: when loading/changing level:
   UI.setFirstAreaName("area2");
*/