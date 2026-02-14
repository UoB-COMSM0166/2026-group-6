// 粒子效果
class Particle {
    constructor(x, y, t) {
        this.x = x;
        this.y = y;
        this.vx = random(-2, 2);
        this.vy = random(-2, 2);
        this.life = 255;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 15;
    }
    display() {
        fill(0, 255, 255, this.life);
        noStroke();
        ellipse(this.x, this.y, 2, 2);
    }
    static spawn(x, y, t) {
        // 这里的 5 是生成数量
        for (let i = 0; i < 5; i++) {
            // 注意：这里依然依赖全局变量 particles
            particles.push(new Particle(x, y, t));
        }
    }
}