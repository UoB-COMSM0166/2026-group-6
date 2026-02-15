class UI {

   static drawHUD(player) {
      let matL = player.ropeL.material;
      let matR = player.ropeR.material;

      fill(255); noStroke(); textSize(12); textAlign(LEFT, TOP);
      text("HP: " + player.hp, 25, 10);

      // 左绳状态
      fill(matL === 'HARD' ? 255 : color(0, 255, 255));
      text(`[1] Left Mode: ${matL}`, 10, 30);

      // 右绳状态
      fill(matR === 'HARD' ? 255 : color(255, 100, 100));
      text(`[2] Right Mode: ${matR}`, 10, 50);

      // 鼠标按钮提示
      this._drawMouseButtons(player);

      // 底部操作提示
      textAlign(CENTER); fill(150); textSize(12);
      text("[SPACE] Jump   [Q/Z] Left Winch   [E/C] Right Winch", width / 2, height - 16);
   }

   static _drawMouseButtons(player) {
      let uiCenterX = width / 2;
      let uiBottomY = height - 60;
      let btnW = 50;
      let btnH = 40;
      let gap = 5;

      let isLeftActive = player.ropeL.state !== "IDLE";
      let isRightActive = player.ropeR.state !== "IDLE";

      push();
      strokeWeight(2);
      textAlign(CENTER, CENTER);
      textSize(14);

      // 左键
      if (isLeftActive) { fill(100); stroke(150); }
      else { fill(0, 200, 200, 200); stroke(0, 255, 255); }
      rect(uiCenterX - btnW - gap / 2, uiBottomY, btnW, btnH, 10, 100, 0, 50);
      fill(255); noStroke();
      text("LMB", uiCenterX - btnW / 2 - gap / 2, uiBottomY + btnH / 2);
      textSize(10); fill(0, 255, 255);
      text("CYAN ROPE", uiCenterX - btnW / 2 - gap / 2, uiBottomY - 15);

      // 右键
      strokeWeight(2); textSize(14);
      if (isRightActive) { fill(100); stroke(150); }
      else { fill(200, 50, 50, 200); stroke(255, 100, 100); }
      rect(uiCenterX + gap / 2, uiBottomY, btnW, btnH, 100, 10, 50, 0);
      fill(255); noStroke();
      text("RMB", uiCenterX + btnW / 2 + gap / 2, uiBottomY + btnH / 2);
      textSize(10); fill(255, 100, 100);
      text("RED ROPE", uiCenterX + btnW / 2 + gap / 2, uiBottomY - 15);

      pop();
   }

   static drawWinScreen() {
      background(0, 150);
      fill(255); textAlign(CENTER); textSize(40);
      text("YOU WON!", width / 2, height / 2);
      textSize(20);
      text("Press R to Restart", width / 2, height / 2 + 50);
   }

   static drawGameOverScreen() {
      background(50, 0, 0, 150);
      fill(255); textAlign(CENTER); textSize(40);
      text("DIED", width / 2, height / 2);
      textSize(20);
      text("Press R to Restart", width / 2, height / 2 + 50);
   }
}
