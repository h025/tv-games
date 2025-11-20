class Item {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        const props = CONSTANTS.ITEMS[type];
        this.score = props.score;
        this.weight = props.weight;
        this.radius = props.radius;
        this.exists = true;
    }

    draw(ctx) {
        if (!this.exists) return;
        
        switch (this.type) {
            case CONSTANTS.ITEM_TYPE.GOLD_L:
            case CONSTANTS.ITEM_TYPE.GOLD_M:
            case CONSTANTS.ITEM_TYPE.GOLD_S:
                Sprites.drawGold(ctx, this.x, this.y, this.radius);
                break;
            case CONSTANTS.ITEM_TYPE.ROCK_L:
            case CONSTANTS.ITEM_TYPE.ROCK_S:
                Sprites.drawRock(ctx, this.x, this.y, this.radius);
                break;
            case CONSTANTS.ITEM_TYPE.DIAMOND:
                Sprites.drawDiamond(ctx, this.x, this.y, this.radius);
                break;
            case CONSTANTS.ITEM_TYPE.BAG:
                Sprites.drawBag(ctx, this.x, this.y, this.radius);
                break;
            case CONSTANTS.ITEM_TYPE.TNT:
                Sprites.drawTNT(ctx, this.x, this.y, this.radius);
                break;
        }
    }
}

class Hook {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = CONSTANTS.HOOK_ORIGIN_X;
        this.y = CONSTANTS.HOOK_ORIGIN_Y;
        this.length = CONSTANTS.HOOK_LENGTH;
        this.angle = 0; 
        this.angleSpeed = CONSTANTS.SWING_SPEED;
        this.state = 'SWING'; // SWING, SHOOT, RETURN
        this.caughtItem = null;
    }

    update() {
        if (this.state === 'SWING') {
            this.angle += this.angleSpeed;
            if (this.angle >= CONSTANTS.MAX_ANGLE || this.angle <= -CONSTANTS.MAX_ANGLE) {
                this.angleSpeed = -this.angleSpeed;
            }
            this.updateCoords();
        } else if (this.state === 'SHOOT') {
            this.length += CONSTANTS.HOOK_SPEED;
            
            // 边界检测 (简单处理: 超出屏幕范围或一定长度)
            if (this.x < 0 || this.x > CONSTANTS.CANVAS_WIDTH || this.y > CONSTANTS.CANVAS_HEIGHT) {
                this.state = 'RETURN';
            }
            
            this.updateCoords();

        } else if (this.state === 'RETURN') {
            let speed = CONSTANTS.HOOK_RETURN_SPEED_FAST;
            
            if (this.caughtItem) {
                // 重量影响速度
                speed = CONSTANTS.HOOK_RETURN_SPEED_FAST / this.caughtItem.weight;
                // 移动物品 (物品跟随钩子碰撞点)
                // 计算碰撞点位置 (复用 getCollisionPoint 逻辑)
                const colPoint = this.getCollisionPoint();
                // 物品中心对准碰撞点下方一点点，看起来像是被钩子挂住
                this.caughtItem.x = colPoint.x;
                this.caughtItem.y = colPoint.y + this.caughtItem.radius * 0.5;
            }
            
            this.length -= speed;
            
            if (this.length <= CONSTANTS.HOOK_LENGTH) {
                this.length = CONSTANTS.HOOK_LENGTH;
                this.state = 'SWING';
                // 结算物品
                if (this.caughtItem) {
                    // 触发事件交给Game类处理分数增加
                    // 逻辑在Game Loop里判断
                }
            }
            this.updateCoords();
        }
    }

    updateCoords() {
        const rad = Utils.degToRad(this.angle);
        this.x = CONSTANTS.HOOK_ORIGIN_X + this.length * Math.sin(rad);
        this.y = CONSTANTS.HOOK_ORIGIN_Y + this.length * Math.cos(rad);
    }

    // 获取真实的碰撞检测点 (钩子爪子中心)
    getCollisionPoint() {
        const rad = Utils.degToRad(this.angle);
        const offset = 15; // 钩子爪子的视觉偏移量
        return {
            x: this.x + offset * Math.sin(rad),
            y: this.y + offset * Math.cos(rad)
        };
    }

    shoot() {
        if (this.state === 'SWING') {
            this.state = 'SHOOT';
            audioManager.playShoot();
        }
    }

    // 炸药使用逻辑
    useTNT() {
        if (this.state === 'RETURN' && this.caughtItem && this.caughtItem.type !== CONSTANTS.ITEM_TYPE.TNT) {
            // 销毁物品
            this.caughtItem.exists = false;
            this.caughtItem = null;
            audioManager.playExplosion();
        }
    }

    draw(ctx) {
        // 画线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CONSTANTS.HOOK_ORIGIN_X, CONSTANTS.HOOK_ORIGIN_Y);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // 画钩爪
        Sprites.drawHook(ctx, this.x, this.y, Utils.degToRad(this.angle));
    }
}
