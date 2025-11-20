class Leaderboard {
    constructor() {
        this.storageKey = 'gold_miner_scores';
        this.scores = this.loadScores();
    }

    loadScores() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    saveScores() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    }

    // 检查分数是否足以进入前10
    isHighScore(score) {
        if (this.scores.length < 10) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    addScore(name, score) {
        this.scores.push({ name, score, date: new Date().toLocaleDateString() });
        // 排序
        this.scores.sort((a, b) => b.score - a.score);
        // 保留前10
        if (this.scores.length > 10) {
            this.scores = this.scores.slice(0, 10);
        }
        this.saveScores();
    }

    getScores() {
        return this.scores;
    }
}

const leaderboard = new Leaderboard();

