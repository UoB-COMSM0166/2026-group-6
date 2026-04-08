// Import the Physics class you want to test
const { Physics } = require('../game-project/assist/physics');

describe('White-Box: Physics Collision Tests', () => {
  
  test('rectIntersect - should correctly detect two intersecting rectangles', () => {
    // Rectangle A: x=0, y=0, w=10, h=10
    // Rectangle B: x=5, y=5, w=10, h=10
    const result = Physics.rectIntersect(0, 0, 10, 10, 5, 5, 10, 10);
    expect(result).toBe(true);
  });

  test('rectIntersect - should correctly detect two non-intersecting rectangles', () => {
    // Rectangle A: x=0, y=0, w=10, h=10
    // Rectangle B: x=20, y=20, w=5, h=5
    const result = Physics.rectIntersect(0, 0, 10, 10, 20, 20, 5, 5);
    expect(result).toBe(false);
  });

  test('pointRect - should correctly detect if a point is inside a rectangle', () => {
    // Rectangle: x=10, y=10, w=20, h=20
    expect(Physics.pointRect(15, 15, 10, 10, 20, 20)).toBe(true);  // Inside
    expect(Physics.pointRect(5, 5, 10, 10, 20, 20)).toBe(false);   // Outside
  });

  test('lineLineIntersect - should detect the intersection point of two line segments', () => {
    // Line segment 1: (0,0) to (10,10)
    // Line segment 2: (0,10) to (10,0)
    const intersect = Physics.lineLineIntersect(0, 0, 10, 10, 0, 10, 10, 0);
    expect(intersect).not.toBeNull();
    expect(intersect.x).toBe(5);
    expect(intersect.y).toBe(5);
  });
});