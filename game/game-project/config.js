const GameConfig = {
   // === 世界基础 ===
   World: {
      GRID_SIZE: 16,
      GRAVITY: 0.35,
      SOLID_TYPES: ["ground", "spaceship", "mechanism", "wall"],
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
      SPEED: 0.5,
      CLIMB_SPEED: 0.05,
      WINCH_FORCE: 0.3,
      JUMPFORCE: 5,
      InvulInterval: 30,
      KnockInterval: 15,
   },

   // === 敌人 ===
   Enemy: {
      SPEED: 0.5,
      JUMPFORCE: 3.5,
      DROP_DEPTH_TILES: 3,
   },

   Entity: {
      PlayerStart: "Player_start",
      ToxicPool: "toxic_poor",
   },

   // === 绳索 ===
   Rope: {
      STIFFNESS: 16,
   },
};
