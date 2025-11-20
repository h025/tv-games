const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// 地面高度
const GROUND_HEIGHT = 100;

// 音效
const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (AudioCtx.state === 'suspended') AudioCtx.resume();
    const osc = AudioCtx.createOscillator();
    const gain = AudioCtx.createGain();
    
    if (type === 'lay') { // 生蛋: 咯咯
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, AudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, AudioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, AudioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, AudioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(AudioCtx.currentTime + 0.2);
    } else if (type === 'hatch') { // 孵化: 哔哔
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, AudioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, AudioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, AudioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, AudioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(AudioCtx.currentTime + 0.1);
    } else if (type === 'chirp') { // 小鸡叫: 叽叽
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, AudioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, AudioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, AudioCtx.currentTime); // 音量小一点
        gain.gain.exponentialRampToValueAtTime(0.01, AudioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(AudioCtx.currentTime + 0.05);
    }
}

// 类定义
class MrsChicken {
    constructor() {
        this.x = width / 2;
        this.y = height - GROUND_HEIGHT - 60;
        this.targetX = this.x;
        this.w = 80;
        this.h = 80;
        this.speed = 8;
        this.facingRight = true;
        this.legAngle = 0; // 走路动画
        this.keys = { left: false, right: false }; // 键盘状态
    }

    update() {
        // 键盘控制优先级高于鼠标
        if (this.keys.left) {
            this.targetX = this.x - this.speed;
        } else if (this.keys.right) {
            this.targetX = this.x + this.speed;
        }

        // 移动逻辑
        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 5) {
            // 限制边界
            if (this.targetX < 40) this.targetX = 40;
            if (this.targetX > width - 40) this.targetX = width - 40;

            this.x += Math.sign(dx) * this.speed;
            this.facingRight = dx > 0;
            this.legAngle += 0.5;
        } else {
            this.x = this.targetX;
            this.legAngle = 0;
        }
    }

    layEgg() {
        eggs.push(new Egg(this.x, this.y + 30));
        playSound('lay');
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) ctx.scale(-1, 1); // 翻转

        // 身体
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 头 (冠)
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(10, -35, 8, 0, Math.PI * 2);
        ctx.arc(20, -32, 8, 0, Math.PI * 2);
        ctx.arc(0, -32, 8, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(20, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        // 嘴
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(35, -5);
        ctx.lineTo(45, 0);
        ctx.lineTo(35, 5);
        ctx.fill();

        // 翅膀
        ctx.fillStyle = '#F0F0F0';
        ctx.beginPath();
        ctx.ellipse(-10, 5, 20, 15, Math.PI/4, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#DDD';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 腿 (动态)
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 4;
        const legOffset = Math.sin(this.legAngle) * 10;
        
        ctx.beginPath(); // 左腿
        ctx.moveTo(-10, 30);
        ctx.lineTo(-10 - legOffset, 50);
        ctx.stroke();

        ctx.beginPath(); // 右腿
        ctx.moveTo(10, 30);
        ctx.lineTo(10 + legOffset, 50);
        ctx.stroke();

        ctx.restore();
    }
}

class Egg {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.landed = false;
        this.hatchTimer = 120; // 2秒后孵化
        this.rotation = Math.random() * 0.5 - 0.25;
    }

    update() {
        if (!this.landed) {
            this.vy += 0.5;
            this.y += this.vy;
            if (this.y > height - GROUND_HEIGHT - 15) {
                this.y = height - GROUND_HEIGHT - 15;
                this.landed = true;
                this.vy = 0;
            }
        } else {
            this.hatchTimer--;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#FFFDD0'; // 蛋壳色
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#E0E0E0';
        ctx.stroke();
        ctx.restore();
    }
}

class Chick {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = -5; // 出生弹跳
        this.groundY = height - GROUND_HEIGHT - 10;
        this.state = 'idle'; // idle, walk
        this.timer = 0;
        this.facingRight = Math.random() > 0.5;
    }

    update() {
        // 重力
        if (this.y < this.groundY) {
            this.vy += 0.5;
            this.y += this.vy;
        } else {
            this.y = this.groundY;
            this.vy = 0;
        }

        // 行为AI
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.random() * 60 + 30;
            if (Math.random() < 0.6) {
                this.state = 'walk';
                this.vx = (Math.random() - 0.5) * 2;
                this.facingRight = this.vx > 0;
                // 偶尔跳一下
                if (Math.random() < 0.3) this.vy = -4;
                // 偶尔叫一声
                if (Math.random() < 0.1) playSound('chirp');
            } else {
                this.state = 'idle';
                this.vx = 0;
                // 站着的时候偶尔叫
                if (Math.random() < 0.05) playSound('chirp');
            }
        }

        this.x += this.vx;
        
        // 边界
        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > width) { this.x = width; this.vx *= -1; }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) ctx.scale(-1, 1);

        // 黄色小身体
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(5, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // 嘴
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(10, -2);
        ctx.lineTo(14, 0);
        ctx.lineTo(10, 2);
        ctx.fill();

        // 脚
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 10);
        ctx.lineTo(-4, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, 10);
        ctx.lineTo(4, 16);
        ctx.stroke();

        ctx.restore();
    }
}

// 游戏实例
const mother = new MrsChicken();
const eggs = [];
const chicks = [];

// 交互
canvas.addEventListener('click', (e) => {
    // 母鸡移动到点击位置
    mother.targetX = e.clientX;
    
    // 立即生蛋 (在当前位置)
    mother.layEgg();
});

// 键盘事件监听
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        mother.keys.left = true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        mother.keys.right = true;
    }
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        // 空格键生蛋
        mother.layEgg();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        mother.keys.left = false;
        // 停止时，targetX 重置为当前位置，防止滑步回去
        if (!mother.keys.right) mother.targetX = mother.x;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        mother.keys.right = false;
        if (!mother.keys.left) mother.targetX = mother.x;
    }
});

// 游戏循环
function loop() {
    // 背景
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height);
    
    // 草地
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // 装饰云
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(200, 100, 30, 0, Math.PI*2);
    ctx.arc(240, 100, 40, 0, Math.PI*2);
    ctx.arc(280, 100, 30, 0, Math.PI*2);
    ctx.fill();

    // 更新和绘制实体
    
    // 母鸡
    mother.update();
    mother.draw();

    // 蛋
    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        egg.update();
        egg.draw();
        
        if (egg.landed && egg.hatchTimer <= 0) {
            // 孵化
            eggs.splice(i, 1);
            chicks.push(new Chick(egg.x, egg.y));
            playSound('hatch');
            document.getElementById('count').innerText = chicks.length;
        }
    }

    // 小鸡
    chicks.forEach(chick => {
        chick.update();
        chick.draw();
    });

    requestAnimationFrame(loop);
}

loop();
