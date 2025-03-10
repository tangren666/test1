// 游戏常量
const CANVAS_WIDTH = 792;
const CANVAS_HEIGHT = 1828;
const BIRD_WIDTH = 90;
const BIRD_HEIGHT = 67.5;
const PIPE_WIDTH = 60;
const PIPE_GAP = 250;
const GRAVITY = 0.175;
const FLAP_FORCE = -4.2;
const PIPE_SPEED = 1.4;

// 小鸟类
class Bird {
    constructor() {
        this.x = CANVAS_WIDTH / 4;
        this.y = CANVAS_HEIGHT / 2;
        this.width = BIRD_WIDTH;
        this.height = BIRD_HEIGHT;
        this.velocity = 0;
        this.rotation = 0;
        this.particles = [];
        
        // 加载小鸟图片
        this.image = new Image();
        this.image.onload = () => {
            console.log('小鸟图片加载成功');
        };
        this.image.onerror = (error) => {
            console.error('小鸟图片加载失败:', error);
        };
        this.image.src = 'player.jpg';
    }

    update(deltaTime) {
        // 应用重力，确保每帧只加一次重力加速度，添加时间补偿
        const timeCompensation = deltaTime / 16.67; // 基于60FPS的时间补偿
        this.velocity += GRAVITY * timeCompensation;
        // 限制最大下落速度
        this.velocity = Math.min(this.velocity, 15);
        this.y += this.velocity * timeCompensation;

        // 更新旋转角度
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.velocity * 0.1));

        // 防止小鸟飞出屏幕
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        if (this.y + this.height > CANVAS_HEIGHT) {
            this.y = CANVAS_HEIGHT - this.height;
            this.velocity = 0;
        }

        // 添加新的尾迹粒子
        if (this.velocity < 0) { // 只在上升时产生尾迹
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                size: Math.random() * 3 + 2,
                life: 1.0,
                color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`
            });
        }

        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime * 0.001;
            particle.x -= 2;
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 绘制尾迹粒子
        ctx.save();
        for (const particle of this.particles) {
            ctx.beginPath();
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life;
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 绘制小鸟
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // 获取图片的原始宽高比
        const aspectRatio = this.image.naturalWidth / this.image.naturalHeight;
        // 根据高度计算保持比例的宽度
        const scaledWidth = this.height * aspectRatio;
        // 居中显示图片
        const offsetX = (this.width - scaledWidth) / 2;
        
        ctx.drawImage(this.image, -scaledWidth / 2, -this.height / 2, scaledWidth, this.height);
        ctx.restore();
    }

    flap() {
        this.velocity = FLAP_FORCE;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// 管道类
class Pipe {
    constructor(x) {
        this.x = x;
        this.width = PIPE_WIDTH;
        // 限制通道在画布中间区域，上下浮动范围为画布高度的30%
        const middleY = CANVAS_HEIGHT / 2;
        const fluctuationRange = CANVAS_HEIGHT * 0.3;
        this.gapY = middleY - fluctuationRange/2 + Math.random() * fluctuationRange;
        this.topHeight = this.gapY;
        this.bottomY = this.gapY + PIPE_GAP;
        this.bottomHeight = CANVAS_HEIGHT - this.bottomY;
        this.passed = false;
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw(ctx) {
        // 创建上管道的渐变
        const topGradient = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
        topGradient.addColorStop(0, '#FF69B4');
        topGradient.addColorStop(0.5, '#FFC0CB');
        topGradient.addColorStop(1, '#FF69B4');

        // 创建下管道的渐变
        const bottomGradient = ctx.createLinearGradient(this.x, this.bottomY, this.x + this.width, this.bottomY);
        bottomGradient.addColorStop(0, '#FF69B4');
        bottomGradient.addColorStop(0.5, '#FFC0CB');
        bottomGradient.addColorStop(1, '#FF69B4');

        ctx.save();

        // 绘制上管道
        ctx.fillStyle = topGradient;
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, 0, this.width, this.topHeight, [0, 0, 8, 8]);
        ctx.fill();
        ctx.stroke();

        // 绘制下管道
        ctx.fillStyle = bottomGradient;
        ctx.beginPath();
        ctx.roundRect(this.x, this.bottomY, this.width, this.bottomHeight, [8, 8, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    isOffscreen() {
        return this.x + this.width < 0;
    }

    checkCollision(bird) {
        const birdBounds = bird.getBounds();
        
        // 检查与上管道的碰撞
        if (this.intersects(birdBounds, {
            x: this.x,
            y: 0,
            width: this.width,
            height: this.topHeight
        })) return true;

        // 检查与下管道的碰撞
        if (this.intersects(birdBounds, {
            x: this.x,
            y: this.bottomY,
            width: this.width,
            height: this.bottomHeight
        })) return true;

        return false;
    }

    intersects(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}

// 游戏类
class FlappyBirdGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bird = new Bird();
        this.pipes = [];
        this.score = 0;
        this.gameState = 'waiting';
        this.lastPipeSpawn = 0;
        this.pipeSpawnInterval = 3825; // 增加70%的管道生成间隔
        this.lastFrameTime = 0;
        this.particles = [];
        this.scoreMessage = {
            show: false,
            timer: 0
        };
        this.setupEventListeners();
    }

    handleClick() {
        this.clickCount++;
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            this.gameLoop(performance.now());
        } else if (this.gameState === 'playing') {
            this.bird.flap();
        } else if (this.gameState === 'gameOver') {
            this.reset();
            this.gameState = 'start';
        }
    }

    reset() {
        this.bird = new Bird();
        this.pipes = [];
        this.score = 0;
        this.clickCount = 0;
        this.lastPipeSpawn = 0;
        this.lastTime = 0;
        this.scoreMessage.show = false;
        this.scoreMessage.timer = 0;
        this.scoreAnimations = [];
        this.stars = [];
        this.lastStarSpawn = 0;
    }

    update(deltaTime) {
        // 更新星星生成
        this.lastStarSpawn += deltaTime;
        if (this.lastStarSpawn > this.starSpawnInterval) {
            this.stars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.01 + 0.005,
                twinklePhase: Math.random() * Math.PI * 2,
                life: 1.0
            });
            this.lastStarSpawn = 0;
        }

        // 更新所有星星
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            star.life -= deltaTime * 0.0003;
            star.twinklePhase += star.twinkleSpeed * deltaTime;
            if (star.life <= 0) {
                this.stars.splice(i, 1);
            }
        }

        if (this.gameState !== 'playing') return;

        this.bird.update(deltaTime);

        this.lastPipeSpawn += deltaTime;
        if (this.lastPipeSpawn > this.baseSpawnInterval) {
            this.pipes.push(new Pipe(CANVAS_WIDTH));
            this.lastPipeSpawn = 0;
            this.pipeSpawnInterval = this.baseSpawnInterval;
        }

        const timeCompensation = deltaTime / 16.67;
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= PIPE_SPEED * timeCompensation;

            if (pipe.checkCollision(this.bird)) {
                this.gameState = 'gameOver';
                return;
            }

            if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
                pipe.passed = true;
                this.score++;
                if (this.score > 3 && !this.scoreMessage.show) {
                    this.scoreMessage.show = true;
                    this.scoreMessage.timer = 5000;
                }
                this.scoreAnimations.push({
                    x: pipe.x + pipe.width,
                    y: this.bird.y,
                    alpha: 1,
                    life: 1000
                });
            }

            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(i, 1);
            }
        }

        if (this.scoreMessage.show) {
            this.scoreMessage.timer -= deltaTime;
            if (this.scoreMessage.timer <= 0) {
                this.scoreMessage.show = false;
            }
        }

        for (let i = this.scoreAnimations.length - 1; i >= 0; i--) {
            const anim = this.scoreAnimations[i];
            anim.y -= 1;
            anim.life -= deltaTime;
            anim.alpha = Math.max(0, anim.life / 1000);

            if (anim.life <= 0) {
                this.scoreAnimations.splice(i, 1);
            }
        }

        if (this.bird.y <= 0 || this.bird.y + this.bird.height >= CANVAS_HEIGHT) {
            this.gameState = 'gameOver';
        }
    }

    draw() {
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 绘制星星
        for (const star of this.stars) {
            this.ctx.save();
            const brightness = star.brightness * (0.7 + 0.3 * Math.sin(star.twinklePhase));
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness * star.life})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        this.pipes.forEach(pipe => pipe.draw(this.ctx));
        this.bird.draw(this.ctx);

        this.scoreAnimations.forEach(anim => {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 215, 0, ${anim.alpha})`;
            this.ctx.font = '24px Arial';
            this.ctx.fillText('+1', anim.x, anim.y);
            this.ctx.restore();
        });

        if (this.scoreMessage.show) {
            this.ctx.save();
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('太棒了！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
            this.ctx.restore();
        }

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        this.ctx.fillText(`Clicks: ${this.clickCount}`, 10, 60);

        if (this.gameState === 'start') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('点击屏幕控制上升，穿过通道', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
            this.ctx.textAlign = 'left';
        } else if (this.gameState === 'gameOver') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
            this.ctx.fillText(`最终得分: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            this.ctx.fillText('点击重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
            this.ctx.textAlign = 'left';
        }
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

// 导出游戏类
window.FlappyBirdGame = FlappyBirdGame;