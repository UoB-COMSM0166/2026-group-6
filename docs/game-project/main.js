let resources;
let gm;
let appState = "MENU";  // MENU | PLAYING
let menuDiv;
let intro;
let storyIntro;
let storyStarted = false;   
let storyFinished = false; 
let selectedDifficulty = "easy"; 

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
   });

   // Original intro UI
   intro = new introUI();

   if (resources.ldtkData) {
      resources.markLoaded();
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
   });

   let btnContinue = _makeBtn('Continue Game', function (e) {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }

      if (!resources.sounds.click.isPlaying()) resources.sounds.click.play();
      if (!gm) return;

      _hideMenu();
   });
   btnContinue.id = 'btn-continue';
   btnContinue.style.opacity = '0.3';
   btnContinue.style.pointerEvents = 'none';

   //测试用临时增加
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
}
