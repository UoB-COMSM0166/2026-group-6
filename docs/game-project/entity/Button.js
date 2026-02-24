class Button extends Entity {
  constructor(x, y, w, h, spawnData = {}) {
    super(x, y, w, h, spawnData);

    this.iid = spawnData.iid || null;
    this.pressed = false;
  }

  onPlayerContact(player, gm) {
    if (this.pressed) return;
    this.pressed = true;

    const t = this.fields?.target;

    // 兼容不同结构
    const targetIid = t?.entityIid || t?.iid || t?.__iid ||
      t?.entity?.iid || t?.ref?.entityIid || null;

    if (!targetIid) {
      return;
    }

    // 全局打开门支持门在别的 level
    const ok = gm.openGateByIid(targetIid);
  }

  _drawShape() {
    fill(254, 174, 52);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
  }
}