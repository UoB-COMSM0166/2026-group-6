// =============================================
//  p5.js 入口 — 仅转发生命周期, 零逻辑
// =============================================

let resources;
let gm;  // GameManager

function preload() {
   resources = new ResourceManager();
   resources.preload();
}

function setup() {
   let canvas = createCanvas(1300, 750);

   canvas.style('display', 'block');
   canvas.style('margin', 'auto');
   canvas.style('position', 'absolute');
   canvas.style('top', '50%');
   canvas.style('left', '50%');
   canvas.style('transform', 'translate(-50%, -50%)');

   document.body.style.backgroundColor = "#1a1a1a";
   document.body.style.margin = "0";
   document.body.style.overflow = "hidden";

   canvas.elt.oncontextmenu = () => false;
   noSmooth();

   if (resources.ldtkData) {
      resources.markLoaded();
      gm = new GameManager(resources);
      gm.loadLevel();
   }
}

function draw() {
   if (!gm) return;
   gm.update();
   gm.render();
}

function mousePressed() {
   if (gm) gm.onMousePressed(mouseButton);
}

function keyPressed() {
   if (gm) gm.onKeyPressed(key);
}
