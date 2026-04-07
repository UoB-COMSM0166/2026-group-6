// 模拟 p5.js 的全局函数和 GameConfig，防止 Node 环境报错
global.color = (r, g, b) => ({ r, g, b });
global.random = (min, max) => min;
global.GameConfig = {
  World: { GRID_SIZE: 16 },
  Player: { MAX_HP: 20, MAXCleanEnergy: 100, JUMPFORCE: 5, InvulInterval: 30 }
};

// 模拟依赖项 (Rope 和 Resourcepanel)
global.Rope = class { constructor() { this.state = 'IDLE'; this.maxLen = 100; } };
global.Resourcepanel = class { constructor() {} };

// 引入 Player 类
const { Player } = require('../game-project/player');

describe('White-Box: Player State & Logic Tests', () => {
  let player;
  
  beforeEach(() => {
    player = new Player(100, 100);
  });

  test('Player 初始化属性应正确', () => {
    expect(player.hp).toBe(20);
    expect(player.cleanEnergy).toBe(100);
    expect(player.x).toBe(100);
  });

  test('takeDamage - 受到伤害应扣除 HP 并触发无敌帧', () => {
    const mockGm = {};
    player.takeDamage(5, mockGm);
    
    expect(player.hp).toBe(15); // 20 - 5
    expect(player.invulnerableTimer).toBe(GameConfig.Player.InvulInterval);
    expect(player.floatingTexts.length).toBeGreaterThan(0); // 应该生成了浮动伤害文字
  });

  test('reduceCleanEnergy - 能量足够时应成功扣除', () => {
    const success = player.checkRemainCleanEnergy(20);
    expect(success).toBe(true);
    
    player.reduceCleanEnergy(20);
    expect(player.cleanEnergy).toBe(80);
  });

  test('restoreHp - 回血不能超过 MaxHP', () => {
    player.hp = 10;
    player.restoreHp(5);
    expect(player.hp).toBe(15);

    player.restoreHp(20);
    expect(player.hp).toBe(20); // 封顶 20
  });
});