let resources;
let gm;
let appState = "MENU";  // MENU | VIDEO | PLAYING 
let menuDiv;
let intro;
let storyIntro;
let storyStarted = false;
let storyFinished = false;
let selectedDifficulty = "easy";
let demoVideo = null;
//add: audiocontrol
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
      //add: audiocontrol
      audioManager = new AudioManager(resources);
   }
}

function draw() {
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

//add: showmenuchange
function showMenuPage(page) {
   const mainPanel = document.getElementById('menu-main-panel');
   const difficultyPanel = document.getElementById('menu-difficulty-panel');
   const audioPanel = document.getElementById('menu-audio-panel');
   const backBtn = document.getElementById('menu-back-btn');

   if (!mainPanel || !difficultyPanel || !audioPanel || !backBtn) return;

   mainPanel.style.display = 'none';
   difficultyPanel.style.display = 'none';
   audioPanel.style.display = 'none';
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
   } else if (page === 'instructions') {
      instructionsMenu?.show();
      backBtn.style.display = 'block';
   }
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

   // ===== Back 按钮只在子页面显示 =====
   const backBtn = document.createElement('button');
   backBtn.id = 'menu-back-btn';
   backBtn.textContent = 'Back';
   backBtn.style.cssText =
      'display:none;' +
      'position:absolute; top:30px; left:30px;' +
      'width:180px; height:60px; font-size:20px; font-weight:bold; color:white;' +
      `background-image:url("${BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-position:center;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'transition:all 0.2s;' +
      // ===== 增加 z-index，避免被遮挡 =====
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

      // =====点击音效判空，避免 click 不存在时报错=====
      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }

      // ===== Back返回主菜单页=====
      showMenuPage('main');
   };
   menuDiv.appendChild(backBtn);

   // 主菜单页
   // ===== 新增主菜单页容器 =====
   const mainPanel = document.createElement('div');
   mainPanel.id = 'menu-main-panel';
   mainPanel.style.cssText =
      'display:flex; flex-direction:column; align-items:center; gap:20px;';

   let btnStart = _makeBtn('Start Game', function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }


      _hideMenu();

      // ===== 开始游戏时传入 selectedDifficulty =====
      gm = new GameManager(resources, selectedDifficulty);


      // ===== 避免重复播放 =====
      if (resources.sounds.bgm && !resources.sounds.bgm.isPlaying()) {
         resources.sounds.bgm.loop();
      }
   });

   let btnContinue = _makeBtn('Continue Game', function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      // ===== 加判空：避免 click 音效不存在时报错 =====
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

   // ===== Choose Difficulty =====
   const btnDifficulty = _makeBtn('Choose Difficulty', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('difficulty');
   });

   //======Audio Settings=====
   const btnAudio = _makeBtn('Audio Settings', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('audio');
   });
   // ====== Instructions ======
   const btnInstructions = _makeBtn('Instructions', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      showMenuPage('instructions');
   });

   // 组装主面板
   mainPanel.appendChild(btnStart);
   mainPanel.appendChild(btnContinue);
   mainPanel.appendChild(btnDifficulty);
   mainPanel.appendChild(btnAudio);
   mainPanel.appendChild(btnInstructions);
   menuDiv.appendChild(mainPanel);

   // 新增：难度面板（默认隐藏）
   const difficultyPanel = document.createElement('div');
   difficultyPanel.id = 'menu-difficulty-panel';
   difficultyPanel.style.cssText =
      'display:none;' +
      'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

   let difficultyTitle = document.createElement('div');
   difficultyTitle.textContent = "Choose Difficulty";
   difficultyTitle.style.cssText =
      'font-size:28px; font-weight:bold; color:#fff; margin-bottom:10px;';

   let difficultyContainer = document.createElement('div');
   difficultyContainer.style.cssText =
      'display:flex; gap:20px;';

   let btnEasy = _makeDifficultyBtn('Easy', 'easy');
   let btnMedium = _makeDifficultyBtn('Medium', 'medium');
   let btnHard = _makeDifficultyBtn('Hard', 'hard');
   _setActiveDifficultyBtn(btnEasy);

   difficultyContainer.appendChild(btnEasy);
   difficultyContainer.appendChild(btnMedium);
   difficultyContainer.appendChild(btnHard);
   difficultyPanel.appendChild(difficultyTitle);
   difficultyPanel.appendChild(difficultyContainer);
   menuDiv.appendChild(difficultyPanel);

   // 新增：音频面板（默认隐藏）
   const audioPanel = document.createElement('div');
   audioPanel.id = 'menu-audio-panel';
   audioPanel.style.cssText =
      'display:none;' +
      'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

   const audioTitle = document.createElement('div');
   audioTitle.textContent = "Audio Settings";
   audioTitle.style.cssText =
      'font-size:28px; font-weight:bold; color:#fff; margin-bottom:10px;';

   //说明页面

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


   // BGM控制行
   const bgmRow = document.createElement('div');
   bgmRow.style.cssText = 'display:flex; align-items:center; gap:10px; width:450px;';
   const bgmLabel = document.createElement('div');
   bgmLabel.textContent = 'Background';
   bgmLabel.style.cssText = 'width:120px; color:#fff; font-size:18px;margin-left:-40px;';
   const bgmMuteBtn = document.createElement('button');
   bgmMuteBtn.id = 'bgm-mute-btn';
   bgmMuteBtn.textContent = audioManager?.getState().bgm.isMuted ? '🔇' : '🔊';
   bgmMuteBtn.style.cssText = 'width:45px; height:45px; border:none; border-radius:8px; background:#1eb47a; color:#fff; cursor:pointer; font-size:16px;';
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

   // sounde: SFX控制行
   const sfxRow = document.createElement('div');
   sfxRow.style.cssText = 'display:flex; align-items:center; gap:10px; width:450px;';
   const sfxLabel = document.createElement('div');
   sfxLabel.textContent = 'Sounds';
   sfxLabel.style.cssText = 'width:120px; color:#fff; font-size:18px;margin-left:-40px;';
   const sfxMuteBtn = document.createElement('button');
   sfxMuteBtn.id = 'sfx-mute-btn';
   sfxMuteBtn.textContent = audioManager?.getState().sfx.isMuted ? '🔇' : '🔊';
   sfxMuteBtn.style.cssText = 'width:45px; height:45px; border:none; border-radius:8px; background:#1eb47a; color:#fff; cursor:pointer; font-size:16px;';
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

   // 组装音频面板
   audioPanel.appendChild(audioTitle);
   audioPanel.appendChild(bgmRow);
   audioPanel.appendChild(sfxRow);
   menuDiv.appendChild(audioPanel);

   // 绑定音频面板事件
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

   // 挂载菜单+默认显示主面板
   document.body.appendChild(menuDiv);
   showMenuPage('main');
}

function banBtnContinue() {
   let bc = document.getElementById('btn-continue');
   bc.style.opacity = '0.3';
   bc.style.pointerEvents = 'none';
}

// ========== 新增：创建难度按钮的专用方法 ==========
function _makeDifficultyBtn(label, difficulty) {
   let btn = document.createElement('button');
   btn.textContent = label;
   btn.dataset.difficulty = difficulty; // 存储难度标识
   btn.style.cssText =
      'width:180px; height:60px; font-size:20px; font-weight:bold; color:white;' +
      `background-image:url("${BTN_NORMAL}");` +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-position:center;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'transition: all 0.2s;';


   // 鼠标悬停效果
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

   // 点击切换难度
   btn.onclick = function () {
      if (resources.sounds.click && !resources.sounds.click.isPlaying()) {
         resources.sounds.click.play();
      }
      selectedDifficulty = this.dataset.difficulty;
      resources.setLdtkData(selectedDifficulty);
      banBtnContinue();
      // 重置所有难度按钮样式，高亮当前选中
      let allDiffBtns = document.querySelectorAll('[data-difficulty]');
      allDiffBtns.forEach(b => _setInactiveDifficultyBtn(b));
      _setActiveDifficultyBtn(this);
   };

   return btn;
}

// ========== 新增：设置选中/未选中难度按钮样式 ==========
function _setActiveDifficultyBtn(btn) {
   btn.style.backgroundImage = `url("${BTN_ACTIVE}")`;
   btn.style.transform = 'scale(1.02)';
   btn.style.boxShadow = '0 0 6px rgba(30, 180, 122, 0.45)';
}


function _setInactiveDifficultyBtn(btn) {
   btn.style.backgroundImage = `url("${BTN_NORMAL}")`;
   btn.style.transform = 'scale(1)';
   btn.style.boxShadow = 'none';
}

const BTN_NORMAL = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png';
const BTN_HOVER = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png';
const BTN_ACTIVE = 'resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Active.png';

function _makeBtn(label, onClick) {

   let btn = document.createElement('button');
   btn.textContent = label;

   btn.style.cssText =
      'width:320px; height:70px; font-size:22px; font-weight:bold; color:white;' +
      'background-image:url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png");' +
      'background-size:100% 100%;' +
      'background-repeat:no-repeat;' +
      'background-color:transparent;' +
      'border:none; cursor:pointer;' +
      'text-align:center;';

   btn.onmouseenter = function () {
      btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png")';
   };

   btn.onmouseleave = function () {
      btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Normal.png")';
   };

   btn.onmousedown = function () {
      btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Active.png")';
   };

   btn.onmouseup = function () {
      btn.style.backgroundImage = 'url("resources/images/UI_resources/1. Free Hologram Interface Wenrexa/Button 1/Button Hover.png")';
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
   // 视频路径
   demoVideo.src = 'resources/videos/helpvideo.mp4';
   demoVideo.controls = false;

   // 关键：静音播放可以绕过浏览器的自动播放拦截
   demoVideo.muted = true;
   demoVideo.playsInline = true;

   // 设置视频样式，覆盖在画布上方
   demoVideo.style.cssText =
      'position:absolute; top:50%; left:50%; width:1000px; height:700px;' +
      'transform:translate(-50%, -50%); z-index:10; background:black; object-fit:contain; cursor:pointer;';

   document.body.appendChild(demoVideo);

   intro.page = 1;
   intro.showFx(1);
   intro.showSidePanels(1);

   // 强制提高侧边栏的层级（z-index: 20），确保它们浮在视频（z-index: 10）上方
   if (intro.leftCanvas) intro.leftCanvas.style.zIndex = "20";
   if (intro.rightCanvas) intro.rightCanvas.style.zIndex = "20";

   // 视频自然播放结束，或者玩家点击视频画面，都会触发结束视频并进入菜单
   demoVideo.onended = endDemoVideo;
   demoVideo.onclick = endDemoVideo;

   // 尝试播放视频
   let playPromise = demoVideo.play();
   if (playPromise !== undefined) {
      playPromise.catch(e => {
         console.error("视频播放失败，原因：", e);
         endDemoVideo(); // 如果还是报错，就直接进菜单防卡死
      });
   }
}

function endDemoVideo() {
   if (!demoVideo) return;

   // 停止并移除视频元素
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
