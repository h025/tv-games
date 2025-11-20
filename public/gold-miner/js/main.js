// 入口文件
window.onload = function() {
    const game = new Game();

    // 按钮事件绑定
    document.getElementById('start-btn').addEventListener('click', () => {
        game.start();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        game.ui.gameOverScreen.classList.add('hidden');
        game.ui.mainMenu.classList.remove('hidden');
    });
    
    document.getElementById('leaderboard-btn').addEventListener('click', () => {
        alert('排行榜数据:\n' + leaderboard.getScores().map((s, i) => `${i+1}. ${s.name}: ${s.score}`).join('\n'));
    });

    document.getElementById('save-score-btn').addEventListener('click', () => {
        game.submitScore();
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (game.gameState === 'PLAYING') {
            if (e.code === 'ArrowDown' || e.code === 'Space') {
                game.hook.shoot();
            }
            if (e.code === 'ArrowUp') {
                game.useTNT();
            }
        }
    });
};

