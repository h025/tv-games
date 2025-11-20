const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');

let chickCount = 0;
let lastCount = -1;
let needsSort = true;

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// === 音频管理器 (参考黄金矿工) ===
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    // 尝试唤醒音频上下文 (必须在用户交互事件中调用)
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                console.log("AudioContext Resumed");
            });
        }
    }

    // 基础发声
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        
        // 尝试自动恢复 (虽然最好是在点击事件里显式调用 resume)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type; 
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // 游戏特定音效
    playLay() { // 生蛋: 咯咯
        // 400Hz triangle wave
        this.playTone(400, 'triangle', 0.2, 0.2);
    }

    playHatch() { // 孵化: 哔哔
        // 800Hz sine wave
        this.playTone(800, 'sine', 0.1, 0.1);
    }

    playChirp() { // 小鸡叫: 叽叽
        // 随机高频
        const freq = 1200 + Math.random() * 400;
        this.playTone(freq, 'triangle', 0.05, 0.05);
    }
}

const audioManager = new AudioManager();

// 尝试自动唤醒音频 (Android TV 上因为设置了 MediaPlaybackRequiresUserGesture(false) 所以这行会生效)
audioManager.resume();

// 全局交互兜底唤醒
window.addEventListener('click', () => audioManager.resume());
window.addEventListener('keydown', () => audioManager.resume());
window.addEventListener('gamepadconnected', () => audioManager.resume()); // 手柄连接也是一种交互


// === 静态图片资源 ===
const IMAGE_PATHS = {
    mother: 'images/mother.png',
    chick: 'images/chick.png',
    background: 'images/background.png'
};

const imageAssets = {};
let assetsReady = false;

function loadImages(paths) {
    const entries = Object.entries(paths);
    return Promise.all(entries.map(([key, src]) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageAssets[key] = img;
            resolve();
        };
        img.onerror = reject;
        img.src = src;
    })));
}

// === 游戏实体类 ===

class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.shadowScale = 1;
        this.markedForDeletion = false;
    }

    update() {}

    drawShadow(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 10 * this.shadowScale, 5 * this.shadowScale, 0, 0, Math.PI*2);
        ctx.fill();
    }

    draw(ctx) {}
}

class Player extends Entity {
    constructor() {
        super(width/2, height/2);
        this.speed = 5;
        this.facingRight = true;
        this.walkFrame = 0;
        this.isWalking = false;
        this.keys = { u: false, d: false, l: false, r: false };
        this.gamepadIndex = -1;
        this.lastButtonState = false; // 防止按住A键无限生蛋
    }

    pollGamepad() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        // 寻找第一个连接的手柄
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepadIndex = i;
                break;
            }
        }
    }

    update() {
        this.pollGamepad();

        let dx = 0;
        let dy = 0;

        // 1. 键盘输入
        if (this.keys.u) dy -= this.speed;
        if (this.keys.d) dy += this.speed;
        if (this.keys.l) dx -= this.speed;
        if (this.keys.r) dx += this.speed;

        // 2. 手柄输入 (叠加/覆盖)
        if (this.gamepadIndex !== -1) {
            const gp = navigator.getGamepads()[this.gamepadIndex];
            if (gp) {
                // 左摇杆 (Axes 0, 1)
                // 只有超过死区才响应
                if (Math.abs(gp.axes[0]) > 0.2) dx = gp.axes[0] * this.speed;
                if (Math.abs(gp.axes[1]) > 0.2) dy = gp.axes[1] * this.speed;

                // 十字键 (D-Pad, Buttons 12-15)
                if (gp.buttons[12] && gp.buttons[12].pressed) dy -= this.speed;
                if (gp.buttons[13] && gp.buttons[13].pressed) dy += this.speed;
                if (gp.buttons[14] && gp.buttons[14].pressed) dx -= this.speed;
                if (gp.buttons[15] && gp.buttons[15].pressed) dx += this.speed;

                // A键 (Button 0) 生蛋
                if (gp.buttons[0] && gp.buttons[0].pressed) {
                    if (!this.lastButtonState) {
                        this.layEgg();
                        this.lastButtonState = true;
                    }
                } else {
                    this.lastButtonState = false;
                }
            }
        }

        // 归一化斜向速度 (仅当不是模拟摇杆输入时，避免速度过快)
        // 简单的判断：如果 dx/dy 是整倍数 speed，说明是数字输入（键盘/Dpad），需要归一化
        if (Math.abs(dx) === this.speed && Math.abs(dy) === this.speed) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx;
        this.y += dy;
        
        // 边界限制
        this.x = Math.max(20, Math.min(width - 20, this.x));
        this.y = Math.max(20, Math.min(height - 20, this.y));

        this.isWalking = (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1);
        if (this.isWalking) {
            this.walkFrame += 0.2;
            if (dx !== 0) this.facingRight = dx > 0;
        } else {
            this.walkFrame = 0;
        }
    }

    layEgg() {
        // 在屁股后面生蛋
        const offset = this.facingRight ? -20 : 20;
        entities.push(new Egg(this.x + offset, this.y));
        needsSort = true;
        audioManager.playLay();
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        const sprite = imageAssets.mother;
        if (sprite) {
            const bounce = this.isWalking ? Math.sin(this.walkFrame) * 3 : 0;
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2 + bounce);
        } else {
            // 备用绘制（当图片尚未加载时）
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.ellipse(0, 0, 25, 30, 0, 0, Math.PI*2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Egg extends Entity {
    constructor(x, y) {
        super(x, y);
        this.timer = 100;
        this.wobble = 0;
    }

    update() {
        this.timer--;
        if (this.timer < 30) {
            this.wobble = Math.sin(this.timer) * 0.2;
        }
        if (this.timer <= 0) {
            this.markedForDeletion = true;
            const newChick = new Chick(this.x, this.y);
            entities.push(newChick);
            chickCount++;
            needsSort = true;
            if (chickCount > MAX_CHICKS) {
                markRandomChickForRemoval(newChick);
            }
            audioManager.playHatch();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - 10);
        ctx.rotate(this.wobble);
        ctx.fillStyle = '#FFFAF0';
        ctx.strokeStyle = '#DDD';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Chick extends Entity {
    constructor(x, y) {
        super(x, y);
        this.shadowScale = 0.5;
        this.dx = 0;
        this.dy = 0;
        this.timer = 0;
        this.facingRight = Math.random() > 0.5;
    }

    update() {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.random() * 60 + 20;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.dx = Math.cos(angle) * speed;
            this.dy = Math.sin(angle) * speed;
            this.facingRight = this.dx > 0;
            
            if (Math.random() < 0.05) audioManager.playChirp();
        }

        // 偶尔停下来
        if (Math.random() < 0.02) {
            this.dx = 0;
            this.dy = 0;
        }

        this.x += this.dx;
        this.y += this.dy;

        // 简单的屏幕反弹
        if (this.x < 0 || this.x > width) this.dx *= -1;
        if (this.y < 0 || this.y > height) this.dy *= -1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        // 跳跃效果
        const bounce = (this.dx !== 0 || this.dy !== 0) ? Math.abs(Math.sin(Date.now() / 50)) * 5 : 0;
        ctx.translate(0, -bounce);
        const sprite = imageAssets.chick;
        if (sprite) {
            ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Plant extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = Math.random() > 0.5 ? 'flower' : 'grass';
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.type === 'grass') {
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-5, -15);
            ctx.lineTo(0, -5);
            ctx.lineTo(5, -20);
            ctx.lineTo(2, 0);
            ctx.fill();
        } else {
            ctx.fillStyle = '#E91E63';
            ctx.beginPath();
            ctx.arc(0, -10, 5, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(-1, 0, 2, -10);
        }
        ctx.restore();
    }
}


// 初始化
const player = new Player();
let entities = [player];

// 随机生成一些植物装饰（数量适当减少以提升 TV 性能）
const PLANT_COUNT = 12;
const MAX_CHICKS = 120;
for(let i=0; i<PLANT_COUNT; i++) {
    entities.push(new Plant(Math.random() * width, Math.random() * height));
}
needsSort = true;

// 输入处理
window.addEventListener('keydown', e => {
    audioManager.resume();
    switch(e.code) {
        case 'ArrowUp': case 'KeyW': player.keys.u = true; break;
        case 'ArrowDown': case 'KeyS': player.keys.d = true; break;
        case 'ArrowLeft': case 'KeyA': player.keys.l = true; break;
        case 'ArrowRight': case 'KeyD': player.keys.r = true; break;
        case 'Space': 
        case 'Enter': 
        case 'NumpadEnter':
        case 'Digit0': // 部分手柄映射
            player.layEgg(); 
            break;
    }
});

window.addEventListener('keyup', e => {
    switch(e.code) {
        case 'ArrowUp': case 'KeyW': player.keys.u = false; break;
        case 'ArrowDown': case 'KeyS': player.keys.d = false; break;
        case 'ArrowLeft': case 'KeyA': player.keys.l = false; break;
        case 'ArrowRight': case 'KeyD': player.keys.r = false; break;
    }
});

// 游戏循环
function cleanupEntities() {
    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        if (entity.markedForDeletion) {
            if (entity instanceof Chick && chickCount > 0) {
                chickCount--;
            }
            entities.splice(i, 1);
            needsSort = true;
        }
    }
}

function markRandomChickForRemoval(exclude) {
    const candidates = [];
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        if (entity instanceof Chick && !entity.markedForDeletion && entity !== exclude) {
            candidates.push(entity);
        }
    }
    if (!candidates.length) return;
    const victim = candidates[Math.floor(Math.random() * candidates.length)];
    victim.markedForDeletion = true;
    needsSort = true;
}

function loop() {
    if (!assetsReady) {
        requestAnimationFrame(loop);
        return;
    }

    // 背景
    const bg = imageAssets.background;
    if (bg) {
        ctx.drawImage(bg, 0, 0, width, height);
    } else {
        ctx.fillStyle = '#81C784';
        ctx.fillRect(0, 0, width, height);
    }

    // 更新
    entities.forEach(e => e.update());
    
    // 清理
    cleanupEntities();
    
    // 排序: Y轴大的在下面 (仅当有新增/删除时)
    if (needsSort) {
        entities.sort((a, b) => a.y - b.y);
        needsSort = false;
    }

    // 绘制
    // 1. 先画所有阴影
    entities.forEach(e => e.drawShadow(ctx));
    // 2. 再画实体
    entities.forEach(e => e.draw(ctx));

    // 更新UI（仅当数量变化时修改 DOM）
    if (chickCount !== lastCount && countEl) {
        lastCount = chickCount;
        countEl.textContent = chickCount;
    }

    requestAnimationFrame(loop);
}

loadImages(IMAGE_PATHS)
    .then(() => {
        assetsReady = true;
        loop();
    })
    .catch((err) => {
        console.error('Failed to load images', err);
        loop(); // fallback
    });
