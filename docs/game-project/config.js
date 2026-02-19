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
      START_INDEX: 5,
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
      DefaultStartPoint: { x: 5, y: 30 },
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
      STIFFNESS: 16,
   },
};
