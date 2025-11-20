// 简单的Web Audio API合成器，不需要外部文件
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    // 播放简单的振荡器声音
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        // 用户必须先交互才能播放声音，通常在点击开始游戏时resume
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // 发射声音
    playShoot() {
        this.playTone(400, 'triangle', 0.1);
    }

    // 抓取声音
    playGrab() {
        this.playTone(200, 'square', 0.1, 0.2);
    }

    // 金钱声音
    playCoin() {
        this.playTone(800, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 100);
    }

    // 爆炸声音
    playExplosion() {
        if (!this.enabled) return;
        const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 白噪声
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    
    // 拉重物时的低频音（循环这里很难模拟完美，就简单播放一个低音）
    playPulling() {
        // 这里暂不实现复杂的循环音效，避免卡顿
    }
}

const audioManager = new AudioManager();

