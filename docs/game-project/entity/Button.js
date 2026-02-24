class Button extends Entity {
  constructor(x, y, w, h, spawnData = {}) {
    super(x, y, w, h, spawnData);

    this.iid = spawnData.iid || null;
    this.pressed = false;
  }

  onPlayerContact(player, gm) {
    if (this.pressed) return;

    const target = this.fields?.target;
    if (!target || !target.entityIid) {
      console.warn("[Button] target missing entityIid");
      return;
    }
    gm.openGateByIid(target.entityIid);
    
    this.pressed = true;
}

  _drawShape() {
    fill(254, 174, 52);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
  }
}