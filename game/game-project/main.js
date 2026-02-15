// ========================================
//  p5.js 入口 — 仅负责生命周期转发
// ========================================

let game;
let ldtkData, tilesetImage;

function preload() {
   ldtkData = loadJSON('map/map-main.ldtk');
   tilesetImage = loadImage('resources/images/map_image/test_allgrid_8px.png');
}

function setup() {
   let canvas = createCanvas(1300, 750);

   // 画布样式
   canvas.style('display', 'block');
   canvas.style('margin', 'auto');  //让画面水平居中
   canvas.style('position', 'absolute');
   canvas.style('top', '50%');
   canvas.style('left', '50%');
   canvas.style('transform', 'translate(-50%, -50%)');
   // 给网页加深色背景
   document.body.style.backgroundColor = "#1a1a1a"; 
   document.body.style.margin = "0";  //消除网页边缘的空白
   document.body.style.overflow = "hidden";  // 防止出现滚动条

   canvas.elt.oncontextmenu = () => false;
   noSmooth();

   if (ldtkData) {
      game = new Game(ldtkData, tilesetImage);
      game.loadLevel();
   }
}

function draw() {
   if (!game) return;
   game.update();
   game.render();
}

function mousePressed() {
   if (game) game.onMousePressed(mouseButton);
}

function keyPressed() {
   if (game) game.onKeyPressed(key);
}
