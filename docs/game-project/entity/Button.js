class Button extends Entity {
  constructor(x, y, w, h, spawnData = {}) {
    super(x, y, w, h, spawnData);

    this.iid = spawnData.iid || null;
    this.pressed = false;
    this.dialogW = 40;
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
    // 玩家离开后自动关闭对话框
    if (!this._playerNearby && this.dialogOpen) {
      this.dialogOpen = false;
    }
    // 每帧重置接触标志（由 onPlayerContact 在接触时置 true）
    this._playerNearby = false;
  }

  _drawShape() {
    fill(254, 174, 52);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
  }
  /**
    * 打开指定 iid 的 GateWall
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