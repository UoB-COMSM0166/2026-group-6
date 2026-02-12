let levelData;
let currentLevelIndex = 0;

let player;
let enemies = [];

// 🌟 新增：全局地图记忆库！用来持久化保存每个房间的方块状态
let levelGrids = {}; 
let collisionGrid = [];
let cols, rows;
const TILE_SIZE = 16; 

let levelWidth = 0;
let levelHeight = 0;

function preload() {
  levelData = loadJSON('level.json');
}

function setup() {
  createCanvas(640, 360); 
  if (!levelData || !levelData.levels) {
    console.error("未能加载 JSON 数据！");
    return;
  }
  loadLevel(0);
}

function loadLevel(index) {
  if (index < 0 || index >= levelData.levels.length) return;
  
  currentLevelIndex = index;
  let currentLevel = levelData.levels[index];
  
  levelWidth = currentLevel.pxWid;
  levelHeight = currentLevel.pxHei;

  resizeCanvas(levelWidth * 2, levelHeight * 2);
  
  enemies = [];
  let layers = currentLevel.layerInstances;
  
  let collisionLayer = layers.find(l => l.__identifier === "IntGrid");
  if (collisionLayer) {
    cols = collisionLayer.__cWid;
    rows = collisionLayer.__cHei;
    
    // 🌟 核心修改 1：检查记忆库中是否已经有这个房间的数据了？
    if (!levelGrids[index]) {
      // 如果没有，就从原始数据克隆一份存进去
      levelGrids[index] = [...collisionLayer.intGridCsv]; 
    }
    // 把当前房间的碰撞网格指向记忆库中的数据
    // 这样你在游戏中修改了 collisionGrid，就等于修改了 levelGrids[index]，死亡重载也不会丢失！
    collisionGrid = levelGrids[index];
  }
  
  let entityLayer = layers.find(l => l.__identifier === "Actors");
  if (entityLayer) {
    for (let entity of entityLayer.entityInstances) {
      if (entity.__identifier === "Player" && !player) {
        player = new Player(entity.px[0], entity.px[1]);
      }
      
      if (entity.__identifier === "Enemy") {
        let speedField = entity.fieldInstances.find(f => f.__identifier === "Speed");
        let pointsField = entity.fieldInstances.find(f => f.__identifier === "Point");
        let speed = speedField ? speedField.__value : 1;
        let patrolPoints = [];
        if (pointsField && pointsField.__value) {
          for (let pt of pointsField.__value) {
            patrolPoints.push({
              x: pt.cx * TILE_SIZE + (TILE_SIZE / 2),
              y: pt.cy * TILE_SIZE + (TILE_SIZE / 2)
            });
          }
        }
        enemies.push(new Enemy(entity.px[0], entity.px[1], patrolPoints, speed));
      }
    }
  }
}

function draw() {
  background(105, 106, 121); 
  
  // ============================
  // 第一部分：绘制游戏世界 (缩放 2 倍)
  // ============================
  push(); // 隔离绘图状态
  scale(2); 

  drawGrid(); 
  
  for (let enemy of enemies) {
    enemy.update();
    enemy.display();
  }
  
  if (player) {
    player.update();
    player.display();
  }
  pop(); // 恢复原始比例，准备画 UI

  // ============================
  // 第二部分：绘制 UI 系统 (1:1 屏幕比例)
  // ============================
  if (player) {
    drawUI();
  }
}

// 🌟 新增：独立绘制 UI (血量、小地图、大地图)
function drawUI() {
  // 1. 绘制左上角血量
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text(`HP: ${player.hp} / ${player.maxHp}`, 15, 15);

  // 2. 判断按键 M (KeyCode 77) 是否按下
  if (keyIsDown(77)) {
    drawFullWorldMap(); // 按住 M 时画世界大地图
  } else {
    drawMiniMap();      // 否则画右上角小地图
  }
}

// 🌟 新增：右上角房间小地图
function drawMiniMap() {
  let mapW = width * 0.2; // 占用屏幕宽度的 20%
  let mapH = (levelHeight / levelWidth) * mapW; // 保持房间原始比例
  let padding = 15;
  let mapX = width - mapW - padding;
  let mapY = padding;

  // 画半透明底板
  fill(0, 0, 0, 150);
  noStroke();
  rectMode(CORNER);
  rect(mapX, mapY, mapW, mapH, 5); // 5 是圆角

  // 计算小地图里的 1 个方块等于多少像素
  let scaleX = mapW / cols;
  let scaleY = mapH / rows;

  // 画出地形缩影
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let val = collisionGrid[y * cols + x];
      if (val === 4 || val === 50) fill(255, 255, 255, 180); // 实体墙/实体化隐藏砖
      else if (val === 3) fill(47, 105, 190, 180); // 水
      else if (val === 2) fill(97, 190, 47, 180);  // 存档点
      else if (val === 5) fill(190, 178, 47, 100); // 虚拟隐藏砖
      else continue;

      rect(mapX + x * scaleX, mapY + y * scaleY, scaleX, scaleY);
    }
  }

  // 画玩家红点
  fill(255, 50, 50);
  let px = (player.x / levelWidth) * mapW;
  let py = (player.y / levelHeight) * mapH;
  ellipse(mapX + px, mapY + py, 6, 6);
}

// 🌟 新增：全屏世界大地图
function drawFullWorldMap() {
  // 1. 遍历计算整个游戏世界的边界 (最小 X/Y 和最大 X/Y)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let l of levelData.levels) {
    if (l.worldX < minX) minX = l.worldX;
    if (l.worldY < minY) minY = l.worldY;
    if (l.worldX + l.pxWid > maxX) maxX = l.worldX + l.pxWid;
    if (l.worldY + l.pxHei > maxY) maxY = l.worldY + l.pxHei;
  }
  
  let worldW = maxX - minX;
  let worldH = maxY - minY;
  
  // 2. 让大地图最大占屏幕的 80%，计算缩放比例
  let maxMapW = width * 0.8;
  let maxMapH = height * 0.8;
  let scaleF = Math.min(maxMapW / worldW, maxMapH / worldH);
  
  let mapDisplayW = worldW * scaleF;
  let mapDisplayH = worldH * scaleF;
  let offsetX = (width - mapDisplayW) / 2;
  let offsetY = (height - mapDisplayH) / 2;

  // 画全屏半透明遮罩
  fill(0, 0, 0, 220);
  rectMode(CORNER);
  rect(0, 0, width, height);

  // 画地图外框
  stroke(255);
  strokeWeight(2);
  noFill();
  rect(offsetX, offsetY, mapDisplayW, mapDisplayH);
  noStroke();

  // 画出所有的关卡矩形
  for (let i = 0; i < levelData.levels.length; i++) {
    let l = levelData.levels[i];
    let lx = offsetX + (l.worldX - minX) * scaleF;
    let ly = offsetY + (l.worldY - minY) * scaleF;
    let lw = l.pxWid * scaleF;
    let lh = l.pxHei * scaleF;
    
    if (i === currentLevelIndex) {
      fill(100, 150, 255, 180); // 玩家当前所在的房间高亮成蓝色
    } else {
      fill(150, 150, 150, 100); // 其它房间灰色
    }
    stroke(255, 255, 255, 50);
    strokeWeight(1);
    rect(lx, ly, lw, lh);
  }

  // 画玩家当前的绝对坐标红点
  let currentLevel = levelData.levels[currentLevelIndex];
  let pwX = offsetX + (player.x + currentLevel.worldX - minX) * scaleF;
  let pwY = offsetY + (player.y + currentLevel.worldY - minY) * scaleF;
  fill(255, 50, 50);
  noStroke();
  ellipse(pwX, pwY, 10, 10); // 红点大一点，更醒目

  // 标题提示
  fill(255);
  textAlign(CENTER, BOTTOM);
  textSize(24);
  text("- WORLD MAP -", width / 2, offsetY - 20);
}

function getTileAt(px, py) {
  if (px < 0 || px >= levelWidth || py < 0 || py >= levelHeight) return 0;
  let gridX = floor(px / TILE_SIZE);
  let gridY = floor(py / TILE_SIZE);
  let index = gridY * cols + gridX;
  return collisionGrid[index];
}

function isWall(px, py) {
  if (px < 0 || px >= levelWidth || py < 0 || py >= levelHeight) return false;
  let gridX = floor(px / TILE_SIZE);
  let gridY = floor(py / TILE_SIZE);
  let index = gridY * cols + gridX;
  return collisionGrid[index] === 4 || collisionGrid[index] === 50; 
}

function drawGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let index = y * cols + x;
      let val = collisionGrid[index];
      
      rectMode(CORNER);
      noStroke();
      if (val === 4) { 
        fill(0); 
        rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (val === 3) { 
        fill(47, 105, 190, 200); 
        rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (val === 2) { 
        fill(97, 190, 47, 180); 
        rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else if (val === 5) { 
        stroke(190, 178, 47, 150); 
        strokeWeight(1);
        fill(190, 178, 47, 60); 
        rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        noStroke();
      } else if (val === 50) { 
        fill(190, 178, 47); 
        rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

// ============================
// 玩家与怪物类保留不变（无需修改即可支持新逻辑）
// ============================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 12;  
    this.height = 15; 
    
    this.vx = 0;
    this.vy = 0;
    this.speed = 2; 
    this.gravity = 0.4;
    this.jumpForce = -8; 
    this.isGrounded = false;

    this.maxHp = 20; 
    this.hp = this.maxHp;
    this.invulnerableTimer = 0; 
    this.knockbackTimer = 0;    

    this.respawnX = x;
    this.respawnY = y;
    this.respawnLevelIndex = currentLevelIndex;
    
    this.showInteractPrompt = false; 
    this.promptText = ""; 
  }

  checkEnvironment() {
    this.showInteractPrompt = false; 
    this.promptText = "";

    let centerTile = getTileAt(this.x, this.y);
    let bottomTile = getTileAt(this.x, this.y + this.height / 2 - 1);
    
    if (centerTile === 3 || bottomTile === 3) {
      this.die();
      return true; 
    }
    
    if (centerTile === 2 || bottomTile === 2) {
      this.showInteractPrompt = true; 
      this.promptText = "Press E to Save";
      if (keyIsDown(69) || keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
        this.respawnX = this.x;
        this.respawnY = this.y;
        this.respawnLevelIndex = currentLevelIndex;
        this.hp = this.maxHp; 
      }
    }

    let left = this.x - this.width / 2;
    let right = this.x + this.width / 2;
    let top = this.y - this.height / 2;
    let bottom = this.y + this.height / 2;
    
    let testPoints = [
      {x: this.x, y: this.y},
      {x: left + 2, y: bottom - 2},
      {x: right - 2, y: bottom - 2},
      {x: left + 2, y: top + 2},
      {x: right - 2, y: top + 2}
    ];

    for (let pt of testPoints) {
      let gx = floor(pt.x / TILE_SIZE);
      let gy = floor(pt.y / TILE_SIZE);
      let idx = gy * cols + gx;
      
      if (collisionGrid[idx] === 5) {
        this.showInteractPrompt = true;
        this.promptText = "Press E to Reveal";
        
        if (keyIsDown(69)) {
          collisionGrid[idx] = 50; 
          this.y = gy * TILE_SIZE - this.height / 2 - 0.01;
          this.vy = 0; 
          break; 
        }
      }
    }
    return false;
  }

  checkEnemyCollision() {
    if (this.invulnerableTimer > 0) return; 
    for (let enemy of enemies) {
      if (Math.abs(this.x - enemy.x) < (this.width / 2 + enemy.width / 2) &&
          Math.abs(this.y - enemy.y) < (this.height / 2 + enemy.height / 2)) {
          this.takeDamage(enemy);
          break; 
      }
    }
  }

  takeDamage(enemy) {
    this.hp -= 5; 
    if (this.hp <= 0) {
      this.die();
      return;
    }
    this.invulnerableTimer = 60; 
    this.knockbackTimer = 15;    
    let pushDirection = (this.x < enemy.x) ? -1 : 1;
    this.vx = pushDirection * 3; 
    this.vy = -4;                
  }

  die() {
    if (currentLevelIndex !== this.respawnLevelIndex) {
      loadLevel(this.respawnLevelIndex);
    }
    this.x = this.respawnX;
    this.y = this.respawnY;
    this.vx = 0;
    this.vy = 0;
    this.hp = this.maxHp; 
    this.invulnerableTimer = 0;
    this.knockbackTimer = 0;
  }

  update() {
    let isDead = this.checkEnvironment();
    if (isDead) return; 

    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    if (this.knockbackTimer > 0) {
      this.knockbackTimer--;
    } else {
      this.vx = 0;
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { this.vx = -this.speed; }
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { this.vx = this.speed; }
    }

    this.x += this.vx;
    if (this.checkCollision(this.x, this.y)) {
      if (this.vx > 0) {
        let rightEdge = this.x + this.width / 2;
        let wallLeftEdge = floor(rightEdge / TILE_SIZE) * TILE_SIZE;
        this.x = wallLeftEdge - this.width / 2 - 0.01;
      } else if (this.vx < 0) {
        let leftEdge = this.x - this.width / 2;
        let wallRightEdge = floor(leftEdge / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
        this.x = wallRightEdge + this.width / 2 + 0.01;
      }
    }

    let isJumpKeyDown = keyIsDown(UP_ARROW) || keyIsDown(87);

    if (isJumpKeyDown && this.isGrounded && this.knockbackTimer <= 0) { 
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }
    
    let currentGravity = this.gravity; 
    if (this.vy < 0 && !isJumpKeyDown && this.knockbackTimer <= 0) {
      currentGravity = this.gravity * 3; 
    }

    this.vy += currentGravity; 
    this.y += this.vy;
    this.isGrounded = false; 

    if (this.checkCollision(this.x, this.y)) {
      if (this.vy > 0) {
        let bottomEdge = this.y + this.height / 2;
        let floorTopEdge = floor(bottomEdge / TILE_SIZE) * TILE_SIZE;
        this.y = floorTopEdge - this.height / 2 - 0.01;
        this.vy = 0;
        this.isGrounded = true; 
      } else if (this.vy < 0) {
        let topEdge = this.y - this.height / 2;
        let ceilingBottomEdge = floor(topEdge / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
        this.y = ceilingBottomEdge + this.height / 2 + 0.01;
        this.vy = 0;
      }
    }

    this.checkEnemyCollision();
    this.checkRoomTransition();
  }

  checkCollision(x, y) {
    let left = x - this.width / 2;
    let right = x + this.width / 2;
    let top = y - this.height / 2;
    let bottom = y + this.height / 2;
    return isWall(left, top) || isWall(right, top) || isWall(left, bottom) || isWall(right, bottom);
  }

  checkRoomTransition() {
    let currentLevel = levelData.levels[currentLevelIndex];

    if (this.x < 0 || this.x > levelWidth || this.y < 0 || this.y > levelHeight) {
      let worldX = this.x + currentLevel.worldX;
      let worldY = this.y + currentLevel.worldY;

      let nextLevelIndex = -1;
      for (let i = 0; i < levelData.levels.length; i++) {
        if (i === currentLevelIndex) continue;
        let l = levelData.levels[i];
        if (worldX >= l.worldX && worldX <= l.worldX + l.pxWid &&
            worldY >= l.worldY && worldY <= l.worldY + l.pxHei) {
            nextLevelIndex = i;
            break;
        }
      }

      if (nextLevelIndex !== -1) {
        let nextLevel = levelData.levels[nextLevelIndex];
        loadLevel(nextLevelIndex);
        this.x = worldX - nextLevel.worldX;
        this.y = worldY - nextLevel.worldY;
      } else {
        if (this.x < 0) this.x = this.width / 2;
        if (this.x > levelWidth) this.x = levelWidth - this.width / 2;
        if (this.y < 0) { this.y = this.height / 2; this.vy = 0; }
        if (this.y > levelHeight) { this.y = levelHeight - this.height / 2; this.vy = 0; this.isGrounded = true; }
      }
    }
  }

  display() {
    if (this.invulnerableTimer > 0 && floor(this.invulnerableTimer / 5) % 2 === 0) {
      // 闪烁跳过
    } else {
      if (this.knockbackTimer > 0) fill(255, 100, 100); 
      else fill(63, 96, 130); 
      
      noStroke();
      rectMode(CENTER);
      rect(this.x, this.y, this.width, this.height);
    }
    
    if (this.showInteractPrompt) {
      fill(255);
      textAlign(CENTER, BOTTOM);
      textSize(8);
      text(this.promptText, this.x, this.y - this.height);
    }
  }
}

class Enemy {
  constructor(x, y, points, speed) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.speed = speed;
    this.patrolPoints = points;
    this.currentTargetIndex = 0;
  }
  update() {
    if (this.patrolPoints.length === 0) return;
    let target = this.patrolPoints[this.currentTargetIndex];
    let dx = target.x - this.x;
    let dy = target.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.speed) {
      this.x = target.x;
      this.y = target.y;
      this.currentTargetIndex = (this.currentTargetIndex + 1) % this.patrolPoints.length;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  display() {
    fill(218, 48, 9); 
    noStroke();
    rectMode(CENTER);
    rect(this.x, this.y, this.width, this.height);
  }
}