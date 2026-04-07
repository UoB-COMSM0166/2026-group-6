// 引入你要测试的物理类
const { Physics } = require('../game-project/assist/physics');

describe('White-Box: Physics Collision Tests', () => {
  
  test('rectIntersect - 应该正确检测两个矩形相交', () => {
    // 矩形 A: x=0, y=0, w=10, h=10
    // 矩形 B: x=5, y=5, w=10, h=10
    const result = Physics.rectIntersect(0, 0, 10, 10, 5, 5, 10, 10);
    expect(result).toBe(true);
  });

  test('rectIntersect - 应该正确检测两个矩形不相交', () => {
    // 矩形 A: x=0, y=0, w=10, h=10
    // 矩形 B: x=20, y=20, w=5, h=5
    const result = Physics.rectIntersect(0, 0, 10, 10, 20, 20, 5, 5);
    expect(result).toBe(false);
  });

  test('pointRect - 应该正确检测点是否在矩形内', () => {
    // 矩形: x=10, y=10, w=20, h=20
    expect(Physics.pointRect(15, 15, 10, 10, 20, 20)).toBe(true);  // 在内部
    expect(Physics.pointRect(5, 5, 10, 10, 20, 20)).toBe(false);   // 在外部
  });

  test('lineLineIntersect - 应该检测线段交叉点', () => {
    // 线段1: (0,0) 到 (10,10)
    // 线段2: (0,10) 到 (10,0)
    const intersect = Physics.lineLineIntersect(0, 0, 10, 10, 0, 10, 10, 0);
    expect(intersect).not.toBeNull();
    expect(intersect.x).toBe(5);
    expect(intersect.y).toBe(5);
  });
});