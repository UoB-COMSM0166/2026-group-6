const BTN_NORMAL = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png';
const BTN_HOVER = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png';
const BTN_ACTIVE = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Active.png';
let menuRefs = null;
let currentMenuPage = 'main';

function showMenuPage(page) {
   const mainPanel = document.getElementById('menu-main-panel');
   const difficultyPanel = document.getElementById('menu-difficulty-panel');
   const audioPanel = document.getElementById('menu-audio-panel');
   const languagePanel = document.getElementById('menu-language-panel');
   const backBtn = document.getElementById('menu-back-btn');

   if (!mainPanel || !difficultyPanel || !audioPanel || !languagePanel || !backBtn) return;
   currentMenuPage = page;

   mainPanel.style.display = 'none';
   difficultyPanel.style.display = 'none';
   audioPanel.style.display = 'none';
   languagePanel.style.display = 'none';
   instructionsMenu?.hide();

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
      instructionsMenu?.show();
      backBtn.style.display = 'block';
   }
}

function refreshMenuLanguage() {
   if (!menuRefs) return;

   menuRefs.backBtn.textContent = t('menu.back');
   menuRefs.btnStart.textContent = t('menu.start');
   menuRefs.btnContinue.textContent = t('menu.continue');
   menuRefs.btnDifficulty.textContent = t('menu.difficulty');
   menuRefs.btnAudio.textContent = t('menu.audio');
   menuRefs.btnLanguage.textContent = t('menu.language');
   menuRefs.btnInstructions.textContent = t('menu.instructions');
   menuRefs.difficultyTitle.textContent = t('menu.difficultyTitle');
   menuRefs.audioTitle.textContent = t('menu.audioTitle');
   menuRefs.languageTitle.textContent = t('menu.languageTitle');
   menuRefs.bgmLabel.textContent = t('menu.background');
   menuRefs.sfxLabel.textContent = t('menu.sounds');
   menuRefs.btnEasy.textContent = t('menu.easy');
   menuRefs.btnMedium.textContent = t('menu.medium');
   menuRefs.btnHard.textContent = t('menu.hard');
   menuRefs.btnEnglish.textContent = t('menu.english');
   menuRefs.btnChinese.textContent = t('menu.chinese');
   _setInactiveSelectBtn(menuRefs.btnEnglish);
   _setInactiveSelectBtn(menuRefs.btnChinese);
   if (getLanguage() === 'zh') _setActiveSelectBtn(menuRefs.btnChinese);
   else _setActiveSelectBtn(menuRefs.btnEnglish);

   instructionsMenu?.refreshLanguage?.();
   showMenuPage(currentMenuPage);
}

function _createMenu() {
   menuDiv = document.createElement('div');
   menuDiv.id = 'game-menu';
   menuDiv.style.cssText =
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
      `background-image:url("${BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-position:center;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'transition:all 0.2s;' +
      'z-index:100;';

   backBtn.onmouseenter = function () {
      this.style.backgroundImage = `url("${BTN_HOVER}")`;
   };

   backBtn.onmouseleave = function () {
      this.style.backgroundImage = `url("${BTN_NORMAL}")`;
   };

   backBtn.onmousedown = function () {
      this.style.backgroundImage = `url("${BTN_ACTIVE}")`;
   };

   backBtn.onmouseup = function () {
      this.style.backgroundImage = `url("${BTN_HOVER}")`;
   };

   backBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }

      showMenuPage('main');
   };
   menuDiv.appendChild(backBtn);

   const mainPanel = document.createElement('div');
   mainPanel.id = 'menu-main-panel';
   mainPanel.style.cssText =
      'display:flex; flex-direction:column; align-items:center; gap:20px;';

   let btnStart = _makeBtn(t('menu.start'), function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      _hideMenu();
      gm = new GameManager(resources, selectedDifficulty);

      if (resources.sounds.bgm && !resources.sounds.bgm.isPlaying()) {
         resources.sounds.bgm.loop();
      }
   });

   let btnContinue = _makeBtn(t('menu.continue'), function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      if (!gm) return;

      _hideMenu();
      if (resources.sounds.bgm && !resources.sounds.bgm.isPlaying()) {
         resources.sounds.bgm.loop();
      }
   });

   btnContinue.id = 'btn-continue';
   btnContinue.style.opacity = '0.3';
   btnContinue.style.pointerEvents = 'none';

   const btnDifficulty = _makeBtn(t('menu.difficulty'), function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('difficulty');
   });

   const btnAudio = _makeBtn(t('menu.audio'), function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('audio');
   });

   const btnLanguage = _makeBtn(t('menu.language'), function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('language');
   });

   const btnInstructions = _makeBtn(t('menu.instructions'), function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('instructions');
   });

   mainPanel.appendChild(btnStart);
   mainPanel.appendChild(btnContinue);
   mainPanel.appendChild(btnDifficulty);
   mainPanel.appendChild(btnAudio);
   mainPanel.appendChild(btnLanguage);
   mainPanel.appendChild(btnInstructions);
   menuDiv.appendChild(mainPanel);

   const difficultyPanel = document.createElement('div');
   difficultyPanel.id = 'menu-difficulty-panel';
   difficultyPanel.style.cssText =
      'display:none;' +
      'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

   let difficultyTitle = document.createElement('div');
   difficultyTitle.textContent = t('menu.difficultyTitle');
   difficultyTitle.style.cssText =
      'font-size:36px; font-weight:bold; color:#fff; margin-bottom:10px;font-family:var(--game-font-family), monospace;';

   let difficultyContainer = document.createElement('div');
   difficultyContainer.style.cssText =
      'display:flex; gap:20px;';

   let btnEasy = _makeDifficultyBtn(t('menu.easy'), 'easy');
   let btnMedium = _makeDifficultyBtn(t('menu.medium'), 'medium');
   let btnHard = _makeDifficultyBtn(t('menu.hard'), 'hard');
   _setActiveDifficultyBtn(btnEasy);

   difficultyContainer.appendChild(btnEasy);
   difficultyContainer.appendChild(btnMedium);
   difficultyContainer.appendChild(btnHard);
   difficultyPanel.appendChild(difficultyTitle);
   difficultyPanel.appendChild(difficultyContainer);
   menuDiv.appendChild(difficultyPanel);

   const audioPanel = document.createElement('div');
   audioPanel.id = 'menu-audio-panel';
   audioPanel.style.cssText =
      'display:none;' +
      'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

   const audioTitle = document.createElement('div');
   audioTitle.textContent = t('menu.audioTitle');
   audioTitle.style.cssText =
      'font-size:36px; font-weight:bold; color:#fff; margin-bottom:10px;font-family:var(--game-font-family), monospace;';

   instructionsMenu = new InstructionsMenu({
      buttonImages: {
         normal: BTN_NORMAL,
         hover: BTN_HOVER,
         active: BTN_ACTIVE
      },
      onPlayClickSound: function () {
         if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
            resources.sounds.click.play();
         }
      }
   });
   instructionsMenu.attachTo(menuDiv);

   const bgmRow = document.createElement('div');
   bgmRow.style.cssText = 'display:flex; align-items:center; gap:10px; width:450px;';
   const bgmLabel = document.createElement('div');
   bgmLabel.textContent = t('menu.background');
   bgmLabel.style.cssText = 'width:120px; color:#fff; font-size:18px;margin-left:-40px;font-family:var(--game-font-family), monospace;';
   const bgmMuteBtn = document.createElement('button');
   bgmMuteBtn.id = 'bgm-mute-btn';
   bgmMuteBtn.textContent = audioManager?.getState().bgm.isMuted ? '🔇' : '🔊';
   bgmMuteBtn.style.cssText = 'width:45px; height:45px; border:none; border-radius:8px; background:#1eb47a; color:#fff; cursor:pointer; font-size:16px;font-family:var(--game-font-family), monospace;';
   const bgmSlider = document.createElement('input');
   bgmSlider.id = 'bgm-volume-slider';
   bgmSlider.type = 'range';
   bgmSlider.min = '0';
   bgmSlider.max = '1';
   bgmSlider.step = '0.01';
   bgmSlider.value = audioManager?.getState().bgm.volume ?? 0.6;
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
   sfxMuteBtn.textContent = audioManager?.getState().sfx.isMuted ? '🔇' : '🔊';
   sfxMuteBtn.style.cssText = 'width:45px; height:45px; border:none; border-radius:8px; background:#1eb47a; color:#fff; cursor:pointer; font-size:16px;font-family:var(--game-font-family), monospace';
   const sfxSlider = document.createElement('input');
   sfxSlider.id = 'sfx-volume-slider';
   sfxSlider.type = 'range';
   sfxSlider.min = '0';
   sfxSlider.max = '1';
   sfxSlider.step = '0.01';
   sfxSlider.value = audioManager?.getState().sfx.volume ?? 0.8;
   sfxSlider.style.cssText = 'width:240px;; height:8px; accent-color:#1eb47a;';
   sfxRow.appendChild(sfxLabel);
   sfxRow.appendChild(sfxMuteBtn);
   sfxRow.appendChild(sfxSlider);

   audioPanel.appendChild(audioTitle);
   audioPanel.appendChild(bgmRow);
   audioPanel.appendChild(sfxRow);
   menuDiv.appendChild(audioPanel);

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

   const btnEnglish = _makeLanguageBtn(t('menu.english'), 'en');
   const btnChinese = _makeLanguageBtn(t('menu.chinese'), 'zh');
   if (getLanguage() === 'zh') {
      _setActiveSelectBtn(btnChinese);
   } else {
      _setActiveSelectBtn(btnEnglish);
   }

   languageContainer.appendChild(btnEnglish);
   languageContainer.appendChild(btnChinese);
   languagePanel.appendChild(languageTitle);
   languagePanel.appendChild(languageContainer);
   menuDiv.appendChild(languagePanel);

   bgmMuteBtn.onclick = function () {
      if (!audioManager) return;
      audioManager.toggleBgmMute();
      bgmMuteBtn.textContent = audioManager.getState().bgm.isMuted ? '🔇' : '🔊';
   };
   bgmMuteBtn.onmouseenter = function () { this.style.background = '#32d696'; };
   bgmMuteBtn.onmouseleave = function () { this.style.background = '#1eb47a'; };

   bgmSlider.addEventListener('input', function (e) {
      if (!audioManager) return;
      audioManager.setBgmVolume(parseFloat(e.target.value));
   });

   sfxMuteBtn.onclick = function () {
      if (!audioManager) return;
      audioManager.toggleSfxMute();
      sfxMuteBtn.textContent = audioManager.getState().sfx.isMuted ? '🔇' : '🔊';
   };
   sfxMuteBtn.onmouseenter = function () { this.style.background = '#32d696'; };
   sfxMuteBtn.onmouseleave = function () { this.style.background = '#1eb47a'; };

   sfxSlider.addEventListener('input', function (e) {
      if (!audioManager) return;
      audioManager.setSfxVolume(parseFloat(e.target.value));
   });

   document.body.appendChild(menuDiv);
   menuRefs = {
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
   refreshMenuLanguage();
   showMenuPage('main');
}

function banBtnContinue() {
   let bc = document.getElementById('btn-continue');
   bc.style.opacity = '0.3';
   bc.style.pointerEvents = 'none';
}

function _makeDifficultyBtn(label, difficulty) {
   let btn = document.createElement('button');
   btn.textContent = label;
   btn.dataset.difficulty = difficulty;
   btn.style.cssText =
      'width:180px; height:60px; font-size:30px; font-weight:bold; color:white;' +
      'font-family:var(--game-font-family), monospace;' +
      `background-image:url("${BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-position:center;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'transition: all 0.2s;';

   btn.onmouseenter = function () {
      if (this.dataset.difficulty !== selectedDifficulty) {
         this.style.backgroundImage = `url("${BTN_HOVER}")`;
      }
   };

   btn.onmouseleave = function () {
      if (this.dataset.difficulty !== selectedDifficulty) {
         this.style.backgroundImage = `url("${BTN_NORMAL}")`;
      }
   };

   btn.onclick = function () {
      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      selectedDifficulty = this.dataset.difficulty;
      resources.setLdtkData(selectedDifficulty);
      banBtnContinue();
      let allDiffBtns = document.querySelectorAll('[data-difficulty]');
      allDiffBtns.forEach(b => _setInactiveDifficultyBtn(b));
      _setActiveDifficultyBtn(this);
   };

   return btn;
}

function _setActiveDifficultyBtn(btn) {
   _setActiveSelectBtn(btn);
}

function _setInactiveDifficultyBtn(btn) {
   _setInactiveSelectBtn(btn);
}

function _makeLanguageBtn(label, language) {
   let btn = document.createElement('button');
   btn.textContent = label;
   btn.dataset.language = language;
   btn.style.cssText =
      'width:220px; height:60px; font-size:30px; font-weight:bold; color:white;' +
      'font-family:var(--game-font-family), monospace;' +
      `background-image:url("${BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-position:center;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'transition: all 0.2s;';

   btn.onmouseenter = function () {
      if (this.dataset.language !== getLanguage()) {
         this.style.backgroundImage = `url("${BTN_HOVER}")`;
      }
   };

   btn.onmouseleave = function () {
      if (this.dataset.language !== getLanguage()) {
         this.style.backgroundImage = `url("${BTN_NORMAL}")`;
      }
   };

   btn.onclick = function () {
      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      setLanguage(this.dataset.language);
      document.querySelectorAll('[data-language]').forEach(b => _setInactiveSelectBtn(b));
      _setActiveSelectBtn(this);
   };

   return btn;
}

function _setActiveSelectBtn(btn) {
   btn.style.backgroundImage = `url("${BTN_ACTIVE}")`;
   btn.style.transform = 'scale(1.02)';
   btn.style.boxShadow = '0 0 6px rgba(30, 180, 122, 0.45)';
}

function _setInactiveSelectBtn(btn) {
   btn.style.backgroundImage = `url("${BTN_NORMAL}")`;
   btn.style.transform = 'scale(1)';
   btn.style.boxShadow = 'none';
}

function _makeBtn(label, onClick) {
   let btn = document.createElement('button');
   btn.textContent = label;

   btn.style.cssText =
      'width:320px; height:70px; font-size:35px; font-weight:bold; color:white;' +
      'font-family:var(--game-font-family), monospace;' +
      `background-image:url("${BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'text-align:center;';

   btn.onmouseenter = function () {
      btn.style.backgroundImage = `url("${BTN_HOVER}")`;
   };

   btn.onmouseleave = function () {
      btn.style.backgroundImage = `url("${BTN_NORMAL}")`;
   };

   btn.onmousedown = function () {
      btn.style.backgroundImage = `url("${BTN_ACTIVE}")`;
   };

   btn.onmouseup = function () {
      btn.style.backgroundImage = `url("${BTN_HOVER}")`;
   };

   btn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
   };

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

   intro.page = 1;
   intro.transition = 1;
   intro.isTransitioning = false;

   intro.showFx(1);
   intro.showSidePanels(1);

   menuDiv.style.display = 'flex';
   showMenuPage('main');
   appState = "MENU";
   resources.sounds.bgm?.pause();
}

function playDemoVideo() {
   demoVideo = document.createElement('video');
   demoVideo.src = 'resources/videos/helpvideo.mp4';
   demoVideo.controls = false;
   demoVideo.muted = true;
   demoVideo.playsInline = true;

   demoVideo.style.cssText =
      'position:absolute; top:50%; left:50%; width:1000px; height:700px;' +
      'transform:translate(-50%, -50%); z-index:10; background:black; object-fit:contain; cursor:pointer;';

   document.body.appendChild(demoVideo);

   intro.page = 1;
   intro.showFx(1);
   intro.showSidePanels(1);

   if (intro.leftCanvas) intro.leftCanvas.style.zIndex = "20";
   if (intro.rightCanvas) intro.rightCanvas.style.zIndex = "20";

   demoVideo.onended = endDemoVideo;
   demoVideo.onclick = endDemoVideo;

   let playPromise = demoVideo.play();
   if (playPromise !== undefined) {
      playPromise.catch(e => {
         console.error("视频播放失败，原因：", e);
         endDemoVideo();
      });
   }
}

function endDemoVideo() {
   if (!demoVideo) return;

   demoVideo.pause();
   demoVideo.remove();
   demoVideo = null;

   if (!menuDiv) {
      _createMenu();
   }
   menuDiv.style.display = 'flex';
   showMenuPage('main');
   appState = "MENU";
}

onLanguageChanged(refreshMenuLanguage);
