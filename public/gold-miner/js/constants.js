const CONSTANTS = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    HOOK_ORIGIN_X: 400,
    HOOK_ORIGIN_Y: 60, // 矿工在上面
    HOOK_LENGTH: 50,
    HOOK_SPEED: 5,
    HOOK_RETURN_SPEED_FAST: 10, // 空钩回拉速度
    SWING_SPEED: 1.5, // 摆动角速度 (度/帧)
    MAX_ANGLE: 70, // 左右最大摆动角度
    
    // 物品类型
    ITEM_TYPE: {
        GOLD_L: 'gold-large',
        GOLD_M: 'gold-medium',
        GOLD_S: 'gold-small',
        ROCK_L: 'rock-large',
        ROCK_S: 'rock-small',
        DIAMOND: 'diamond',
        BAG: 'mystery-bag',
        TNT: 'tnt'
    },

    // 物品属性 (分值, 重量/回拉速度因子)
    // weight越大，速度越慢。speed = normal_speed / weight
    ITEMS: {
        'gold-large': { score: 500, weight: 4, radius: 30, color: '#FFD700' },
        'gold-medium': { score: 250, weight: 2.5, radius: 20, color: '#FFD700' },
        'gold-small': { score: 100, weight: 1.5, radius: 12, color: '#FFD700' },
        'rock-large': { score: 20, weight: 5, radius: 35, color: '#808080' },
        'rock-small': { score: 10, weight: 3, radius: 20, color: '#808080' },
        'diamond': { score: 600, weight: 0.5, radius: 10, color: '#00FFFF' }, // 极轻
        'mystery-bag': { score: 0, weight: 1.5, radius: 18, color: '#FF69B4' }, // 分数随机
        'tnt': { score: 0, weight: 1, radius: 20, color: '#FF0000' } // 不会拉回，直接爆
    },

    LEVELS: [
        { goal: 650, time: 60 },
        { goal: 1500, time: 60 },
        { goal: 2800, time: 60 },
        { goal: 4500, time: 60 },
        { goal: 7000, time: 60 },
        { goal: 10000, time: 60 } // 无限循环或到此为止
    ]
};

