// Mock p5.js global functions and GameConfig to prevent Node environment errors
global.color = (r, g, b) => ({ r, g, b });
global.random = (min, max) => min;
global.GameConfig = {
  World: { GRID_SIZE: 16 },
  Player: { MAX_HP: 20, MAXCleanEnergy: 100, JUMPFORCE: 5, InvulInterval: 30 }
};

// Mock dependencies (Rope and Resourcepanel)
global.Rope = class { constructor() { this.state = 'IDLE'; this.maxLen = 100; } };
global.Resourcepanel = class { constructor() {} };

// Import the Player class
const { Player } = require('../game-project/player');

describe('White-Box: Player State & Logic Tests', () => {
  let player;
  
  beforeEach(() => {
    player = new Player(100, 100);
  });

  test('Player initial properties should be correct', () => {
    expect(player.hp).toBe(20);
    expect(player.cleanEnergy).toBe(100);
    expect(player.x).toBe(100);
  });

  test('takeDamage - taking damage should reduce HP and trigger invincibility frames', () => {
    const mockGm = {};
    player.takeDamage(5, mockGm);
    
    expect(player.hp).toBe(15); // 20 - 5
    expect(player.invulnerableTimer).toBe(GameConfig.Player.InvulInterval);
    expect(player.floatingTexts.length).toBeGreaterThan(0); // Should have generated floating damage text
  });

  test('reduceCleanEnergy - should successfully deduct when energy is sufficient', () => {
    const success = player.checkRemainCleanEnergy(20);
    expect(success).toBe(true);
    
    player.reduceCleanEnergy(20);
    expect(player.cleanEnergy).toBe(80);
  });

  test('restoreHp - healing cannot exceed MaxHP', () => {
    player.hp = 10;
    player.restoreHp(5);
    expect(player.hp).toBe(15);

    player.restoreHp(20);
    expect(player.hp).toBe(20); // Capped at 20
  });
});