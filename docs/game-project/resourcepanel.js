class Resourcepanel {
    constructor(maxHp, jumpForce, ropeLength, attackDmg) {
        this.maxHp = maxHp;
        this.jumpForce = jumpForce;
        this.ropeLength = ropeLength;
        this.attackDmg = attackDmg;

        this.visible = false;

        this.bgImage = resources.images.resourcePanelCard;

        this.panelW = 360;
        this.panelH = 300;
        this.cellSize = 12;
        this.cellGap = 2;
        this.barOffsetX = 175;
        this.rowHeight = 40;
        this.startY = 70;
        this.maxCells = 7;

        this.attrs = [
            { label: 'MAX HP', color: [234, 57, 67], filledColor: [255, 90, 90] },
            { label: 'Jump Force', color: [199, 135, 57], filledColor: [240, 180, 80] },
            { label: 'Rope Len', color: [100, 200, 100], filledColor: [140, 240, 140] },
            { label: 'Attack Dmg', color: [100, 200, 100], filledColor: [140, 240, 140] },
        ];
    }

    toggle() {
        this.visible = !this.visible;
    }

    display(player) {
        if (!this.visible) return;

        let stats = [
            { current: player.maxHp, max: this.maxHp * this.maxCells },
            { current: player.jumpForce, max: this.jumpForce * this.maxCells },
            { current: player.ropeL.maxLen, max: this.ropeLength * this.maxCells },
            { current: player.attackDmg, max: this.attackDmg * this.maxCells },
        ];

        push();
        // if there is camera transform, need resetMatrix
        resetMatrix();

        let px = width / 2 - this.panelW / 2;
        let py = height / 2 - this.panelH / 2;

        if (this.bgImage) {
            image(this.bgImage, px, py, this.panelW, this.panelH);
        }

        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(18);
        text('Player State', px + this.panelW / 2, py + 40);

        // draw attribute every row
        for (let i = 0; i < this.attrs.length; i++) {
            let attr = this.attrs[i];
            let stat = stats[i];
            let rowY = py + this.startY + i * this.rowHeight;

            // attribute name
            fill(220);
            noStroke();
            textAlign(LEFT, CENTER);
            textSize(13);
            text(attr.label, px + 30, rowY + this.cellSize / 2);

            // number text
            let valStr = Math.floor(stat.current) + ' / ' + Math.floor(stat.max);
            textAlign(RIGHT, CENTER);
            textSize(11);
            fill(200);
            text(valStr, px + this.barOffsetX - 8, rowY + this.cellSize / 2);

            // bars
            let filledCount = (stat.max > 0)
                ? Math.round((stat.current / stat.max) * this.maxCells)
                : 0;
            filledCount = constrain(filledCount, 0, this.maxCells);

            for (let c = 0; c < this.maxCells; c++) {
                let cx = px + this.barOffsetX + c * (this.cellSize + this.cellGap);
                let cy = rowY;

                if (c < filledCount) {
                    // fill bars
                    fill(attr.filledColor[0], attr.filledColor[1], attr.filledColor[2]);
                    stroke(attr.color[0], attr.color[1], attr.color[2]);
                    strokeWeight(1);
                } else {
                    // empty bars
                    fill(60, 60, 70, 160);
                    stroke(90, 90, 100, 120);
                    strokeWeight(1);
                }
                rect(cx, cy, this.cellSize, this.cellSize, 2);
            }
        }

        // bottom prompt
        noStroke();
        fill(140);
        textAlign(CENTER, CENTER);
        textSize(10);
        text('Press C to close', px + this.panelW / 2, py + this.panelH - 22);

        pop();
    }
}