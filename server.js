const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 路由重定向 (为了方便访问)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/gold-miner', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gold-miner', 'index.html'));
});

app.get('/happy-bird', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'happy-bird', 'index.html'));
});

app.get('/mrs-chicken', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mrs-chicken', 'index.html'));
});

app.get('/free-chicken', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'free-chicken', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`- Gold Miner: http://localhost:${PORT}/gold-miner/`);
    console.log(`- Happy Bird: http://localhost:${PORT}/happy-bird/`);
    console.log(`- Mrs Chicken: http://localhost:${PORT}/mrs-chicken/`);
    console.log(`- Free Chicken: http://localhost:${PORT}/free-chicken/`);
});

