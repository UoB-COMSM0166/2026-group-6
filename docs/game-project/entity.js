class Entity {
   /**
    * @param {number} x  pixel coordinates x
    * @param {number} y  pixel coordinates y
    * @param {number} w  width(pixel)
    * @param {number} h  hight(pixel)
    * @param {Object} [spawnData]  LDtk original data
    */
   constructor(x, y, w, h, spawnData = {}) {
      // position and size
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;

      // state
      this.active = true;

      // LDtk  __identifier
      this.type = spawnData.identifier || 'Entity';

      // color in LDtk
      this.displayColor = spawnData.color || '#2600ff';

      // image placeholder
      this.sprite = null;

      // LDtk Custom field
      this.fields = spawnData.fields || {};

      this.dialogOpen = false;
      this._playerNearby = false;
      this.dialogText;
      // LDtk Entity uniqueness id
      this.iid = spawnData.iid || null;
   }

   // center

   cx() { return this.x + this.w / 2; }
   cy() { return this.y + this.h / 2; }

   // Lifecycle

   get isDead() { return !this.active; }

   // The example of this class will be deleted after marked
   destroy() { this.active = false; }

   // Collision detection

   /**
    * @param {Player} player
    * @returns {boolean}
    */
   isTouchingPlayer(player) {
      if (!this.active) return false;
      return Physics.rectIntersect(
         this.x, this.y, this.w, this.h,
         player.x, player.y, player.w + 0.1, player.h + 0.1
      );
   }

   /**
    * @param {Player} player
    * @param {GameManager} gm
    */
   onPlayerContact(player, gm) {

   }

   /**
    * @param {Player} player
    * @param {Rope} rope
    * @returns {boolean}
    */
   isTouchingRope(rope, player) {
      if (!this.active) return false;
      if (rope.state === "IDLE" || rope.state === "RETRACTING") return false;
      let tip = rope.getTip(player);
      return Physics.pointRect(tip.x, tip.y, this.x, this.y, this.w, this.h);
   }

   /**
    * @param {Player} player
    * @param {Rope} rope
    * @param {GameManager} gm
    */
   onRopeContact(rope, player, gm) {

   }

   /**
    * @param {LevelManager} level
    */
   update(level) {

   }

   // render
   display(level) {
      if (!this.active) return;

      if (this.sprite) {
         // draw image(.png,.jpg)
         image(this.sprite, this.x, this.y, this.w, this.h);
      } else {
         // no sprite, use colored (defined in ldtk) rectangle
         this._drawShape(level);
      }
      if (!this.dialogOpen) return;

      this._drawDialog();
   }

   _drawShape() {
      fill(this.displayColor);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
   }

   _drawDialog() {
      const lines = this.dialogText.split('\n');
      const fontSize = 7;
      textSize(fontSize);
      const lineH = fontSize + 1.5;
      const padX = 6;
      const padY = 3;

      let maxW = 0;
      for (let line of lines) {
         let w = textWidth(line);
         if (w > maxW) maxW = w;
      }
      const boxW = maxW + padX * 2;

      const boxH = lines.length * lineH + padY * 2;

      // center top
      const bx = this.cx() - boxW / 2;
      const by = this.y - boxH - 10;

      // shadow
      fill(0, 0, 0, 100);
      noStroke();
      rect(bx + 2, by + 2, boxW, boxH, 3);

      // main background
      fill(10, 10, 20, 230);
      stroke(180, 140, 255);
      strokeWeight(1);
      rect(bx, by, boxW, boxH, 3);

      // text
      fill(230, 210, 255);
      noStroke();
      textAlign(LEFT, TOP);
      for (let i = 0; i < lines.length; i++) {
         text(lines[i], bx + padX, by + padY + i * lineH);
      }

      // tile
      fill(10, 10, 20, 230);
      stroke(180, 140, 255);
      strokeWeight(1);
      let tx = this.cx();
      triangle(
         tx - 4, by + boxH,
         tx + 4, by + boxH,
         tx, by + boxH + 8
      );

      noStroke();
      fill(10, 10, 20, 230);
      rect(tx - 3, by + boxH - 1, 6, 3);
   }
}
