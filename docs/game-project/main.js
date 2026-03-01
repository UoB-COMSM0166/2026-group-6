let resources;
let gm;
let appState = "MENU";  // MENU | PLAYING
let menuDiv;

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
   }

   _createMenu();
}

function draw() {
   if (appState !== "PLAYING" || !gm) return;
   gm.update();
   gm.render();
}

function mousePressed() {
   if (appState === "PLAYING" && gm) gm.onMousePressed(mouseButton);
}

function keyPressed() {
   if (appState === "PLAYING") {
      if (keyCode === ESCAPE) { _showMenu(); return; }
      if (gm) gm.onKeyPressed(key);
   }
}


function _createMenu() {
   menuDiv = document.createElement('div');
   menuDiv.id = 'game-menu';
   menuDiv.style.cssText =
      'position:fixed; top:0; left:0; width:100%; height:100%;' +
      'display:flex; flex-direction:column; justify-content:center; align-items:center;' +
      'gap:20px; background:#1a1a2e; z-index:10;';

   let btnStart = _makeBtn('Start Game', function () {
      gm = null;
      gm = new GameManager(resources);
      gm.loadLevel();
      _hideMenu();
   });

   let btnContinue = _makeBtn('Continue Game', function () {
      if (!gm) return;
      _hideMenu();
   });
   btnContinue.id = 'btn-continue';
   btnContinue.style.opacity = '0.3';
   btnContinue.style.pointerEvents = 'none';

   menuDiv.appendChild(btnStart);
   menuDiv.appendChild(btnContinue);
   document.body.appendChild(menuDiv);
}

function _makeBtn(label, onClick) {
   let btn = document.createElement('button');
   btn.textContent = label;
   btn.style.cssText =
      'width:280px; height:60px; font-size:24px; font-weight:bold; color:#fff;' +
      'background:#1eb47a; border:none; border-radius:12px; cursor:pointer;' +
      'transition: background 0.2s;';
   btn.onmouseenter = function () { btn.style.background = '#32d696'; };
   btn.onmouseleave = function () { btn.style.background = '#1eb47a'; };
   btn.onclick = onClick;
   return btn;
}

function _hideMenu() {
   menuDiv.style.display = 'none';
   appState = "PLAYING";
}

function _showMenu() {
   if (gm) {
      let bc = document.getElementById('btn-continue');
      bc.style.opacity = '1';
      bc.style.pointerEvents = 'auto';
   }
   menuDiv.style.display = 'flex';
   appState = "MENU";
}