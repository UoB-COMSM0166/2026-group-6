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

      // LDtk __identifier
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
   display(level, gm) {
      if (!this.active) return;

      if (this.sprite) {
         // draw image(.png,.jpg)
         image(this.sprite, this.x, this.y, this.w, this.h);
      } else {
         // no sprite, use colored (defined in ldtk) rectangle
         this._drawShape(level);
      }
      if (!this.dialogOpen) return;
      let viewport = {
         x: gm.camera.x,
         y: gm.camera.y,
         w: width / gm.scale,
         h: height / gm.scale
      };
      this._drawDialog(viewport);
   }

   _drawShape() {
      fill(this.displayColor);
      noStroke();
      rect(this.x, this.y, this.w, this.h);
   }

   /**
    *
    * @param {Object} [viewport] { x, y, w, h }
    */
   _drawDialog(viewport) {
      const lines = this.dialogText.split('\n');
      const fontSize = 7;
      textSize(fontSize);
      const lineH = fontSize + 1.5;
      const padX = 6;
      const padY = 3;
      const gap = 10;
      const arrowSize = 8;
      let maxW = 0;
      for (let line of lines) {
         let w = textWidth(line);
         if (w > maxW) maxW = w;
      }
      const boxW = maxW + padX * 2;
      const boxH = lines.length * lineH + padY * 2;

      let dir = 'top';

      if (viewport) {
         const vl = viewport.x;
         const vt = viewport.y;
         const vr = viewport.x + viewport.w;
         const vb = viewport.y + viewport.h;

         const candidates = {
            top: { bx: this.cx() - boxW / 2, by: this.y - boxH - gap },
            bottom: { bx: this.cx() - boxW / 2, by: this.y + this.h + gap },
            left: { bx: this.x - boxW - gap, by: this.cy() - boxH / 2 },
            right: { bx: this.x + this.w + gap, by: this.cy() - boxH / 2 },
         };

         const order = ['top', 'bottom', 'left', 'right'];
         let bestDir = 'top';
         let bestOverflow = Infinity;

         for (let d of order) {
            let c = candidates[d];
            let overLeft = Math.max(0, vl - c.bx);
            let overRight = Math.max(0, (c.bx + boxW) - vr);
            let overTop = Math.max(0, vt - c.by);
            let overBottom = Math.max(0, (c.by + boxH) - vb);
            let total = overLeft + overRight + overTop + overBottom;

            if (total < bestOverflow) {
               bestOverflow = total;
               bestDir = d;
            }
            if (total === 0) break;
         }
         dir = bestDir;
      }

      let bx, by;
      switch (dir) {
         case 'top':
            bx = this.cx() - boxW / 2;
            by = this.y - boxH - gap;
            break;
         case 'bottom':
            bx = this.cx() - boxW / 2;
            by = this.y + this.h + gap;
            break;
         case 'left':
            bx = this.x - boxW - gap;
            by = this.cy() - boxH / 2;
            break;
         case 'right':
            bx = this.x + this.w + gap;
            by = this.cy() - boxH / 2;
            break;
      }

      if (viewport) {
         bx = Math.max(viewport.x + 2, Math.min(bx, viewport.x + viewport.w - boxW - 2));
         by = Math.max(viewport.y + 2, Math.min(by, viewport.y + viewport.h - boxH - 2));
      }

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

      const tx = this.cx();
      const ty = this.cy();

      switch (dir) {
         case 'top': {
            let ax = Math.max(bx + 6, Math.min(tx, bx + boxW - 6));
            triangle(ax - 4, by + boxH, ax + 4, by + boxH, ax, by + boxH + arrowSize);
            noStroke();
            fill(10, 10, 20, 230);
            rect(ax - 3, by + boxH - 1, 6, 3);
            break;
         }
         case 'bottom': {
            let ax = Math.max(bx + 6, Math.min(tx, bx + boxW - 6));
            triangle(ax - 4, by, ax + 4, by, ax, by - arrowSize);
            noStroke();
            fill(10, 10, 20, 230);
            rect(ax - 3, by - 1, 6, 3);
            break;
         }
         case 'left': {
            let ay = Math.max(by + 6, Math.min(ty, by + boxH - 6));
            triangle(bx + boxW, ay - 4, bx + boxW, ay + 4, bx + boxW + arrowSize, ay);
            noStroke();
            fill(10, 10, 20, 230);
            rect(bx + boxW - 1, ay - 3, 3, 6);
            break;
         }
         case 'right': {
            let ay = Math.max(by + 6, Math.min(ty, by + boxH - 6));
            triangle(bx, ay - 4, bx, ay + 4, bx - arrowSize, ay);
            noStroke();
            fill(10, 10, 20, 230);
            rect(bx - 1, ay - 3, 3, 6);
            break;
         }
      }

      noStroke();
   }
}