const GameConfig = {
   // === 世界基础 ===
   World: {
      GRID_SIZE: 16,
      GRAVITY: 0.35,
      FrictionalForce: 0.83,
      AirFrictionalForce: 0.9,
      SOLID_TYPES: ["ground", "spaceship", "mechanism"],
   },

   // === 显示 ===
   Display: {
      GAME_SCALE: 3,
      MAX_CANVAS_WIDTH: 1000,
      MAX_CANVAS_HEIGHT: 700,
   },

   // === 关卡 ===
   Level: {
      START_INDEX: 0,
   },

   // === 玩家 ===
   Player: {
      MAX_HP: 20,
      MAXCleanEnergy: 100,
      SPEED: 0.5,
      CLIMB_SPEED: 0.05,
      WINCH_FORCE: 0.3,
      JUMPFORCE: 5,
      InvulInterval: 30,
      KnockInterval: 15,
      DefaultStartPoint: { x: 10, y: 30 },
      AttackConsume: 5,
   },

   // === 敌人 ===
   Enemy: {
      SPEED: 0.5,
      JUMPFORCE: 3.5,
      DROP_DEPTH_TILES: 2.5,
   },

   Entity: {
      Enemy: "Enemy",
      PlayerStart: "Player_start", // only one in the world
      PollutionCore: "Pollution_Core",
      Tool: "Tools",
      Boss: "Boss",
      CleanEnergy: "Cleaning_energy",
      Ladder: "Ladder",
      Rest: "Rest",
   },

   Collision: {
      ToxicPool: "toxic_poor",
   },

   // === 绳索 ===
   Rope: {
      // 长度
      NODE_SPACING_GRIDS: 0.4,        // 节点间距 (格)
      MAX_LENGTH_GRIDS: 6.5,            // 最大绳长 (格) 可变
      MIN_LENGTH_GRIDS: 1,            // 绞盘最短长度 (格)

      // 发射
      LAUNCH_SPEED_GRIDS: 1,        // 发射初速度 (格/帧)
      TIP_GRAVITY: 0.12,              // 绳头重力 (像素/帧²)
      TIP_AIR_DRAG: 0.995,            // 绳头空气阻力
      HEAD_MASS: 4.0,                 // 绳头质量  可变
      EXTENDING_GRAVITY_SCALE: 0.09,  // 发射阶段节点重力缩放

      // Verlet 模拟
      VERLET_DAMPING: 0.98,           // 节点速度衰减
      NODE_GRAVITY: 0.35,             // 节点重力
      STIFFNESS: 30,                  // 距离约束迭代次数
      CONSTRAINT_FACTOR: 0.3,         // 约束修正系数

      // 玩家约束 (软绳)
      PULL_STRENGTH: 0.01,             // 超出绳长时拉回力
      PULL_DAMPING: 0.9,              // 拉回时速度衰减

      // 玩家约束 (硬绳)
      HARD_SPRING_STRENGTH: 0.2,      // 弹簧力度
      HARD_SPRING_DAMPING: 0.9,       // 弹簧阻尼
      HARD_SPRING_THRESHOLD: 1,       // 距离偏差阈值 (像素)

      // 收回
      RETRACT_INTERVAL: 1,            // 每隔几帧删一个节点

      // 渲染
      STROKE_RATIO: 1 / 6,
      STROKE_MIN: 1,
      HARD_STROKE_RATIO: 1 / 5,
      HARD_STROKE_MIN: 2,
      ANCHOR_DOT_RATIO: 1 / 3,
      TIP_DOT_RATIO: 1 / 4,

      // 硬绳碰撞盒
      COLLISION_BOX_RATIO: 0.5,
   },
};
