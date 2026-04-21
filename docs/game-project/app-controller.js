class AppController {
   constructor() {
      this.resources = null;
      this.gm = null;
      this.appState = "MENU";
      this.intro = null;
      this.storyIntro = null;
      this.storyStarted = false;
      this.storyFinished = false;
      this.audioManager = null;
      this.menuUI = null;

      UI.setLoadingStyle();
      this._syncGlobals();
   }

   preload() {
      this.resources = new ResourceManager();
      this.resources.preload();
      this._syncGlobals();
   }

   setup() {
      document.oncontextmenu = () => false;
      const canvas = createCanvas(1000, 700);

      this._injectGlobalFontStyle();
      this._styleCanvas(canvas);

      noSmooth();
      updateStaticDomTranslations();
      applyGameTextFont(this.resources);

      this.storyIntro = new StoryIntro(this.resources, () => {
         this.storyFinished = true;
         this.resources.sounds.story?.stop();
         this.appState = "VIDEO";
         this.menuUI.playDemoVideo();
         this._syncGlobals();
      });

      this.intro = new introUI();

      if (this.resources?.ldtkData) {
         this.resources.markLoaded();
         this.audioManager = new AudioManager(this.resources);
         this.menuUI = new MenuUI({
            resources: this.resources,
            audioManager: this.audioManager,
            intro: this.intro,
            getGameManager: () => this.gm,
            setGameManager: (value) => {
               this.gm = value;
               this._syncGlobals();
            },
            setAppState: (value) => {
               this.appState = value;
               this._syncGlobals();
            }
         });
      }

      this._syncGlobals();
   }

   draw() {
      applyGameTextFont(this.resources);

      if (!this.storyStarted) {
         background(0);
         this.intro?.display();
         return;
      }

      if (!this.storyFinished) {
         background(0);
         this.storyIntro?.update();
         this.storyIntro?.display();
         return;
      }

      if (this.appState === "VIDEO" || this.appState === "MENU") {
         background(0);
         return;
      }

      if (this.appState !== "PLAYING" || !this.gm) return;

      this.audioManager?.updateGameplayAudio(this.gm, this.appState);
      this.gm.update();
      this.gm.render();
   }

   mousePressed() {
      if (!this.storyStarted) {
         this.storyStarted = true;
         this._syncGlobals();
         return false;
      }

      if (!this.storyFinished) {
         this.storyIntro?.handleMousePressed();
         return false;
      }

      if (this.appState === "PLAYING" && this.gm) {
         this.gm.onMousePressed(mouseButton);
      }
   }

   keyPressed(keyValue, keyCodeValue) {
      if (this.appState === "VIDEO") {
         this.menuUI?.endDemoVideo();
         return;
      }

      if (this.appState === "PLAYING") {
         if (keyCodeValue === ESCAPE) {
            this.menuUI?.showMenu();
            return;
         }
         this.gm?.onKeyPressed(keyValue);
         if (keyValue === 'H' || keyValue === 'h') {
            this.menuUI?.showMenu();
            this.menuUI?.showMenuPage('instructions');
         }
      }
   }

   mouseWheel(event) {
      if (this.appState === "PLAYING" && this.gm && this.gm.status === "PLAY") {
         this.gm.player.onMouseWheel_handleWinch(event.delta);
      }
      return false;
   }

   _injectGlobalFontStyle() {
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
   }

   _styleCanvas(canvas) {
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
   }

   _syncGlobals() {
      globalThis.app = this;
      globalThis.resources = this.resources;
      globalThis.gm = this.gm;
      globalThis.appState = this.appState;
      globalThis.intro = this.intro;
      globalThis.storyIntro = this.storyIntro;
      globalThis.audioManager = this.audioManager;
      globalThis.menuUI = this.menuUI;
   }
}
