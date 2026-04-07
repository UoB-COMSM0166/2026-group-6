const GameConfig = {
   World: {
      GRID_SIZE: 16,
      GRAVITY: 0.35,
      FrictionalForce: 0.75,
      AirFrictionalForce: 0.9,
      SOLID_TYPES: ["ground", "spaceship", "mechanism"],
      PURIFY_CHANGE_THRESHOLD: 75,
   },

   Display: {
      GAME_SCALE: 3,
      MAX_CANVAS_WIDTH: 1000,
      MAX_CANVAS_HEIGHT: 700,
   },

   Level: {
      START_INDEX: 0,
      // define weight
      CORE_WEIGHT: 5,
      ENEMY_WEIGHT: 1,
      BOSS_WEIGHT: 3,
   },

   Player: {
      MAX_HP: 20,
      MAXCleanEnergy: 100,
      SPEED: 0.5,
      WATER_SPEED: 0.5,
      CLIMB_SPEED: 0.05,
      WINCH_FORCE: 0.3,
      JUMPFORCE: 5,
      InvulInterval: 30,
      KnockInterval: 15,
      DefaultStartPoint: { x: 10, y: 30 },
      AttackConsume: 5,
   },

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
      Painting: "Painting",
      TeleportationGate: "Teleportation_Gate",
      EndingButton: "Endingbutton",
      GateWall: "GateWall",
      Button: "Button",
   },

   Collision: {
      ToxicPool: "toxic_poor",
      Water: "water",
      Ground: "ground",
   },

   Rope: {
      // len
      NODE_SPACING_GRIDS: 0.3,
      MAX_LENGTH_GRIDS: 6,            // can change
      MIN_LENGTH_GRIDS: 1,

      // fire
      LAUNCH_SPEED_GRIDS: 1,
      TIP_GRAVITY: 0.09,
      TIP_AIR_DRAG: 0.995,
      HEAD_MASS: 4.0,                 // can change
      EXTENDING_GRAVITY_SCALE: 0.09,

      // Verlet stimulate
      VERLET_DAMPING: 0.98,
      NODE_GRAVITY: 0.35,
      STIFFNESS: 25,

      // player stirct
      HARD_SPRING_STRENGTH: 0.2,
      HARD_SPRING_DAMPING: 0.9,
      HARD_SPRING_THRESHOLD: 1,

      RETRACT_INTERVAL: 1,

      // render
      STROKE_RATIO: 1 / 6,
      STROKE_MIN: 1,
      HARD_STROKE_RATIO: 1 / 5,
      HARD_STROKE_MIN: 2,
      ANCHOR_DOT_RATIO: 1 / 3,
      TIP_DOT_RATIO: 1 / 4,

      // collision
      COLLISION_BOX_RATIO: 0.5,
   },
};

if (typeof module !== 'undefined') { 
  module.exports = { GameConfig }; 
}
