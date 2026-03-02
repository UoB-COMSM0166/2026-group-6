 class sideUI {
    constructor(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.visible = true;

 const singleKeys = [

    { key: "1", desc: "Change Blue Rope Texture" },
    { key: "2", desc: "Change Blue Rope Texture" },
    { key: "Q", desc: "Prolong Blue Rope" },
    { key: "Z", desc: "Shorten Blue Rope" },
    { key: "E", desc: "Prolong Red Rope" },
    { key: "C", desc: "Shorten Red Rope" },
 ];
}

toggle() { this.visible = !this.visible; }

  render() {
    if (!this.visible) return;
    push();

    // Panel background
    noStroke();
    fill(20, 20, 20, 220);
    rect(this.x, this.y, this.w, this.h, 10);

    // Title
    fill(245);
    textAlign(LEFT, TOP);
    textSize(18);
    text("Controls", this.x + 16, this.y + 14);

    // List
    textSize(12);
    fill(210);

    let yy = this.y + 46;
    const lineH = 18;

    for (const item of this.singleKeys) {
      // key badge
      fill(60, 60, 60, 230);
      rect(this.x + 16, yy + 2, 28, 16, 4);

      fill(255);
      textAlign(CENTER, TOP);
      text(item.key, this.x + 16 + 14, yy + 3);

      // description
      fill(210);
      textAlign(LEFT, TOP);
      text(item.desc, this.x + 16 + 36, yy);

      yy += lineH;
      if (yy > this.y + this.h - 20) break; // 防止溢出
    }

    pop();
  }
}