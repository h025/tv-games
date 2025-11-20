const Sprites = {
    drawGold: function(ctx, x, y, radius) {
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // 画一个稍微不规则的圆
        ctx.ellipse(x, y, radius, radius * 0.8, Math.PI / 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - radius/3, y - radius/3, radius/4, 0, 2 * Math.PI);
        ctx.fill();
    },

    drawRock: function(ctx, x, y, radius) {
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // 画一个多边形模拟石头
        const sides = 6;
        ctx.moveTo(x + radius * Math.cos(0), y + radius * Math.sin(0));
        for (let i = 1; i <= sides; i++) {
            ctx.lineTo(x + radius * Math.cos(i * 2 * Math.PI / sides), y + radius * Math.sin(i * 2 * Math.PI / sides));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    },

    drawDiamond: function(ctx, x, y, radius) {
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        // 菱形
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y);
        ctx.lineTo(x, y + radius);
        ctx.lineTo(x - radius, y);
        ctx.closePath();
        ctx.fill();
        
        // 内部线条使其看起来像切面
        ctx.strokeStyle = '#E0FFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - radius, y);
        ctx.lineTo(x + radius, y);
        ctx.stroke();
    },

    drawBag: function(ctx, x, y, radius) {
        ctx.fillStyle = '#FF69B4'; // 粉色袋子
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI, false); // 下半圆
        ctx.lineTo(x - radius * 0.8, y - radius * 0.5);
        ctx.lineTo(x, y - radius * 1.2); // 结
        ctx.lineTo(x + radius * 0.8, y - radius * 0.5);
        ctx.closePath();
        ctx.fill();
        
        // 问号
        ctx.fillStyle = '#FFF';
        ctx.font = `${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x, y);
    },

    drawTNT: function(ctx, x, y, radius) {
        // 红色圆柱体
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(x - radius/2, y - radius, radius, radius * 2);
        
        // 黑色条纹
        ctx.fillStyle = '#000';
        ctx.fillRect(x - radius/2, y - radius/2, radius, 5);
        
        // 文字
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${radius/1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('TNT', x, y + 5);
        
        // 引信
        ctx.beginPath();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.moveTo(x, y - radius);
        ctx.quadraticCurveTo(x + 10, y - radius - 10, x + 15, y - radius - 5);
        ctx.stroke();
        
        // 火花 (简单的闪烁效果需要时间参数，这里简化为画个红点)
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(x + 15, y - radius - 5, 3, 0, 2*Math.PI);
        ctx.fill();
    },

    drawMiner: function(ctx, x, y) {
        // 简单的矿工图形 (可以用emoji代替或者画个火柴人)
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👷', x, y);
    },
    
    drawHook: function(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle); // angle in radians
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#777';

        // 钩子重新设计：双爪锚型
        // (0,0) 是绳子连接点
        
        // 1. 中心轴
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 15);
        ctx.stroke();

        // 2. 爪子 (左右两边)
        ctx.beginPath();
        // 左爪
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(-12, 12, -8, 22);
        ctx.stroke();

        ctx.beginPath();
        // 右爪
        ctx.moveTo(0, 10);
        ctx.quadraticCurveTo(12, 12, 8, 22);
        ctx.stroke();

        // 3. 装饰：中间的横向连接件
        ctx.beginPath();
        ctx.moveTo(-4, 15);
        ctx.lineTo(4, 15);
        ctx.stroke();
        
        ctx.restore();
    }
};
