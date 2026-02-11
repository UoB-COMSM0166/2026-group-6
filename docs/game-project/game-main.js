// 配置地图大小和角色大小
const GAME_SCALE = 3; // 画面放大倍数
const GRID_SIZE = 16; // 地图intgrid大小

let ldtkData;
let tilesetImage;
const FIXED_LEVEL_INDEX = 4; //关卡编号 0-?

// 游戏核心对象
let player;
let platforms = [];
let enemies = [];
let particles = [];
let camX = 0;
let camY = 0;
let gameStatus = "PLAY";

function preload() {
   ldtkData = loadJSON('../map/map-area4.ldtk');
   tilesetImage = loadImage('../resources/images/map_image/test_allgrid_8px.png');
}

function setup() {
   let canvas = createCanvas(1300, 750);

   // 使用 p5.js 的 DOM 样式控制
   canvas.style('display', 'block');
   canvas.style('margin', 'auto'); //让画面水平居中
   canvas.style('position', 'absolute');
   canvas.style('top', '50%');
   canvas.style('left', '50%');
   canvas.style('transform', 'translate(-50%, -50%)');
   // 给网页加深色背景
   document.body.style.backgroundColor = "#1a1a1a";
   document.body.style.margin = "0"; //消除网页边缘的空白
   document.body.style.overflow = "hidden"; // 防止出现滚动条

   canvas.elt.oncontextmenu = () => false;
   noSmooth();

   if (ldtkData) {
      loadLevel(FIXED_LEVEL_INDEX);
   }
}

function draw() {
   if (!ldtkData) return;

   // 逻辑更新
   if (gameStatus === "PLAY") {
      updateGameLogic();
   }

   // 渲染
   let level = ldtkData.levels[FIXED_LEVEL_INDEX];
   background(hexToRgb(level.__bgColor));

   push();
   scale(GAME_SCALE);
   translate(-camX, -camY);

   // 绘制 LDtk 视觉图层
   let layers = level.layerInstances;
   for (let i = layers.length - 1; i >= 0; i--) {
      let layer = layers[i];
      if (layer.__identifier !== "Entities") {
         drawLayerTiles(layer);
      }
   }

   // 绘制游戏物体
   for (let e of enemies) e.display();
   for (let p of particles) p.display();

   // 先画绳子，再画人
   player.ropeL.display(player);
   player.ropeR.display(player);
   player.display();

   pop();

   drawUI();

   if (gameStatus === "WIN") drawWinScreen();
   else if (gameStatus === "GAMEOVER") drawGameOverScreen();
}

// UI

function drawUI() {
   // 基础信息
   fill(255); noStroke(); textSize(12); textAlign(LEFT, TOP);

   // 材质状态显示 (左上角)
   let matL = player.ropeL.material;
   let matR = player.ropeR.material;

   // 左绳状态文字
   fill(matL === 'HARD' ? 255 : color(0, 255, 255));
   text(`[1] Left Mode: ${matL}`, 10, 30);

   // 右绳状态文字
   fill(matR === 'HARD' ? 255 : color(255, 100, 100));
   text(`[2] Right Mode: ${matR}`, 10, 50);


   // UI 位置定义
   let uiCenterX = width / 2;
   let uiBottomY = height - 60;
   let btnW = 50;
   let btnH = 40;
   let gap = 5; // 两个按钮之间的缝隙

   // 获取当前绳子状态 (只要不是 IDLE 闲置状态，就算"正在使用")
   let isLeftActive = player.ropeL.state !== "IDLE";
   let isRightActive = player.ropeR.state !== "IDLE";

   push();
   strokeWeight(2);
   textAlign(CENTER, CENTER);
   textSize(14);

   // left clike
   if (isLeftActive) {
      fill(100); // 灰色 (按下状态)
      stroke(150);
   } else {
      fill(0, 200, 200, 200); // 青色 (准备就绪)
      stroke(0, 255, 255);
   }

   // 画左边的半个鼠标形状
   rect(uiCenterX - btnW - gap / 2, uiBottomY, btnW, btnH, 10, 100, 0, 50);

   // 文字说明
   fill(255); noStroke();
   text("LMB", uiCenterX - btnW / 2 - gap / 2, uiBottomY + btnH / 2);

   // 上方的小提示文字
   textSize(10); fill(0, 255, 255);
   text("CYAN ROPE", uiCenterX - btnW / 2 - gap / 2, uiBottomY - 15);


   // Right Click
   strokeWeight(2);
   textSize(14);

   // 逻辑：如果正在使用，变灰；空闲显示亮红色
   if (isRightActive) {
      fill(100); // 灰色 (按下状态)
      stroke(150);
   } else {
      fill(200, 50, 50, 200); // 红色 (准备就绪)
      stroke(255, 100, 100);
   }

   // 画右边的半个鼠标形状
   rect(uiCenterX + gap / 2, uiBottomY, btnW, btnH, 100, 10, 50, 0);

   // 文字说明
   fill(255); noStroke();
   text("RMB", uiCenterX + btnW / 2 + gap / 2, uiBottomY + btnH / 2);

   // 上方的小提示文字
   textSize(10); fill(255, 100, 100);
   text("RED ROPE", uiCenterX + btnW / 2 + gap / 2, uiBottomY - 15);

   pop();

   // 底部总操作提示
   textAlign(CENTER); fill(150); textSize(12);
   text("[SPACE] Jump   [Q/Z] Left Winch   [E/C] Right Winch", width / 2, height - 10);
}

function drawWinScreen() {
   background(0, 150); fill(255); textAlign(CENTER); textSize(40);
   text("YOU WON!", width / 2, height / 2);
   textSize(20); text("Press R to Restart", width / 2, height / 2 + 50);
}

function drawGameOverScreen() {
   background(50, 0, 0, 150); fill(255); textAlign(CENTER); textSize(40);
   text("DIED", width / 2, height / 2);
   textSize(20); text("Press R to Restart", width / 2, height / 2 + 50);
}

//  逻辑更新

function updateGameLogic() {
   player.update();

   let level = ldtkData.levels[FIXED_LEVEL_INDEX];
   let mapW = level.pxWid;
   let mapH = level.pxHei;

   // 摄像机跟随
   let targetCamX = player.x - (width / GAME_SCALE) / 2;
   let targetCamY = player.y - (height / GAME_SCALE) / 2;

   targetCamX = constrain(targetCamX, 0, mapW - (width / GAME_SCALE));
   targetCamY = constrain(targetCamY, 0, mapH - (height / GAME_SCALE));

   camX = lerp(camX, targetCamX, 0.1);
   camY = lerp(camY, targetCamY, 0.1);

   // 敌人逻辑
   for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      e.update();

      // rope fire 伤害判定
      [player.ropeL, player.ropeR].forEach(rope => {
         if (rope.state === "EXTENDING" || rope.state === "SWINGING") {
            let tip = rope.getTip(player);
            if (dist(tip.x, tip.y, e.x + e.w / 2, e.y + e.h / 2) < 10 && !e.purified) {
               e.takeDamage(1);
               spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "HIT");
               if (rope.state === "EXTENDING") rope.state = "RETRACTING";
            }
         }
      });

      if (e.hp <= 0) enemies.splice(i, 1);
   }

   for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      if (particles[i].life <= 0) particles.splice(i, 1);
   }

   // 胜负判定(乱写的)
   if (player.x > mapW - 16) gameStatus = "WIN";
   if (player.y > mapH + 32) gameStatus = "GAMEOVER";
}

// 输入处理

function mousePressed() {
   if (gameStatus === "PLAY") {
      let gameMouseX = mouseX / GAME_SCALE + camX;
      let gameMouseY = mouseY / GAME_SCALE + camY;
      if (mouseButton === LEFT) player.fireRope("LEFT", gameMouseX, gameMouseY);
      if (mouseButton === RIGHT) player.fireRope("RIGHT", gameMouseX, gameMouseY);
   }
}

function keyPressed() {
   if (gameStatus === "PLAY") {
      if (key === ' ') player.jump();
      if (key === '1') player.ropeL.toggleMaterial(player);
      if (key === '2') player.ropeR.toggleMaterial(player);
   }

   if ((gameStatus === "WIN" || gameStatus === "GAMEOVER") && (key === 'r' || key === 'R')) {
      loadLevel(FIXED_LEVEL_INDEX);
   }
   if (gameStatus === "PLAY" && (key === 'r' || key === 'R')) {
      loadLevel(FIXED_LEVEL_INDEX);
   }
}

// 粒子效果
class Particle {
   constructor(x, y, t) { this.x = x; this.y = y; this.vx = random(-2, 2); this.vy = random(-2, 2); this.life = 255; }
   update() { this.x += this.vx; this.y += this.vy; this.life -= 15; }
   display() { fill(0, 255, 255, this.life); noStroke(); ellipse(this.x, this.y, 2, 2); }
}

// 粒子生成
function spawnParticles(x, y, t) {
   for (let i = 0; i < 5; i++) particles.push(new Particle(x, y, t));
}