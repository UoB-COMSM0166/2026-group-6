class UI {

   static drawHUD(player) {
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
      textSize(20); text("Press R to Restart", width / 2, height / 2 + 50);
   }

   static drawGameOverScreen() {
      background(50, 0, 0, 150);
      fill(255); textAlign(CENTER); textSize(40);
      text("DIED", width / 2, height / 2);
      textSize(20); text("Press R to Restart", width / 2, height / 2 + 50);
   }
}
