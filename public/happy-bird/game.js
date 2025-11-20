const canvas = document.getElementById('bird-canvas');
const ctx = canvas.getContext('2d');

// 游戏常量
const GRAVITY = 0.25;
const FLAP = -4.5;
const SPAWN_RATE = 90; // 帧数
const PIPE_WIDTH = 50;
const PIPE_SPACING = 100; // 上下管子间隙
const PIPE_SPEED = 2;

// 游戏状态
let frames = 0;
let score = 0;
let bestScore = localStorage.getItem('happy_bird_best') || 0;
let gameState = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
};

// 音频 (简单的合成音效)
const Audio = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    playJump: function() {
        this.tone(400, 'square', 0.1);
    },
    playScore: function() {
        this.tone(1000, 'sine', 0.1);
    },
    playCrash: function() {
        this.tone(150, 'sawtooth', 0.2);
    },
    tone: function(freq, type, dur) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + dur);
    }
};

// 对象定义
const bird = {
    x: 50,
    y: 150,
    w: 30, // 视觉大小
    h: 30,
    radius: 12,
    frame: 0,
    velocity: 0,
    rotation: 0,
    
    draw: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        // 根据速度旋转
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
        ctx.rotate(this.rotation);
        
        // 画身体
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 画眼睛
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(6, -6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(7, -6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 画嘴巴
        ctx.fillStyle = "#f48024";
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.lineTo(16, 6);
        ctx.lineTo(8, 10);
        ctx.fill();
        
        // 画翅膀
        ctx.fillStyle = "#F0E68C";
        ctx.beginPath();
        ctx.ellipse(-5, 5, 8, 5, Math.PI/4, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    },
    
    flap: function() {
        this.velocity = FLAP;
        Audio.playJump();
    },
    
    update: function() {
        // 物理引擎
        this.velocity += GRAVITY;
        this.y += this.velocity;
        
        // 地面碰撞
        if (this.y + this.radius >= canvas.height - 20) { // 20是地面高度
            this.y = canvas.height - 20 - this.radius;
            if (gameState.current == gameState.game) {
                gameState.current = gameState.over;
                Audio.playCrash();
                showGameOver();
            }
        }
        
        // 天花板碰撞
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },
    
    reset: function() {
        this.y = 150;
        this.velocity = 0;
        this.rotation = 0;
    }
};

const pipes = {
    position: [],
    
    draw: function() {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + PIPE_SPACING;
            
            ctx.fillStyle = "#73bf2e";
            ctx.strokeStyle = "#558c22";
            ctx.lineWidth = 2;
            
            // 上管
            ctx.fillRect(p.x, 0, PIPE_WIDTH, topY);
            ctx.strokeRect(p.x, 0, PIPE_WIDTH, topY);
            
            // 下管
            ctx.fillRect(p.x, bottomY, PIPE_WIDTH, canvas.height - bottomY - 20); // 减去地面
            ctx.strokeRect(p.x, bottomY, PIPE_WIDTH, canvas.height - bottomY - 20);
        }
    },
    
    update: function() {
        // 每隔 SPAWN_RATE 帧生成一个管子
        if (frames % SPAWN_RATE == 0) {
            // 随机高度: min 50, max canvas.height - ground - gap - 50
            const minParams = 50;
            const maxParams = canvas.height - 20 - PIPE_SPACING - 50;
            const y = Math.floor(Math.random() * (maxParams - minParams + 1)) + minParams;
            
            this.position.push({
                x: canvas.width,
                y: y,
                passed: false
            });
        }
        
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // 移动
            p.x -= PIPE_SPEED;
            
            // 碰撞检测
            // 鸟的边界框 (简化为正方形)
            let birdLeft = bird.x - bird.radius;
            let birdRight = bird.x + bird.radius;
            let birdTop = bird.y - bird.radius;
            let birdBottom = bird.y + bird.radius;
            
            let pipeLeft = p.x;
            let pipeRight = p.x + PIPE_WIDTH;
            let topPipeBottom = p.y;
            let bottomPipeTop = p.y + PIPE_SPACING;
            
            // 横向重叠
            if (birdRight > pipeLeft && birdLeft < pipeRight) {
                // 纵向碰撞 (撞上管 OR 撞下管)
                if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
                    gameState.current = gameState.over;
                    Audio.playCrash();
                    showGameOver();
                }
            }
            
            // 加分
            if (p.x + PIPE_WIDTH < bird.x && !p.passed) {
                score += 1;
                p.passed = true;
                scoreElement.innerHTML = score;
                Audio.playScore();
                // 稍微增加难度?
            }
            
            // 移除超出屏幕的管子
            if (p.x + PIPE_WIDTH <= 0) {
                this.position.shift();
                // 修正索引因为数组变短了
                i--; 
            }
        }
    },
    
    reset: function() {
        this.position = [];
    }
};

// 背景绘制
function drawBackground() {
    // 天空已在CSS设置，这里画云朵和地面
    
    // 地面
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // 地面顶部草坪
    ctx.fillStyle = "#73bf2e";
    ctx.fillRect(0, canvas.height - 20, canvas.width, 5);
}

// 游戏循环
function loop() {
    // 清空
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    pipes.draw();
    bird.draw();
    
    if (gameState.current == gameState.game) {
        bird.update();
        pipes.update();
        frames++;
    } else if (gameState.current == gameState.getReady) {
        // 悬停效果
        bird.y = 150 + Math.cos(frames/20) * 5;
        frames++;
    }
    
    requestAnimationFrame(loop);
}

// UI 控制
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const bestScoreElement = document.getElementById('best-score');

function init() {
    gameState.current = gameState.getReady;
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    score = 0;
    scoreElement.innerHTML = score;
    bird.reset();
    pipes.reset();
    frames = 0;
}

function startGame() {
    gameState.current = gameState.game;
    startScreen.classList.add('hidden');
    bird.flap(); // 跳一下
}

function showGameOver() {
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('happy_bird_best', bestScore);
    }
    finalScoreElement.innerText = score;
    bestScoreElement.innerText = bestScore;
    gameOverScreen.classList.remove('hidden');
}

// 事件监听
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (gameState.current == gameState.getReady) {
            startGame();
        } else if (gameState.current == gameState.game) {
            bird.flap();
        } else if (gameState.current == gameState.over) {
            // 防止误触
        }
    }
});

// 鼠标/触摸
canvas.addEventListener('mousedown', function() {
    if (gameState.current == gameState.getReady) {
        startGame();
    } else if (gameState.current == gameState.game) {
        bird.flap();
    }
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', init);

// 启动
init();
loop();

