class EndingButton extends Entity {
   constructor(x, y, w, h, spawnData) {
      super(x, y, w, h, spawnData);
      this.dialogText = "start to leave earth";
      this._playerNearby = false;  // 本帧玩家是否接触（每帧重置）
   }

   onPlayerContact(player, gm) {
      player.setPrompt('F');
      let progress = gm.getAreaProgress();
      if (progress >= 90) this._endding1(gm);
      else if (progress >= 60) this._endding2(gm);
      else this._endding3(gm);
      if (keyIsDown(Keys.F)) {
         gm.status = "WIN";
      }
   }

   display() {
      super.display();

      if (!this.dialogOpen) return;

      this._drawDialog();
   }

   update(level) {
      // 玩家离开后自动关闭对话框
      if (!this._playerNearby && this.dialogOpen) {
         this.dialogOpen = false;
      }
      // 每帧重置接触标志（由 onPlayerContact 在接触时置 true）
      this._playerNearby = false;
   }

   _endding1(gm) {
      this.dialogText = "You have almost cleared all the pollution. \nStay and continue to purify the world.";
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _endding2(gm) {
      this.dialogText = "Good! There are also some pollution but \nlet us shoot to the space now.";
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _endding3(gm) {
      this.dialogText = "Start to leave earth!";
      if (!this.dialogOpen) this.dialogOpen = true;
   }

   _drawDialog() {
      const lines = this.dialogText.split('\n');
      const fontSize = 4;
      const lineH = fontSize + 1.5;
      const padX = 3;
      const padY = 3;
      const boxW = 85;
      const boxH = lines.length * lineH + padY * 2;

      // 对话框居中于画作上方
      const bx = this.cx() - boxW / 2;
      const by = this.y - boxH - 10;

      // ── 外框阴影（伪投影）──
      fill(0, 0, 0, 100);
      noStroke();
      rect(bx + 2, by + 2, boxW, boxH, 3);

      // ── 主体背景 ──
      fill(10, 10, 20, 230);
      stroke(180, 140, 255);
      strokeWeight(1);
      rect(bx, by, boxW, boxH, 3);


      // ── 文字 ──
      fill(230, 210, 255);
      noStroke();
      textAlign(LEFT, TOP);
      textSize(fontSize);
      for (let i = 0; i < lines.length; i++) {
         text(lines[i], bx + padX + 3, by + padY + i * lineH);
      }

      // ── 尾巴（三角形指向画作）──
      fill(10, 10, 20, 230);
      stroke(180, 140, 255);
      strokeWeight(1);
      let tx = this.cx();
      triangle(
         tx - 4, by + boxH,
         tx + 4, by + boxH,
         tx, by + boxH + 8
      );
      // 遮掉尾巴与框之间的边框线
      noStroke();
      fill(10, 10, 20, 230);
      rect(tx - 3, by + boxH - 1, 6, 3);
   }
}