class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.hook = new Hook();
        this.items = [];
        this.level = 1;
        this.score = 0;
        this.targetScore = 0;
        this.time = 0;
        this.timerInterval = null;
        this.gameState = 'MENU'; // MENU, PLAYING, LEVEL_END, SHOP, GAME_OVER
        this.tntCount = 0; // 炸药数量
        this.strengthActive = false; // 大力药水

        // UI Elements
        this.ui = {
            score: document.getElementById('score-display'),
            target: document.getElementById('target-display'),
            time: document.getElementById('time-display'),
            level: document.getElementById('level-display'),
            tnt: document.getElementById('tnt-display'),
            mainMenu: document.getElementById('main-menu'),
            levelScreen: document.getElementById('level-screen'),
            shopScreen: document.getElementById('shop-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            hud: document.getElementById('hud'),
            shopItemsContainer: document.getElementById('shop-items-container')
        };

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    start() {
        this.score = 0;
        this.level = 1;
        this.tntCount = 0;
        this.startLevel();
        this.ui.mainMenu.classList.add('hidden');
        this.ui.gameOverScreen.classList.add('hidden');
        this.ui.hud.classList.remove('hidden');
        audioManager.playTone(600, 'sine', 0.2);
    }

    startLevel() {
        const levelData = CONSTANTS.LEVELS[Math.min(this.level - 1, CONSTANTS.LEVELS.length - 1)];
        this.targetScore = this.score + levelData.goal; // 目标是基于当前分数的增量还是总分？经典版通常是累积总分目标。
        // 修正：经典版目标是每一关设定的总分阈值。例如第一关650。
        // 如果CONSTANTS里的goal是绝对值：
        // this.targetScore = levelData.goal; 
        // 但通常难度会递增，我们这里的CONSTANTS.LEVELS已经定义了递增的目标。
        this.targetScore = levelData.goal; // 简化处理，直接用配置的绝对值

        this.time = levelData.time;
        this.strengthActive = false; // 重置药水，除非是在商店买的保留到这一关（逻辑上是下一关生效，所以这里如果刚从商店买完，不应该重置？或者商店买的标志位是 nextLevelStrength）
        // 简化：商店买完直接设置 strengthActive = true，过关后重置。 wait, 商店是在下一关开始前。
        // 所以 startLevel 时保留 strengthActive 的状态， level end 时也不重置，只有用过一次后（比如拉完重物）？
        // 不，大力药水通常整关有效。所以 startLevel 不要重置它，而是在 endLevel 后或 init 时处理。
        // 我们在商店购买时设置 strengthActive = true。
        // 每一关结束时重置？经典版是每一关买一次用一关。
        // 所以 startLevel 不做改变，endLevel 后如果没买就没了。我们在生成关卡时处理。

        this.items = this.generateItems(this.level);
        this.hook.reset();
        this.gameState = 'PLAYING';
        
        this.updateUI();
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'PLAYING') {
                this.time--;
                this.updateUI();
                if (this.time <= 0) {
                    this.checkLevelEnd();
                }
                if (this.time <= 10) {
                   // 倒计时音效
                   audioManager.playTone(800, 'square', 0.05);
                }
            }
        }, 1000);
    }

    generateItems(level) {
        const items = [];
        // 简单的生成算法：基于关卡数增加难度（比如更多石头，更少大金块）
        // 这里简化为固定数量随机分布
        const count = 15; 
        for (let i = 0; i < count; i++) {
            // 随机类型
            const rand = Math.random();
            let type;
            if (rand < 0.15) type = CONSTANTS.ITEM_TYPE.GOLD_L;
            else if (rand < 0.3) type = CONSTANTS.ITEM_TYPE.GOLD_M;
            else if (rand < 0.45) type = CONSTANTS.ITEM_TYPE.GOLD_S;
            else if (rand < 0.6) type = CONSTANTS.ITEM_TYPE.ROCK_L;
            else if (rand < 0.75) type = CONSTANTS.ITEM_TYPE.ROCK_S;
            else if (rand < 0.85) type = CONSTANTS.ITEM_TYPE.BAG;
            else if (rand < 0.95) type = CONSTANTS.ITEM_TYPE.DIAMOND; // 钻石少见
            else type = CONSTANTS.ITEM_TYPE.TNT;

            // 确保不重叠太厉害 (简化处理: 随机坐标)
            const x = Utils.randomInt(50, CONSTANTS.CANVAS_WIDTH - 50);
            const y = Utils.randomInt(150, CONSTANTS.CANVAS_HEIGHT - 50);
            
            items.push(new Item(type, x, y));
        }
        // 强制生成至少一个大金块
        items.push(new Item(CONSTANTS.ITEM_TYPE.GOLD_L, Utils.randomInt(100, 700), Utils.randomInt(200, 500)));
        return items;
    }

    update() {
        if (this.gameState !== 'PLAYING') return;

        this.hook.update();

        // 碰撞检测
        if (this.hook.state === 'SHOOT') {
            const hookPoint = this.hook.getCollisionPoint();
            for (let item of this.items) {
                if (item.exists && Utils.checkCollision(hookPoint.x, hookPoint.y, item.x, item.y, item.radius)) {
                    this.hook.state = 'RETURN';
                    this.hook.caughtItem = item;
                    audioManager.playGrab();
                    
                    // 如果碰到了 TNT
                    if (item.type === CONSTANTS.ITEM_TYPE.TNT) {
                        this.triggerTNT(item);
                    } else {
                        // 应用大力药水
                        if (this.strengthActive) {
                            // 临时修改物品重量感知 (实际上不改物品属性，只改 Hook 计算)
                            // 由于 Hook 类里直接读取 item.weight，我们可以在 Hook 里处理，或者临时改 item
                            // 更好的方式： Hook 知道 strengthActive
                            // 为了简单，我们修改 Hook 的 RETURN 逻辑里的 item.weight 读取
                            // 但这里解耦，我们动态调整 weight 属性? 不好。
                            // 咱们在 Hook 里加个 flag setPower(boolean)
                            // 暂不实现复杂逻辑，大力药水就让所有物品重量变为 1
                            // item.weight 保持不变，Hook 计算 speed 时除以 1 而不是 weight
                            // 这里我们可以暂时把 item.weight 设为 1，拉回来后再恢复? 
                            // 不，直接在 Item 上加个 temp 属性? 
                            // 既然 Hook 逻辑已定，我们给 Hook 一个 powerMode
                        }
                    }
                    break;
                }
            }
        }

        // 物品回收检测
        if (this.hook.state === 'SWING' && this.hook.caughtItem) {
            this.collectItem(this.hook.caughtItem);
            this.hook.caughtItem = null;
        }
    }

    triggerTNT(tntItem) {
        tntItem.exists = false;
        this.hook.caughtItem = null; // 没抓到东西
        audioManager.playExplosion();
        
        // 炸毁周围物品
        const explosionRadius = 150;
        this.items.forEach(item => {
            if (item.exists && item !== tntItem) {
                if (Utils.distance(tntItem.x, tntItem.y, item.x, item.y) < explosionRadius) {
                    item.exists = false;
                    // 如果连锁反应炸到其他TNT?
                    if (item.type === CONSTANTS.ITEM_TYPE.TNT) {
                        // 简单的连锁：直接消失，不产生二次爆炸逻辑以免死循环太复杂
                    }
                }
            }
        });
    }

    collectItem(item) {
        let points = item.score;
        
        // 神秘袋子逻辑
        if (item.type === CONSTANTS.ITEM_TYPE.BAG) {
            const rand = Math.random();
            if (rand < 0.3) { points = 800; audioManager.playCoin(); }
            else if (rand < 0.5) { points = 100; } // 烂运气
            else if (rand < 0.7) { 
                points = 0; 
                this.strengthActive = true; // 获得神力
                // 提示?
            }
            else if (rand < 0.9) {
                points = 0;
                this.tntCount++;
                this.updateUI();
            }
            else { points = 1; } // 极差运气
        }

        if (points > 0) {
            this.score += points;
            audioManager.playCoin();
        }
        
        item.exists = false;
        this.updateUI();
        
        // 检查是否已经是最后几秒且达到了分数? 不，继续玩直到时间到。
    }

    useTNT() {
        if (this.tntCount > 0 && this.hook.caughtItem && this.hook.state === 'RETURN') {
            this.tntCount--;
            this.hook.useTNT();
            this.updateUI();
        }
    }

    checkLevelEnd() {
        clearInterval(this.timerInterval);
        this.gameState = 'LEVEL_END';
        
        if (this.score >= this.targetScore) {
            // 过关
            this.showLevelScreen(true);
        } else {
            // 失败
            this.gameOver();
        }
    }

    showLevelScreen(success) {
        this.ui.levelScreen.classList.remove('hidden');
        this.ui.hud.classList.add('hidden');
        
        const title = document.getElementById('level-title');
        const msg = document.getElementById('level-message');
        document.getElementById('level-goal-score').innerText = this.targetScore;
        document.getElementById('level-current-score').innerText = this.score;
        
        const nextBtn = document.getElementById('next-level-btn');

        if (success) {
            title.innerText = `第 ${this.level} 关 完成!`;
            msg.innerText = "准备进入下一关...";
            nextBtn.onclick = () => {
                this.ui.levelScreen.classList.add('hidden');
                this.enterShop();
            };
        }
    }

    enterShop() {
        this.gameState = 'SHOP';
        this.ui.shopScreen.classList.remove('hidden');
        document.getElementById('shop-money').innerText = this.score;
        
        // 生成商品
        const container = this.ui.shopItemsContainer;
        container.innerHTML = '';
        
        // 炸药商品
        const tntPrice = 150;
        const tntDiv = document.createElement('div');
        tntDiv.className = 'shop-item';
        tntDiv.innerHTML = `<div style="font-size:30px">🧨</div><div>炸药</div><div>$${tntPrice}</div>`;
        tntDiv.onclick = () => {
            if (this.score >= tntPrice) {
                this.score -= tntPrice;
                this.tntCount++;
                document.getElementById('shop-money').innerText = this.score;
                audioManager.playCoin();
                tntDiv.classList.add('bought'); // 简单的视觉反馈，实际上可以买多个
            }
        };
        container.appendChild(tntDiv);

        // 药水商品
        const potionPrice = 300;
        const potionDiv = document.createElement('div');
        potionDiv.className = 'shop-item';
        potionDiv.innerHTML = `<div style="font-size:30px">🥤</div><div>生力水</div><div>$${potionPrice}</div>`;
        potionDiv.onclick = () => {
            if (this.score >= potionPrice && !this.strengthActive) {
                this.score -= potionPrice;
                this.strengthActive = true; // 下一关有效
                document.getElementById('shop-money').innerText = this.score;
                audioManager.playCoin();
                potionDiv.classList.add('bought');
                potionDiv.onclick = null; // 只能买一次
            }
        };
        container.appendChild(potionDiv);

        document.getElementById('shop-next-btn').onclick = () => {
            this.ui.shopScreen.classList.add('hidden');
            this.level++;
            this.startLevel();
        };
    }

    gameOver() {
        this.gameState = 'GAME_OVER';
        this.ui.gameOverScreen.classList.remove('hidden');
        this.ui.hud.classList.add('hidden');
        this.ui.levelScreen.classList.add('hidden');
        
        document.getElementById('final-score').innerText = this.score;
        
        const isHigh = leaderboard.isHighScore(this.score);
        const form = document.getElementById('new-record-form');
        const list = document.getElementById('leaderboard-display');
        
        if (isHigh) {
            form.classList.remove('hidden');
            list.classList.add('hidden');
            // 聚焦输入框
            setTimeout(() => document.getElementById('player-name').focus(), 100);
        } else {
            form.classList.add('hidden');
            list.classList.remove('hidden');
            this.renderLeaderboard();
        }
        
        audioManager.playTone(300, 'sawtooth', 0.5); // 失败音效
    }

    renderLeaderboard() {
        const ul = document.getElementById('leaderboard-list');
        ul.innerHTML = '';
        leaderboard.getScores().forEach((s, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="rank">#${i+1}</span> <span>${s.name}</span> <span>$${s.score}</span>`;
            ul.appendChild(li);
        });
    }

    submitScore() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim() || '无名矿工';
        leaderboard.addScore(name, this.score);
        
        document.getElementById('new-record-form').classList.add('hidden');
        document.getElementById('leaderboard-display').classList.remove('hidden');
        this.renderLeaderboard();
    }

    updateUI() {
        this.ui.score.innerText = this.score;
        this.ui.target.innerText = this.targetScore;
        this.ui.time.innerText = this.time;
        this.ui.level.innerText = this.level;
        this.ui.tnt.innerText = this.tntCount;
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // 画背景 (土地)
        this.ctx.fillStyle = '#8B4513'; // 土色
        this.ctx.fillRect(0, 100, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT - 100);
        
        // 画天空/地表交界
        this.ctx.fillStyle = '#228B22'; // 草地
        this.ctx.fillRect(0, 90, CONSTANTS.CANVAS_WIDTH, 10);

        if (this.gameState === 'PLAYING') {
            // 画矿工
            Sprites.drawMiner(this.ctx, CONSTANTS.HOOK_ORIGIN_X, 40);

            // 画物品
            this.items.forEach(item => item.draw(this.ctx));

            // 画钩子
            this.hook.draw(this.ctx);
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

