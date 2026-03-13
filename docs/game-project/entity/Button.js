class Button extends Entity {
  constructor(x, y, w, h, spawnData = {}) {
    super(x, y, w, h, spawnData);

    this.iid = spawnData.iid || null;
    this.pressed = false;
    this.dialogText = "This button has \nalready opened \na door.";
    this.sprite = resources.images.button;
  }

  onPlayerContact(player, gm) {
    if (this.pressed) {
      this.dialogOpen = true;
      this._playerNearby = true;
      return;
    };
    player.setPrompt('F');
    if (keyIsDown(Keys.F)) {
      const target = this.fields?.target;
      if (!target || !target.entityIid) {
        console.warn("[Button] target missing entityIid");
        return;
      }
      gm.addParticles(this.cx(), this.cy());
      this.openGateByIid(gm, target.entityIid);

      this.pressed = true;
    }
  }

  update(level) {
    // close the dialog box
    if (!this._playerNearby && this.dialogOpen) {
      this.dialogOpen = false;
    }
    this._playerNearby = false;
  }

  _drawShape() {
    fill(254, 174, 52);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
  }
  /**
    * Open the GateWall with the specified IID
    */
  openGateByIid(gm, iid) {
    const gate = gm.findEntityAndLevelByIid(iid).entity;
    if (gate && typeof gate.open === "function") {
      gate.open();
      return true;
    }
    return false;
  }
}