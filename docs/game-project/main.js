let resources;
let gm;
let appState = "MENU";  // MENU | PLAYING
let menuDiv;
let intro;
let started = false;

function preload() {
   resources = new ResourceManager();
   resources.preload();
}

function setup() {
   let canvas = createCanvas(1000, 700);
   canvas.parent("game-container");

   canvas.style('display', 'block');
   canvas.style('margin', 'auto');

   document.body.style.backgroundColor = "#1a1a1a";
   document.body.style.margin = "0";
   document.body.style.overflow = "hidden";

   canvas.elt.oncontextmenu = () => false;
   noSmooth();
   //Cover
   intro = new introUI();
   if (resources.ldtkData) {
      resources.markLoaded();
   }
}

function draw() {
   const controls = document.getElementById("controls-ui");

   if (controls) {
      controls.style.display = (appState === "PLAYING") ? "block" : "none";
   }

   //start
   if (!started) {
      background(0);
      intro.updateTransition();
      intro.display();
      return;
   }
   if (appState !== "PLAYING" || !gm) return;
   gm.update();
   gm.render();
}

function mousePressed() {
   //UI part
   if (!started) {
      if (intro.transition < 1) {
         intro.startTransition();
      } else {
         started = true;
         _createMenu();
      }
      return false;
   }
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
      'position:fixed; top:50%; left:50%; width:750px; height:525px;' +
      'transform:translate(-50%,-50%);' +
      'display:flex; flex-direction:column; justify-content:center; align-items:center;' +
      'gap:20px; background:#1a1a2e; z-index:10;';

   let btnStart = _makeBtn('Start Game', function () {
      if (!resources.sounds.click.isPlaying()) resources.sounds.click.play();
      gm = null;
      gm = new GameManager(resources);
      gm.loadLevel();
      _hideMenu();
   });

   let btnContinue = _makeBtn('Continue Game', function () {
      if (!resources.sounds.click.isPlaying()) resources.sounds.click.play();
      if (!gm) return;
      _hideMenu();
   });
   btnContinue.id = 'btn-continue';
   btnContinue.style.opacity = '0.3';
   btnContinue.style.pointerEvents = 'none';

   _makeBtn('Leave the Game', function () {
   if (!resources.sounds.click.isPlaying())
      resources.sounds.click.play();
      
      //leave the game
      gm = null;

      intro.transition = 0;
      intro.isTransitioning = false;
      _hideMenu();
   });



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