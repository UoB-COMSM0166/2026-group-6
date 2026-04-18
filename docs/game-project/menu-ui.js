class MenuUI {
   constructor({ resources, audioManager, intro, getGameManager, setGameManager, setAppState }) {
      this.resources = resources;
      this.audioManager = audioManager;
      this.intro = intro;
      this.getGameManager = getGameManager;
      this.setGameManager = setGameManager;
      this.setAppState = setAppState;

      this.BTN_NORMAL = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png';
      this.BTN_HOVER = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png';
      this.BTN_ACTIVE = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Active.png';

      this.menuRefs = null;
      this.currentMenuPage = 'main';
      this.menuDiv = null;
      this.demoVideo = null;
      this.demoVideoPlayToken = 0;
      this.instructionsMenu = null;
      this.selectedDifficulty = 'easy';

      onLanguageChanged(() => this.refreshLanguage());
   }

   showMenuPage(page) {
      const mainPanel = document.getElementById('menu-main-panel');
      const difficultyPanel = document.getElementById('menu-difficulty-panel');
      const audioPanel = document.getElementById('menu-audio-panel');
      const languagePanel = document.getElementById('menu-language-panel');
      const backBtn = document.getElementById('menu-back-btn');

      if (!mainPanel || !difficultyPanel || !audioPanel || !languagePanel || !backBtn) return;
      this.currentMenuPage = page;

      mainPanel.style.display = 'none';
      difficultyPanel.style.display = 'none';
      audioPanel.style.display = 'none';
      languagePanel.style.display = 'none';
      this.instructionsMenu?.hide();

      if (page === 'main') {
         mainPanel.style.display = 'flex';
         backBtn.style.display = 'none';
      } else if (page === 'difficulty') {
         difficultyPanel.style.display = 'flex';
         backBtn.style.display = 'block';
      } else if (page === 'audio') {
         audioPanel.style.display = 'flex';
         backBtn.style.display = 'block';
      } else if (page === 'language') {
         languagePanel.style.display = 'flex';
         backBtn.style.display = 'block';
      } else if (page === 'instructions') {
         this.ensureInstructionsMenu();
         this.instructionsMenu?.show();
         backBtn.style.display = 'block';
      }
   }

   ensureInstructionsMenu() {
      if (this.instructionsMenu || !this.menuDiv) return;

      this.instructionsMenu = new InstructionsMenu({
         buttonImages: {
            normal: this.BTN_NORMAL,
            hover: this.BTN_HOVER,
            active: this.BTN_ACTIVE
         },
         onPlayClickSound: () => {
            this._playClickSound();
         },
         onReplayStory: () => {
            this.replayStoryPreview();
         },
         onReplayTutorialVideo: () => {
            this.playDemoVideo();
         }
      });
      this.instructionsMenu.attachTo(this.menuDiv);
   }

   refreshLanguage() {
      if (!this.menuRefs) return;

      this.menuRefs.backBtn.textContent = t('menu.back');
      this.menuRefs.backBtn.style.setProperty(
         'font-size',
         getLanguage() === 'zh' ? '30px' : '34px',
         'important'
      );
      this.menuRefs.btnStart.textContent = t('menu.start');
      this.menuRefs.btnContinue.textContent = t('menu.continue');
      this.menuRefs.btnDifficulty.textContent = t('menu.difficulty');
      this.menuRefs.btnAudio.textContent = t('menu.audio');
      this.menuRefs.btnLanguage.textContent = t('menu.language');
      this.menuRefs.btnInstructions.textContent = t('menu.instructions');
      this.menuRefs.difficultyTitle.textContent = t('menu.difficultyTitle');
      this.menuRefs.audioTitle.textContent = t('menu.audioTitle');
      this.menuRefs.languageTitle.textContent = t('menu.languageTitle');
      this._applyMenuTitleSize(this.menuRefs.difficultyTitle);
      this._applyMenuTitleSize(this.menuRefs.audioTitle);
      this._applyMenuTitleSize(this.menuRefs.languageTitle);
      this.menuRefs.bgmLabel.textContent = t('menu.background');
      this.menuRefs.sfxLabel.textContent = t('menu.sounds');
      const audioLabelSize = getLanguage() === 'zh' ? '18px' : '38px';
      this.menuRefs.bgmLabel.style.setProperty('font-size', audioLabelSize, 'important');
      this.menuRefs.sfxLabel.style.setProperty('font-size', audioLabelSize, 'important');
      this.menuRefs.btnEasy.textContent = t('menu.easy');
      this.menuRefs.btnMedium.textContent = t('menu.medium');
      this.menuRefs.btnHard.textContent = t('menu.hard');
      this.menuRefs.btnEnglish.textContent = t('menu.english');
      this.menuRefs.btnChinese.textContent = t('menu.chinese');
      this._applyMenuButtonSize(this.menuRefs.btnStart);
      this._applyMenuButtonSize(this.menuRefs.btnContinue);
      this._applyMenuButtonSize(this.menuRefs.btnDifficulty);
      this._applyMenuButtonSize(this.menuRefs.btnAudio);
      this._applyMenuButtonSize(this.menuRefs.btnLanguage);
      this._applyMenuButtonSize(this.menuRefs.btnInstructions);
      this._applyMenuSubButtonSize(this.menuRefs.btnEasy);
      this._applyMenuSubButtonSize(this.menuRefs.btnMedium);
      this._applyMenuSubButtonSize(this.menuRefs.btnHard);
      this._applyMenuSubButtonSize(this.menuRefs.btnEnglish);
      this._applyMenuSubButtonSize(this.menuRefs.btnChinese);
      this._setInactiveSelectBtn(this.menuRefs.btnEnglish);
      this._setInactiveSelectBtn(this.menuRefs.btnChinese);
      if (getLanguage() === 'zh') this._setActiveSelectBtn(this.menuRefs.btnChinese);
      else this._setActiveSelectBtn(this.menuRefs.btnEnglish);

      this.instructionsMenu?.refreshLanguage?.();
      this.showMenuPage(this.currentMenuPage);
   }

   createMenu() {
      if (this.menuDiv) return;

      this.menuDiv = document.createElement('div');
      this.menuDiv.id = 'game-menu';
      this.menuDiv.style.cssText =
         'position:fixed; top:50%; left:50%; width:1000px; height:700px;' +
         'transform:translate(-50%,-50%);' +
         'display:flex; flex-direction:column; justify-content:center; align-items:center;' +
         'gap:20px;' +
         'background-image:linear-gradient(rgba(5,10,30,0.35), rgba(5,10,30,0.35)), url("resources/images/UI_resources/Background_space.png");' +
         'background-size:cover;' +
         'background-position:center;' +
         'background-repeat:no-repeat;' +
         'z-index:10;';

      const backBtn = document.createElement('button');
      backBtn.id = 'menu-back-btn';
      backBtn.textContent = t('menu.back');
      backBtn.style.cssText =
         'display:none;' +
         'position:absolute; top:30px; left:30px;' +
         'width:180px; height:60px; font-size:30px; font-weight:bold; color:white;' +
         'font-family:var(--game-font-family), monospace;' +
         `background-image:url("${this.BTN_NORMAL}");` +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'background-color:transparent;' +
         'border:none; cursor:pointer;' +
         'transition:all 0.2s;' +
         'z-index:100;';

      backBtn.onmouseenter = () => {
         backBtn.style.backgroundImage = `url("${this.BTN_HOVER}")`;
      };
      backBtn.onmouseleave = () => {
         backBtn.style.backgroundImage = `url("${this.BTN_NORMAL}")`;
      };
      backBtn.onmousedown = () => {
         backBtn.style.backgroundImage = `url("${this.BTN_ACTIVE}")`;
      };
      backBtn.onmouseup = () => {
         backBtn.style.backgroundImage = `url("${this.BTN_HOVER}")`;
      };
      backBtn.onclick = (e) => {
         e.preventDefault();
         e.stopPropagation();
         this._playClickSound();
         this.showMenuPage('main');
      };
      this.menuDiv.appendChild(backBtn);

      const mainPanel = document.createElement('div');
      mainPanel.id = 'menu-main-panel';
      mainPanel.style.cssText =
         'display:flex; flex-direction:column; align-items:center; gap:20px;';

      const btnStart = this._makeBtn(t('menu.start'), (e) => {
         if (e) {
            e.preventDefault();
            e.stopPropagation();
         }

         this.resources.sounds.story?.stop();
         this.hideMenu();
         this.setGameManager(new GameManager(this.resources, this.selectedDifficulty));

         if (this.resources.sounds.bgm && !this.resources.sounds.bgm.isPlaying()) {
            this.resources.sounds.bgm.loop();
         }
      });

      const btnContinue = this._makeBtn(t('menu.continue'), (e) => {
         if (e) {
            e.preventDefault();
            e.stopPropagation();
         }

         this._playClickSound();
         if (!this.getGameManager()) return;

         this.resources.sounds.story?.stop();
         this.hideMenu();
         if (this.resources.sounds.bgm && !this.resources.sounds.bgm.isPlaying()) {
            this.resources.sounds.bgm.loop();
         }
      });

      btnContinue.id = 'btn-continue';
      btnContinue.style.opacity = '0.3';
      btnContinue.style.pointerEvents = 'none';

      const btnDifficulty = this._makeBtn(t('menu.difficulty'), (e) => {
         e.preventDefault();
         e.stopPropagation();
         this._playClickSound();
         this.showMenuPage('difficulty');
      });

      const btnAudio = this._makeBtn(t('menu.audio'), (e) => {
         e.preventDefault();
         e.stopPropagation();
         this._playClickSound();
         this.showMenuPage('audio');
      });

      const btnLanguage = this._makeBtn(t('menu.language'), (e) => {
         e.preventDefault();
         e.stopPropagation();
         this._playClickSound();
         this.showMenuPage('language');
      });

      const btnInstructions = this._makeBtn(t('menu.instructions'), (e) => {
         e.preventDefault();
         e.stopPropagation();
         this._playClickSound();
         this.showMenuPage('instructions');
      });

      mainPanel.appendChild(btnStart);
      mainPanel.appendChild(btnContinue);
      mainPanel.appendChild(btnDifficulty);
      mainPanel.appendChild(btnAudio);
      mainPanel.appendChild(btnLanguage);
      mainPanel.appendChild(btnInstructions);
      this.menuDiv.appendChild(mainPanel);

      const difficultyPanel = document.createElement('div');
      difficultyPanel.id = 'menu-difficulty-panel';
      difficultyPanel.style.cssText =
         'display:none;' +
         'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

      const difficultyTitle = document.createElement('div');
      difficultyTitle.textContent = t('menu.difficultyTitle');
      difficultyTitle.style.cssText =
         'font-size:36px; font-weight:bold; color:#fff; margin-bottom:10px;font-family:var(--game-font-family), monospace;';

      const difficultyContainer = document.createElement('div');
      difficultyContainer.style.cssText = 'display:flex; gap:20px;';

      const btnEasy = this._makeDifficultyBtn(t('menu.easy'), 'easy');
      const btnMedium = this._makeDifficultyBtn(t('menu.medium'), 'medium');
      const btnHard = this._makeDifficultyBtn(t('menu.hard'), 'hard');
      this._setActiveDifficultyBtn(btnEasy);

      difficultyContainer.appendChild(btnEasy);
      difficultyContainer.appendChild(btnMedium);
      difficultyContainer.appendChild(btnHard);
      difficultyPanel.appendChild(difficultyTitle);
      difficultyPanel.appendChild(difficultyContainer);
      this.menuDiv.appendChild(difficultyPanel);

      const audioPanel = document.createElement('div');
      audioPanel.id = 'menu-audio-panel';
      audioPanel.style.cssText =
         'display:none;' +
         'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

      const audioTitle = document.createElement('div');
      audioTitle.textContent = t('menu.audioTitle');
      audioTitle.style.cssText =
         'font-size:36px; font-weight:bold; color:#fff; margin-bottom:10px;font-family:var(--game-font-family), monospace;';

      const bgmRow = document.createElement('div');
      bgmRow.style.cssText = 'display:flex; align-items:center; gap:10px; width:450px;';
      const bgmLabel = document.createElement('div');
      bgmLabel.textContent = t('menu.background');
      bgmLabel.style.cssText = 'width:120px; color:#fff; font-size:18px;margin-left:-40px;font-family:var(--game-font-family), monospace;';
      const bgmMuteBtn = document.createElement('button');
      bgmMuteBtn.id = 'bgm-mute-btn';
      bgmMuteBtn.textContent = this.audioManager?.getState().bgm.isMuted ? '🔇' : '🔊';
      bgmMuteBtn.style.cssText = 'width:45px; height:45px; border:none; border-radius:8px; background:#1eb47a; color:#fff; cursor:pointer; font-size:16px;font-family:var(--game-font-family), monospace;';
      const bgmSlider = document.createElement('input');
      bgmSlider.id = 'bgm-volume-slider';
      bgmSlider.type = 'range';
      bgmSlider.min = '0';
      bgmSlider.max = '1';
      bgmSlider.step = '0.01';
      bgmSlider.value = this.audioManager?.getState().bgm.volume ?? 0.6;
      bgmSlider.style.cssText = 'width:240px; height:8px; accent-color:#1eb47a;';
      bgmRow.appendChild(bgmLabel);
      bgmRow.appendChild(bgmMuteBtn);
      bgmRow.appendChild(bgmSlider);

      const sfxRow = document.createElement('div');
      sfxRow.style.cssText = 'display:flex; align-items:center; gap:10px; width:450px;';
      const sfxLabel = document.createElement('div');
      sfxLabel.textContent = t('menu.sounds');
      sfxLabel.style.cssText = 'width:120px; color:#fff; font-size:18px;margin-left:-40px;font-family:var(--game-font-family), monospace;';
      const sfxMuteBtn = document.createElement('button');
      sfxMuteBtn.id = 'sfx-mute-btn';
      sfxMuteBtn.textContent = this.audioManager?.getState().sfx.isMuted ? '🔇' : '🔊';
      sfxMuteBtn.style.cssText = 'width:45px; height:45px; border:none; border-radius:8px; background:#1eb47a; color:#fff; cursor:pointer; font-size:16px;font-family:var(--game-font-family), monospace';
      const sfxSlider = document.createElement('input');
      sfxSlider.id = 'sfx-volume-slider';
      sfxSlider.type = 'range';
      sfxSlider.min = '0';
      sfxSlider.max = '2';
      sfxSlider.step = '0.01';
      sfxSlider.value = this.audioManager?.getState().sfx.volume ?? 1.0;
      sfxSlider.style.cssText = 'width:240px;; height:8px; accent-color:#1eb47a;';
      sfxRow.appendChild(sfxLabel);
      sfxRow.appendChild(sfxMuteBtn);
      sfxRow.appendChild(sfxSlider);

      audioPanel.appendChild(audioTitle);
      audioPanel.appendChild(bgmRow);
      audioPanel.appendChild(sfxRow);
      this.menuDiv.appendChild(audioPanel);

      const languagePanel = document.createElement('div');
      languagePanel.id = 'menu-language-panel';
      languagePanel.style.cssText =
         'display:none;' +
         'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

      const languageTitle = document.createElement('div');
      languageTitle.textContent = t('menu.languageTitle');
      languageTitle.style.cssText =
         'font-size:36px; font-weight:bold; color:#fff; margin-bottom:10px;font-family:var(--game-font-family), monospace;';

      const languageContainer = document.createElement('div');
      languageContainer.style.cssText = 'display:flex; gap:20px;';

      const btnEnglish = this._makeLanguageBtn(t('menu.english'), 'en');
      const btnChinese = this._makeLanguageBtn(t('menu.chinese'), 'zh');
      if (getLanguage() === 'zh') {
         this._setActiveSelectBtn(btnChinese);
      } else {
         this._setActiveSelectBtn(btnEnglish);
      }

      languageContainer.appendChild(btnEnglish);
      languageContainer.appendChild(btnChinese);
      languagePanel.appendChild(languageTitle);
      languagePanel.appendChild(languageContainer);
      this.menuDiv.appendChild(languagePanel);

      bgmMuteBtn.onclick = () => {
         if (!this.audioManager) return;
         this.audioManager.toggleBgmMute();
         const bgmState = this.audioManager.getState().bgm;
         bgmMuteBtn.textContent = bgmState.isMuted ? '🔇' : '🔊';
         bgmSlider.value = bgmState.isMuted ? '0' : String(bgmState.volume);
      };
      bgmMuteBtn.onmouseenter = function () { this.style.background = '#32d696'; };
      bgmMuteBtn.onmouseleave = function () { this.style.background = '#1eb47a'; };

      bgmSlider.addEventListener('input', (e) => {
         if (!this.audioManager) return;
         this.audioManager.setBgmVolume(parseFloat(e.target.value));
      });

      sfxMuteBtn.onclick = () => {
         if (!this.audioManager) return;
         this.audioManager.toggleSfxMute();
         const sfxState = this.audioManager.getState().sfx;
         sfxMuteBtn.textContent = sfxState.isMuted ? '🔇' : '🔊';
         sfxSlider.value = sfxState.isMuted ? '0' : String(sfxState.volume);
      };
      sfxMuteBtn.onmouseenter = function () { this.style.background = '#32d696'; };
      sfxMuteBtn.onmouseleave = function () { this.style.background = '#1eb47a'; };
      sfxSlider.addEventListener('input', (e) => {
         if (!this.audioManager) return;
         this.audioManager.setSfxVolume(parseFloat(e.target.value));
      });

      document.body.appendChild(this.menuDiv);
      this.menuRefs = {
         backBtn,
         btnStart,
         btnContinue,
         btnDifficulty,
         btnAudio,
         btnLanguage,
         btnInstructions,
         difficultyTitle,
         audioTitle,
         languageTitle,
         bgmLabel,
         sfxLabel,
         btnEasy,
         btnMedium,
         btnHard,
         btnEnglish,
         btnChinese
      };
      this.refreshLanguage();
      this.showMenuPage('main');
   }

   banBtnContinue() {
      const bc = document.getElementById('btn-continue');
      if (!bc) return;
      bc.style.opacity = '0.3';
      bc.style.pointerEvents = 'none';
   }

   hideMenu() {
      if (!this.menuDiv) return;
      this.menuDiv.style.display = 'none';
      this.setAppState('PLAYING');
   }

   showMenu() {
      if (this.getGameManager()) {
         const bc = document.getElementById('btn-continue');
         if (bc) {
            bc.style.opacity = '1';
            bc.style.pointerEvents = 'auto';
         }
      }

      this.intro.page = 1;
      this.intro.transition = 1;
      this.intro.isTransitioning = false;
      this.intro.showFx(1);
      this.intro.showSidePanels(1);

      if (!this.menuDiv) {
         this.createMenu();
      }
      this.menuDiv.style.display = 'flex';
      this.showMenuPage('main');
      this.setAppState('MENU');
      this.resources.sounds.bgm?.pause();
   }

   playDemoVideo() {
      const video = document.createElement('video');
      const playToken = ++this.demoVideoPlayToken;

      this.demoVideo = video;
      video.src = 'resources/videos/helpvideo.mp4';
      video.controls = false;
      video.muted = true;
      video.playsInline = true;

      video.style.cssText =
         'position:absolute; top:50%; left:50%; width:1000px; height:700px;' +
         'transform:translate(-50%, -50%); z-index:10; background:black; object-fit:contain; cursor:pointer;';

      document.body.appendChild(video);

      this.intro.page = 1;
      this.intro.showFx(1);
      this.intro.showSidePanels(1);

      if (this.intro.leftCanvas) this.intro.leftCanvas.style.zIndex = '20';
      if (this.intro.rightCanvas) this.intro.rightCanvas.style.zIndex = '20';

      video.onended = () => this.endDemoVideo();
      video.onclick = () => this.endDemoVideo();

      const beginBGM = this.resources.sounds.begin;
      if (beginBGM) {
         this.resources.sounds.bgm?.stop();
         this.resources.sounds.story?.stop();
         beginBGM.stop();
         beginBGM.playMode('restart');
         beginBGM.play();
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
         playPromise.catch((e) => {
            if (e?.name === 'AbortError' || this.demoVideo !== video || this.demoVideoPlayToken !== playToken) {
               return;
            }

            console.error('视频播放失败，原因：', e);
            this.endDemoVideo();
         });
      }
   }

   endDemoVideo() {
      this.resources.sounds.begin?.stop();
      this.demoVideoPlayToken++;

      if (!this.demoVideo) return;

      const video = this.demoVideo;
      video.onended = null;
      video.onclick = null;
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
      this.demoVideo = null;

      if (!this.menuDiv) {
         this.createMenu();
      }
      this.menuDiv.style.display = 'flex';
      this.showMenuPage('main');
      this.setAppState('MENU');
   }

   _makeDifficultyBtn(label, difficulty) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.dataset.difficulty = difficulty;
      btn.style.cssText =
         'width:180px; height:60px; font-size:30px; font-weight:bold; color:white;' +
         'font-family:var(--game-font-family), monospace;' +
         `background-image:url("${this.BTN_NORMAL}");` +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'background-color:transparent;' +
         'border:none; cursor:pointer;' +
         'transition: all 0.2s;';

      btn.onmouseenter = () => {
         if (btn.dataset.difficulty !== this.selectedDifficulty) {
            btn.style.backgroundImage = `url("${this.BTN_HOVER}")`;
         }
      };
      btn.onmouseleave = () => {
         if (btn.dataset.difficulty !== this.selectedDifficulty) {
            btn.style.backgroundImage = `url("${this.BTN_NORMAL}")`;
         }
      };
      btn.onclick = () => {
         this._playClickSound();
         this.selectedDifficulty = btn.dataset.difficulty;
         this.resources.setLdtkData(this.selectedDifficulty);
         this.banBtnContinue();
         document.querySelectorAll('[data-difficulty]').forEach((button) => this._setInactiveDifficultyBtn(button));
         this._setActiveDifficultyBtn(btn);
      };

      return btn;
   }

   _makeLanguageBtn(label, language) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.dataset.language = language;
      btn.style.cssText =
         'width:220px; height:60px; font-size:30px; font-weight:bold; color:white;' +
         'font-family:var(--game-font-family), monospace;' +
         `background-image:url("${this.BTN_NORMAL}");` +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-position:center;' +
         'background-color:transparent;' +
         'border:none; cursor:pointer;' +
         'transition: all 0.2s;';

      btn.onmouseenter = () => {
         if (btn.dataset.language !== getLanguage()) {
            btn.style.backgroundImage = `url("${this.BTN_HOVER}")`;
         }
      };
      btn.onmouseleave = () => {
         if (btn.dataset.language !== getLanguage()) {
            btn.style.backgroundImage = `url("${this.BTN_NORMAL}")`;
         }
      };
      btn.onclick = () => {
         this._playClickSound();
         setLanguage(btn.dataset.language);
         document.querySelectorAll('[data-language]').forEach((button) => this._setInactiveSelectBtn(button));
         this._setActiveSelectBtn(btn);
      };

      return btn;
   }

   _makeBtn(label, onClick) {
      const btn = document.createElement('button');
      btn.textContent = label;

      const menuFontSize = getLanguage() === 'zh' ? '35px' : '38px';
      btn.style.cssText =
         `width:320px; height:70px; font-size:${menuFontSize}; font-weight:bold; color:white;` +
         'font-family:var(--game-font-family), monospace;' +
         `background-image:url("${this.BTN_NORMAL}");` +
         'background-size:100% 100%;' +
         'background-repeat:no-repeat;' +
         'background-color:transparent;' +
         'border:none; cursor:pointer;' +
         'text-align:center;';

      btn.onmouseenter = () => {
         btn.style.backgroundImage = `url("${this.BTN_HOVER}")`;
      };
      btn.onmouseleave = () => {
         btn.style.backgroundImage = `url("${this.BTN_NORMAL}")`;
      };
      btn.onmousedown = () => {
         btn.style.backgroundImage = `url("${this.BTN_ACTIVE}")`;
      };
      btn.onmouseup = () => {
         btn.style.backgroundImage = `url("${this.BTN_HOVER}")`;
      };
      btn.onclick = (e) => {
         e.preventDefault();
         e.stopPropagation();
         onClick(e);
      };

      return btn;
   }

   _setActiveDifficultyBtn(btn) {
      this._setActiveSelectBtn(btn);
   }

   _setInactiveDifficultyBtn(btn) {
      this._setInactiveSelectBtn(btn);
   }

   _setActiveSelectBtn(btn) {
      btn.style.backgroundImage = `url("${this.BTN_ACTIVE}")`;
      btn.style.transform = 'scale(1.02)';
      btn.style.boxShadow = '0 0 6px rgba(30, 180, 122, 0.45)';
   }

   _setInactiveSelectBtn(btn) {
      btn.style.backgroundImage = `url("${this.BTN_NORMAL}")`;
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = 'none';
   }

   _playClickSound() {
      if (this.resources.sounds.click && !this.resources.sounds.click.isPlaying()) {
         this.resources.sounds.click.play();
      }
   }

   _applyMenuTitleSize(target) {
      if (!target) return;
      const size = getLanguage() === 'zh' ? '36px' : '44px';
      target.style.setProperty('font-size', size, 'important');
   }

   _applyMenuButtonSize(target) {
      if (!target) return;
      const size = getLanguage() === 'zh' ? '35px' : '38px';
      target.style.setProperty('font-size', size, 'important');
   }

   _applyMenuSubButtonSize(target) {
      if (!target) return;
      const size = getLanguage() === 'zh' ? '30px' : '34px';
      target.style.setProperty('font-size', size, 'important');
   }

   replayStoryPreview() {
      if (typeof storyIntro === 'undefined' || !storyIntro) return;

      const originalOnFinish = storyIntro.onFinish;
      storyIntro.onFinish = () => {
         storyFinished = true;
         storyIntro.finished = true;
         storyIntro.onFinish = originalOnFinish;
         this.showMenu();
      };

      storyIntro.refreshLanguage?.();
      storyIntro.currentSlide = 0;
      storyIntro.currentLine = 0;
      storyIntro.currentChar = 0;
      storyIntro.lastCharTime = millis();
      storyIntro.linePauseStart = -1;
      storyIntro.slidePauseStart = -1;
      storyIntro.finished = false;
      storyIntro.bgmPlayed = false;

      storyStarted = true;
      storyFinished = false;

      this.menuDiv.style.display = 'none';
   }
}
