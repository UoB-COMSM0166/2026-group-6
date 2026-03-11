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

   //new: audiocontrol
   audioManager = new AudioManager(resources);
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
   }
   //add: audiocontrol
   createVolumeControlUI();
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


function _createMenu() {
   menuDiv = document.createElement('div');
   menuDiv.id = 'game-menu';
   menuDiv.style.cssText =
      'position:fixed; top:50%; left:50%; width:1000px; height:700px;' +
      'transform:translate(-50%,-50%);' +
      'display:flex; flex-direction:column; justify-content:center; align-items:center;' +
      'gap:20px; background:#1a1a2e; z-index:10;';

   let btnStart = _makeBtn('Start Game', function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

     
       _hideMenu();

      gm = new GameManager(resources);
      //new: add bgm
      resources.sounds.bgm?.loop(true);
      resources.sounds.bgm?.setVolume(0.6);
      resources.sounds.bgm?.play();
   });

   let btnContinue = _makeBtn('Continue Game', function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      if (!resources.sounds.click.isPlaying()) resources.sounds.click.play();
      if (!gm) return;

      _hideMenu();
      //add: bgm
      resources.sounds.bgm?.loop(true);
      resources.sounds.bgm?.setVolume(0.6);
      resources.sounds.bgm?.play();
   });
   btnContinue.id = 'btn-continue';
   btnContinue.style.opacity = '0.3';
   btnContinue.style.pointerEvents = 'none';

   // ========== 难度选择区域 ==========
   // 1. 难度标题
   let difficultyTitle = document.createElement('div');
   difficultyTitle.textContent = "Select Difficulty";
   difficultyTitle.style.cssText =
      'font-size:20px; font-weight:bold; color:#fff; margin-top:10px; margin-bottom:-10px;';

   // 2. 难度按钮容器（横向排列）
   let difficultyContainer = document.createElement('div');
   difficultyContainer.style.cssText =
      'display:flex; gap:15px; margin-bottom:10px;';

   // 3. 创建三个难度按钮
   let btnEasy = _makeDifficultyBtn('Easy', 'easy');
   let btnMedium = _makeDifficultyBtn('Medium', 'medium');
   let btnHard = _makeDifficultyBtn('Hard', 'hard');

   // 初始选中Easy难度
   _setActiveDifficultyBtn(btnEasy);

   // 组装难度区域
   difficultyContainer.appendChild(btnEasy);
   difficultyContainer.appendChild(btnMedium);
   difficultyContainer.appendChild(btnHard);

   // ========== 组装菜单 ==========
   menuDiv.appendChild(btnStart);
   menuDiv.appendChild(btnContinue);
   menuDiv.appendChild(difficultyTitle);
   menuDiv.appendChild(difficultyContainer);

   document.body.appendChild(menuDiv);
}

function banBtnContinue() {
   let bc = document.getElementById('btn-continue')
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
      if (!resources.sounds.click.isPlaying()) resources.sounds.click.play();
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
      'width:280px; height:60px; font-size:24px; font-weight:bold; color:#fff;' +
      'background:#1eb47a; border:none; border-radius:12px; cursor:pointer;' +
      'transition: background 0.2s;';

   btn.onmouseenter = function () { btn.style.background = '#32d696'; };
   btn.onmouseleave = function () { btn.style.background = '#1eb47a'; };

   btn.onmousedown = function (e) {
      e.preventDefault();
      e.stopPropagation();
   };

   btn.onmouseup = function (e) {
      e.preventDefault();
      e.stopPropagation();
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
   appState = "MENU";
   resources.sounds.bgm?.pause();
}

function playDemoVideo() {
   demoVideo = document.createElement('video');
   // 使用你提供的准确路径
   demoVideo.src = 'resources/videos/helpvideo.mp4'; 
   demoVideo.controls = false;
   
   // 关键：静音播放可以绕过浏览器的自动播放拦截
   demoVideo.muted = true;  
   demoVideo.playsInline = true; 
   
   // 设置视频样式，覆盖在画布上方
   demoVideo.style.cssText =
      'position:absolute; top:50%; left:50%; width:1000px; height:700px;' +
      'transform:translate(-50%, -50%); z-index:20; background:black; object-fit:contain; cursor:pointer;';

   document.body.appendChild(demoVideo);

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

   // 视频结束后，执行原本进入难度选择菜单的逻辑
   intro.page = 1;
   intro.transition = 1;
   intro.isTransitioning = false;

   intro.showFx(1);
   intro.showSidePanels(1);

   if (!menuDiv) {
      _createMenu();
   }
   menuDiv.style.display = 'flex';
   appState = "MENU";
}

   // ========== 新增：音量控制UI（粘贴到main.js末尾） ==========
function createVolumeControlUI() {
   // 1. 音量面板容器（右下角悬浮）
   const volumePanel = document.createElement('div');
   volumePanel.id = 'volume-panel';
   volumePanel.style.cssText = `
   position: fixed;
   bottom: 20px;
   right: 20px;
   background: #1a1a2e;
   padding: 15px;
   border-radius: 10px;
   z-index: 999;
   color: #fff;
   font-family: Arial, sans-serif;
   box-shadow: 0 0 10px rgba(0,0,0,0.5);
   `;

  // 2. BGM控制区域
   const bgmDiv = document.createElement('div');
   bgmDiv.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center; gap: 10px;';
   bgmDiv.innerHTML = `
      <span>BGM</span>
      <button id="bgm-mute-btn" style="width: 30px; height: 30px; border: none; border-radius: 50%; background: #2a2a4e; color: #fff; cursor: pointer;">
      ${audioManager.getState().bgm.isMuted ? '🔇' : '🔊'}
      </button>
      <input id="bgm-volume-slider" type="range" min="0" max="1" step="0.01" value="${audioManager.getState().bgm.volume}" style="flex: 1;">
      `;

  // 3. 音效控制区域
   const sfxDiv = document.createElement('div');
   sfxDiv.style.cssText = 'display: flex; align-items: center; gap: 10px;';
   sfxDiv.innerHTML = `
   <span>SFX</span>
   <button id="sfx-mute-btn" style="width: 30px; height: 30px; border: none; border-radius: 50%; background: #2a2a4e; color: #fff; cursor: pointer;">
      ${audioManager.getState().sfx.isMuted ? '🔇' : '🔊'}
    </button>
    <input id="sfx-volume-slider" type="range" min="0" max="1" step="0.01" value="${audioManager.getState().sfx.volume}" style="flex: 1;">
  `;

  // 组装面板
   volumePanel.appendChild(bgmDiv);
   volumePanel.appendChild(sfxDiv);
   document.body.appendChild(volumePanel);

  // 4. 绑定交互事件
  // BGM静音按钮
   document.getElementById('bgm-mute-btn').addEventListener('click', () => {
   audioManager.toggleBgmMute();
   const btn = document.getElementById('bgm-mute-btn');
   btn.textContent = audioManager.getState().bgm.isMuted ? '🔇' : '🔊';
  });

  // BGM音量滑块
   document.getElementById('bgm-volume-slider').addEventListener('input', (e) => {
      audioManager.setBgmVolume(parseFloat(e.target.value));
  });

  // 音效静音按钮
   document.getElementById('sfx-mute-btn').addEventListener('click', () => {
      audioManager.toggleSfxMute();
      const btn = document.getElementById('sfx-mute-btn');
      btn.textContent = audioManager.getState().sfx.isMuted ? '🔇' : '🔊';
  });

  // 音效音量滑块
   document.getElementById('sfx-volume-slider').addEventListener('input', (e) => {
      audioManager.setSfxVolume(parseFloat(e.target.value));
   });
}