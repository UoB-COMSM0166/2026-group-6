let resources;
let gm;
let appState = "MENU";  // MENU | VIDEO | PLAYING 
const GAME_FONT_FAMILY = '"Monogram", monospace';
let intro;
let storyIntro;
let storyStarted = false;
let storyFinished = false;
let selectedDifficulty = "easy";
let demoVideo = null;
let audioManager;
let menuUI;

UI.setLoadingStyle();

function preload() {
   resources = new ResourceManager();
   resources.preload();
}

function setup() {
   // Disable right-click context menu
   document.oncontextmenu = () => false;
   let canvas = createCanvas(1000, 700);

   // Inject custom font styles into the document head
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

   // Canvas Styling: Center and overlay
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

   // Initialize Story Intro sequence
   storyIntro = new StoryIntro(resources, function () {
      storyFinished = true;
      resources.sounds.story?.stop();
      appState = "VIDEO";
      menuUI.playDemoVideo();
   });

   // Initialize the main intro UI
   intro = new introUI();

   if (resources.ldtkData) {
      resources.markLoaded();
      audioManager = new AudioManager(resources);
      menuUI = new MenuUI({
         resources,
         audioManager,
         intro,
         getGameManager: () => gm,
         setGameManager: (value) => { gm = value; },
         setAppState: (value) => { appState = value; }
      });
   }
}

function draw() {
   applyGameTextFont(resources);

   // Pre-story state
   if (!storyStarted) {
      background(0);
      intro.display();
      return;
   }

   // Active story sequence
   if (!storyFinished) {
      background(0);
      storyIntro.update();
      storyIntro.display();
      return;
   }

   // Video/Demo state
   if (appState === "VIDEO") {
      background(0);
      return;
   }

   // Menu state
   if (appState === "MENU") {
      background(0);
      return;
   }

   // Playing state
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
      if (storyIntro) storyIntro.handleMousePressed();
      return false;
   }

   if (appState === "PLAYING" && gm) {
      gm.onMousePressed(mouseButton);
   }
}

function keyPressed() {
   if (appState === "VIDEO") {
      menuUI?.endDemoVideo();
      return;
   }

   if (appState === "PLAYING") {
      if (keyCode === ESCAPE) { menuUI?.showMenu(); return; }
      if (gm) gm.onKeyPressed(key);
      if (key === 'H' || key === 'h') {
         menuUI?.showMenu();
         menuUI?.showMenuPage('instructions');
         return;
      }
   }
}

function mouseWheel(event) {
   if (appState === "PLAYING" && gm && gm.status === "PLAY") {
      gm.player.onMouseWheel_handleWinch(event.delta);
   }
   return false;
}
