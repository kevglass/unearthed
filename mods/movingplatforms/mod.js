new class {
    id = "default-Test";
    name = "Test-Default";
    chatName = "test";
    version = 1;
    apiVersion = 1;
    dependencies = [
        {
            modId: "default-blockTools",
            minVersion: 0
        }
    ];

    platformMob;
    platformMob2;
    down;

    onWorldStart(game) {
        game.addSkin("platform", {
            width: 50,
            height: 37,
            skeleton: {
                name: "root",
                centerX: 0,
                centerY: 0,
                angle: 0,
                layer: 0,
                image: "skins/fox/body",
                spriteOffsetX: -50,
                spriteOffsetY: -37
            },
            animation: {
                idle: {
                    "root": [{ time: 0, angle: 0}]
                },
                walk: {
                    "root": [{ time: 0, angle: 0}]
                },
            }
        })

        this.platformMob = game.createMob("", "platform", 300, (SKY_HEIGHT - 2) * TILE_SIZE, (game, mob) => {
            if (mob.state.blockedRight) {
                mob.vx = -3;
            } else if (mob.state.blockedLeft) {
                mob.vx = 3;
            }
        });
        this.platformMob.gravity = 0;
        this.platformMob.vx = 3;
        this.platformMob.blocksMovement = true;

        this.platformMob2 = game.createMob("", "platform", 300, (SKY_HEIGHT - 3) * TILE_SIZE, (game, mob) => {
            if (mob.state.blockedBelow) {
                mob.vy = -3;
            } else if (mob.y < (SKY_HEIGHT - 7) * TILE_SIZE || mob.state.blockedAbove) {
                mob.vy = 3;
            }
        });
        this.platformMob2.gravity = 0;
        this.platformMob2.vy = -3;
        this.platformMob2.blocksMovement = true;
    }
}