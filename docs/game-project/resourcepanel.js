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
        this.startY = 75;
        this.maxCells = 9;

        this.attrs = [
            { label: 'MAX HP', color: [234, 57, 67], filledColor: [255, 90, 90] },
            { label: 'Jump Force', color: [234, 160, 0], filledColor: [255, 165, 0] },
            { label: 'Rope Len', color: [0, 234, 234], filledColor: [0, 255, 255] },
            { label: 'Attack Dmg', color: [234, 0, 234], filledColor: [255, 0, 255] },
        ];
    }

    toggle() {
        this.visible = !this.visible;
    }

    display(player) {
        if (!this.visible) return;

        let stats = [
            { current: player.maxHp, max: this.maxHp + 20 * this.maxCells, init: this.maxHp },
            { current: player.jumpForce, max: this.jumpForce + 0.3 * this.maxCells, init: this.jumpForce },
            { current: player.ropeL.maxLen, max: this.ropeLength + 16 * this.maxCells, init: this.ropeLength },
            { current: player.attackDmg, max: this.attackDmg + 0.5 * this.maxCells, init: this.attackDmg },
        ];

        push();

        resetMatrix();

        let px = width / 2 - this.panelW / 2;
        let py = height / 2 - this.panelH / 2;

        if (this.bgImage) {
            image(this.bgImage, px, py, this.panelW, this.panelH);
        }

        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(27);
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
            textSize(21);
            text(attr.label, px + 30, rowY + this.cellSize / 2);

            // number text
            let valStr = this.getStrofNum(stat.current) + ' / ' + this.getStrofNum(stat.max);
            textAlign(RIGHT, CENTER);
            textSize(19);
            fill(200);
            text(valStr, px + this.barOffsetX - 8, rowY + this.cellSize / 2);

            // bars
            let filledCount = (stat.max > 0)
                ? Math.round(((stat.current * 10 - stat.init * 10) / (stat.max * 10)) * this.maxCells)
                : 0;
            filledCount = constrain(filledCount, 0, this.maxCells);

            for (let c = 0; c < this.maxCells + 1; c++) {
                let cx = px + this.barOffsetX + c * (this.cellSize + this.cellGap);
                let cy = rowY + 2.5;

                if (c < filledCount + 1) {
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
        textSize(13);
        text('Press C to close', px + this.panelW / 2, py + this.panelH - 22);

        pop();
    }

    getStrofNum(num) {
        if ((num | 0) === num) {
            return num.toString();
        } else {
            return num.toFixed(1);
        }
    }
}