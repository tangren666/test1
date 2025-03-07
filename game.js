// 游戏常量
const WINDOW_WIDTH = 800;
const WINDOW_HEIGHT = 600;
const FPS = 60;

// 游戏对象类
class GameObject {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// 玩家类
class Player extends GameObject {
    constructor() {
        super(100, WINDOW_HEIGHT - 100, 30, 60, '#00FF00');
        this.velocityY = 0;
        this.velocityX = 0;
        this.jumping = false;
        this.crouching = false;
        this.speed = 5;
        this.gravity = 0.8;
        this.jumpForce = -15;
        
        // 加载玩家图片
        this.image = new Image();
        this.image.onload = () => {
            console.log('玩家图片加载完成');
            // 添加成功日志
            const logContainer = document.getElementById('logContainer');
            const logItem = document.createElement('div');
            logItem.className = 'log-item log-success';
            logItem.textContent = `玩家图片加载成功，路径: ${this.image.src}`;
            logContainer.appendChild(logItem);
            // 将图片转换为base64并缓存
            const canvas = document.createElement('canvas');
            canvas.width = this.image.width;
            canvas.height = this.image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(this.image, 0, 0);
            const base64Data = canvas.toDataURL('image/png');
            localStorage.setItem('playerImage', base64Data);
        };
        this.image.onerror = (error) => {
            console.error('玩家图片加载失败:', error);
            // 添加错误日志
            const logContainer = document.getElementById('logContainer');
            const logItem = document.createElement('div');
            logItem.className = 'log-item log-error';
            logItem.textContent = `玩家图片加载失败: 无法加载图片，路径: ${this.image.src}`;
            logContainer.appendChild(logItem);
            // 记录详细错误信息到控制台
            console.log('图片URL:', this.image.src);
            console.log('完整错误信息:', error);
        };

        // 尝试从缓存加载图片
        const cachedImage = localStorage.getItem('playerImage');
        if (cachedImage) {
            this.image.src = cachedImage;
        } else {
            this.image.src = window.location.href.replace(/\/[^\/]*$/, '') + '/player.jpg';
        }
    }

    draw(ctx) {
        console.log('Drawing player, image loaded:', this.image.complete, 'image src:', this.image.src);
        if (this.image.complete) {
            try {
                console.log('Drawing image at:', this.x, this.y, 'size:', this.width, this.height);
                ctx.save();
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
                ctx.restore();
            } catch (error) {
                console.error('Error drawing image:', error);
                super.draw(ctx);
            }
        } else {
            console.log('Image not loaded yet, drawing fallback rectangle');
            super.draw(ctx);
        }
    }

    update(platforms) {
        // 应用重力
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // 水平移动
        this.x += this.velocityX;

        // 碰撞检测
        this.checkCollisions(platforms);

        // 屏幕边界检查
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > WINDOW_WIDTH) this.x = WINDOW_WIDTH - this.width;
        if (this.y + this.height > WINDOW_HEIGHT) {
            this.y = WINDOW_HEIGHT - this.height;
            this.velocityY = 0;
            this.jumping = false;
        }
    }

    checkCollisions(platforms) {
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // 从上方碰撞
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.jumping = false;
                }
                // 从下方碰撞
                else if (this.velocityY < 0 && this.y - this.velocityY >= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // 从侧面碰撞
                else {
                    if (this.velocityX > 0 && this.x + this.width - this.velocityX <= platform.x) {
                        this.x = platform.x - this.width;
                    } else if (this.velocityX < 0 && this.x - this.velocityX >= platform.x + platform.width) {
                        this.x = platform.x + platform.width;
                    }
                }
            }
        }
    }

    jump() {
        if (!this.jumping) {
            this.velocityY = this.jumpForce;
            this.jumping = true;
        }
    }
}

// 平台类
class Platform extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height, '#8B4513');
    }
}

// 敌人类
class Enemy extends GameObject {
    constructor(x, y, imageNumber = 1) {
        super(x, y, 30, 30, '#FF0000');
        this.direction = 1;
        this.speed = 2;
        this.velocityY = 0;
        this.gravity = 0.8;
        
        // 加载敌人图片
        this.image = new Image();
        this.image.onload = () => {
            console.log(`敌人${imageNumber}图片加载完成`);
            const logContainer = document.getElementById('logContainer');
            const logItem = document.createElement('div');
            logItem.className = 'log-item log-success';
            logItem.textContent = `敌人${imageNumber}图片加载成功，路径: ${this.image.src}`;
            logContainer.appendChild(logItem);
        };
        this.image.onerror = (error) => {
            console.error(`敌人${imageNumber}图片加载失败:`, error);
            const logContainer = document.getElementById('logContainer');
            const logItem = document.createElement('div');
            logItem.className = 'log-item log-error';
            logItem.textContent = `敌人${imageNumber}图片加载失败: 无法加载图片，路径: ${this.image.src}`;
            logContainer.appendChild(logItem);
        };
        this.image.src = window.location.href.replace(/\/[^\/]*$/, '') + `/enemy${imageNumber}.jpg`;
    }

    draw(ctx) {
        if (this.image.complete) {
            try {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } catch (error) {
                console.error('Error drawing enemy image:', error);
                super.draw(ctx);
            }
        } else {
            super.draw(ctx);
        }
    }

    update(platforms) {
        // 水平移动
        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= WINDOW_WIDTH) {
            this.direction *= -1;
        }

        // 垂直移动
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // 与平台碰撞检测
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                if (this.velocityY > 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            }
        }
    }
}

// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player();
        this.platforms = [];
        this.enemies = [];
        this.keys = {};
        this.currentLevel = 1;
        this.maxLevel = 5;
        this.setupEventListeners();
        this.setupLevel();
    }

    setupLevel() {
        // 创建平台
        this.platforms = [
            new Platform(0, WINDOW_HEIGHT - 40, WINDOW_WIDTH, 40)  // 地面
        ];

        // 根据关卡随机生成平台
        const platformCount = 3 + Math.floor(Math.random() * 3); // 3-5个平台
        for (let i = 0; i < platformCount; i++) {
            const x = 100 + Math.random() * (WINDOW_WIDTH - 300);
            const y = 150 + Math.random() * (WINDOW_HEIGHT - 250);
            this.platforms.push(new Platform(x, y, 200, 20));
        }

        // 根据关卡数创建敌人
        this.enemies = [];
        const enemyCount = this.currentLevel + 1; // 第n关有n+1个敌人
        for (let i = 0; i < enemyCount; i++) {
            const x = 200 + Math.random() * (WINDOW_WIDTH - 400);
            const y = WINDOW_HEIGHT - 70;
            this.enemies.push(new Enemy(x, y));
        }
    }

    setupEventListeners() {
        // 键盘控制
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // 移动端控制
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const jumpBtn = document.getElementById('jumpBtn');

        // 触摸事件
        leftBtn.addEventListener('touchstart', () => this.keys['ArrowLeft'] = true);
        leftBtn.addEventListener('touchend', () => this.keys['ArrowLeft'] = false);
        rightBtn.addEventListener('touchstart', () => this.keys['ArrowRight'] = true);
        rightBtn.addEventListener('touchend', () => this.keys['ArrowRight'] = false);
        jumpBtn.addEventListener('touchstart', () => this.player.jump());

        // 开始按钮事件
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
        // 隐藏开始页面
        const startScreen = document.getElementById('startScreen');
        startScreen.style.display = 'none';
        
        // 显示游戏画布
        this.canvas.style.display = 'block';
        
        // 开始游戏循环
        this.gameLoop();
    }

    update() {
        // 更新玩家
        if (this.keys['ArrowLeft']) this.player.velocityX = -this.player.speed;
        else if (this.keys['ArrowRight']) this.player.velocityX = this.player.speed;
        else this.player.velocityX = 0;

        if (this.keys['Space'] || this.keys['ArrowUp']) this.player.jump();

        this.player.update(this.platforms);

        // 更新敌人
        this.enemies.forEach(enemy => enemy.update(this.platforms));

        // 检测与敌人的碰撞
        this.enemies.forEach((enemy, index) => {
            if (this.checkCollision(this.player, enemy)) {
                if (this.player.velocityY > 0 && this.player.y + this.player.height - this.player.velocityY <= enemy.y) {
                    // 从上方踩到敌人
                    this.enemies.splice(index, 1);
                    this.player.velocityY = -10; // 反弹
                    
                    // 检查是否消灭所有敌人
                    if (this.enemies.length === 0) {
                        this.levelComplete();
                    }
                } else {
                    // 游戏结束
                    this.gameOver();
                }
            }
        });
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

        // 绘制游戏对象
        this.platforms.forEach(platform => platform.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.player.draw(this.ctx);
    }

    gameOver() {
        alert('游戏结束！重新开始第' + this.currentLevel + '关');
        this.setupLevel(); // 重置当前关卡
        // 重置玩家位置和状态
        this.player.x = 100;
        this.player.y = WINDOW_HEIGHT - 100;
        this.player.velocityX = 0;
        this.player.velocityY = 0;
        this.player.jumping = false;
    }

    levelComplete() {
        if (this.currentLevel < this.maxLevel) {
            if (confirm(`恭喜通过第${this.currentLevel}关！是否继续挑战第${this.currentLevel + 1}关？`)) {
                this.currentLevel++;
                this.setupLevel();
                // 重置玩家位置
                this.player.x = 100;
                this.player.y = WINDOW_HEIGHT - 100;
                this.player.velocityX = 0;
                this.player.velocityY = 0;
                this.player.jumping = false;
            }
        } else {
            alert('恭喜你通关了！');
            this.currentLevel = 1;
            this.setupLevel();
            // 重置玩家位置
            this.player.x = 100;
            this.player.y = WINDOW_HEIGHT - 100;
            this.player.velocityX = 0;
            this.player.velocityY = 0;
            this.player.jumping = false;
        }
    }

    gameLoop() {
        try {
            this.update();
            this.draw();
        } catch (error) {
            console.error('游戏循环出错:', error);
        }
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 启动游戏
window.onload = () => {
    new Game();
};