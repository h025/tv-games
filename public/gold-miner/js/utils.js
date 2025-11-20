const Utils = {
    // 生成范围随机整数 [min, max]
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 碰撞检测 (点与圆)
    checkCollision: function(pointX, pointY, circleX, circleY, radius) {
        const dx = pointX - circleX;
        const dy = pointY - circleY;
        return (dx * dx + dy * dy) <= (radius * radius);
    },

    // 角度转弧度
    degToRad: function(deg) {
        return deg * (Math.PI / 180);
    },

    // 距离计算
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
};

