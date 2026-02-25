class Button extends Entity {
  constructor(x, y, w, h, spawnData = {}) {
    super(x, y, w, h, spawnData);

    this.iid = spawnData.iid || null;
    this.pressed = false;
  }

  onPlayerContact(player, gm) {
    if (this.pressed) return;
    player.setPrompt('F');
    if (keyIsDown(Keys.F)) {
      const target = this.fields?.target;
      if (!target || !target.entityIid) {
        console.warn("[Button] target missing entityIid");
        return;
      }
      this.openGateByIid(gm, target.entityIid);

      this.pressed = true;
    }
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