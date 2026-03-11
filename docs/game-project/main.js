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
      intro.display();
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
   const instructionsPanel = document.getElementById('menu-instructions-panel');
   const backBtn = document.getElementById('menu-back-btn');

   if (!mainPanel || !difficultyPanel || !audioPanel || !instructionsPanel || !backBtn) return;

   mainPanel.style.display = 'none';
   difficultyPanel.style.display = 'none';
   audioPanel.style.display = 'none';
   instructionsPanel.style.display = 'none';

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
      instructionsPanel.style.display = 'flex';
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
      'gap:20px; background:#1a1a2e; z-index:10;';

   // ===== Back 按钮只在子页面显示 =====
   const backBtn = document.createElement('button');
   backBtn.id = 'menu-back-btn';
   backBtn.textContent = 'Back';
   backBtn.style.cssText =
      'display:none;' +
      'position:absolute; top:30px; left:30px;' +
      'width:100px; height:40px; font-size:18px; font-weight:bold; color:#fff;' +
      'background:#2a2a4e; border:none; border-radius:8px; cursor:pointer;' +
      'transition:all 0.2s;' +
      // ===== 增加 z-index，避免被遮挡 =====
      'z-index:100;';
   backBtn.onmouseenter = function () { this.style.background = '#3a3a6e'; };
   backBtn.onmouseleave = function () { this.style.background = '#2a2a4e'; };
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

      // ===== BGM改用当前 audioManager里的值 =====
      audioManager?.setBgmVolume(audioManager.getState().bgm.volume);

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
      audioManager?.setBgmVolume(audioManager.getState().bgm.volume);
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

// 新增：说明面板（默认隐藏）
const instructionsPanel = document.createElement('div');
instructionsPanel.id = 'menu-instructions-panel';
instructionsPanel.style.cssText =
   'display:none;' +
   'flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%;';

const instructionsTitle = document.createElement('div');
instructionsTitle.textContent = "Instructions";
instructionsTitle.style.cssText =
   'font-size:28px; font-weight:bold; color:#fff; margin-bottom:10px;';

instructionsPanel.appendChild(instructionsTitle);
menuDiv.appendChild(instructionsPanel);


// BGM控制行
const bgmRow = document.createElement('div');
bgmRow.style.cssText = 'display:flex; align-items:center; gap:12px; width:420px;';
const bgmLabel = document.createElement('div');
bgmLabel.textContent = 'BGM';
bgmLabel.style.cssText = 'width:60px; color:#fff; font-size:18px;';
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
bgmSlider.style.cssText = 'flex:1; height:8px; accent-color:#1eb47a;';
bgmRow.appendChild(bgmLabel);
bgmRow.appendChild(bgmMuteBtn);
bgmRow.appendChild(bgmSlider);

// SFX控制行
const sfxRow = document.createElement('div');
sfxRow.style.cssText = 'display:flex; align-items:center; gap:12px; width:420px;';
const sfxLabel = document.createElement('div');
sfxLabel.textContent = 'SFX';
sfxLabel.style.cssText = 'width:60px; color:#fff; font-size:18px;';
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
sfxSlider.style.cssText = 'flex:1; height:8px; accent-color:#1eb47a;';
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
      'width:120px; height:50px; font-size:18px; font-weight:bold; color:#fff;' +
      'background:#2a2a4e; border:none; border-radius:8px; cursor:pointer;' +
      'transition: all 0.2s;';

   // 鼠标悬停效果
   btn.onmouseenter = function () {
      if (this.dataset.difficulty !== selectedDifficulty) {
         this.style.background = '#3a3a6e';
      }
   };
   btn.onmouseleave = function () {
      if (this.dataset.difficulty !== selectedDifficulty) {
         this.style.background = '#2a2a4e';
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
   btn.style.background = '#1eb47a'; // 和Start按钮同色系
   btn.style.transform = 'scale(1.05)'; // 轻微放大
   btn.style.boxShadow = '0 0 10px rgba(30, 180, 122, 0.8)'; // 发光效果
}

function _setInactiveDifficultyBtn(btn) {
   btn.style.background = '#2a2a4e';
   btn.style.transform = 'scale(1)';
   btn.style.boxShadow = 'none';
}

function _makeBtn(label, onClick) {
   let btn = document.createElement('button');
   btn.textContent = label;
   btn.style.cssText =
      'width:320px; height:60px; font-size:24px; font-weight:bold; color:#fff;' +
      'background:#1eb47a; border:none; border-radius:12px; cursor:pointer;' +
      'transition: background 0.2s;';

   btn.onmouseenter = function () { btn.style.background = '#32d696'; };
   btn.onmouseleave = function () { btn.style.background = '#1eb47a'; };

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
   if(intro.leftCanvas) intro.leftCanvas.style.zIndex = "20";
   if(intro.rightCanvas) intro.rightCanvas.style.zIndex = "20";

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
