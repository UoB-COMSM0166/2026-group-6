let resources;
let gm;
let appState = "MENU";  // MENU | VIDEO | PLAYING 
const GAME_FONT_FAMILY = '"Monogram", monospace';
let menuDiv;
let intro;
let storyIntro;
let storyStarted = false;
let storyFinished = false;
let selectedDifficulty = "easy";
let demoVideo = null;
let audioManager;
let instructionsMenu;

UI.setLoadingStyle();

function preload() {
   resources = new ResourceManager();
   resources.preload();
}

function setup() {
   document.oncontextmenu = () => false;
   let canvas = createCanvas(1000, 700);

   const fontStyle = document.createElement('style');
   fontStyle.textContent = `
      @font-face {
         font-family: 'Monogram';
         src: url('resources/fonts/monogram.ttf') format('truetype');
      }

      body, button, input, select, textarea {
         font-family: var(--game-font-family, 'Monogram', monospace) !important;
      }
   `;
   document.head.appendChild(fontStyle);
   updateStaticDomTranslations();

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
   applyGameTextFont(resources);

   // Cover
   // Story intro first
   storyIntro = new StoryIntro(resources, function () {
      storyFinished = true;
      resources.sounds.story?.stop();
      appState = "VIDEO";
      playDemoVideo();
   });

   // Original intro UI
   intro = new introUI();

   if (resources.ldtkData) {
      resources.markLoaded();
      audioManager = new AudioManager(resources);
   }
}

function draw() {
   applyGameTextFont(resources);

   if (!storyStarted) {
      background(0);
      intro.display();
      return;
   }

   if (!storyStarted) {
      background(0);
      intro.display();
      return;
   }

   if (!storyFinished) {
      background(0);
      storyIntro.update();
      storyIntro.display();
      return;
   }

   if (appState === "VIDEO") {
      background(0);
      return;
   }

   if (appState === "MENU") {
      background(0);
      return;
   }

   if (appState !== "PLAYING" || !gm) return;
   gm.update();
   gm.render();
}

function mousePressed() {
   if (!storyStarted) {
      storyStarted = true;
      return false;
   }

   if (!storyFinished) {
      storyIntro.handleMousePressed();
      return false;
   }

   if (appState === "PLAYING" && gm) {
      gm.onMousePressed(mouseButton);
   }
}

function keyPressed() {
   if (appState === "VIDEO") {
      endDemoVideo();
      return;
   }

   if (appState === "PLAYING") {
      if (keyCode === ESCAPE) { _showMenu(); return; }
      if (gm) gm.onKeyPressed(key);
   }
}

function mouseWheel(event) {
   if (appState === "PLAYING" && gm && gm.status === "PLAY") {
      gm.player.onMouseWheel_handleWinch(event.delta);
   }
   return false;
}
