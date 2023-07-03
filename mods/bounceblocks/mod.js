return new class {
    id = "bounce";
    name = "Bounce Block";
    chatName = "Bounce";
    version = 2;

    onGameStart = (game) => {
        game.addImage("tiles/bounce", game.getModResource("block.png"));
        game.addBlock(110,
            {
                sprite: "tiles/bounce",
                blocks: true,
                blocksDown: true,
                ladder: false,
                needsGround: false,
                blocksDiscovery: false,
                leaveBackground: false,
                blocksLight: false
            },
        );
        game.addTool("tiles/bounce", 110, "", true, false);
    };

    onWorldStart = (game) => {
    };


    onStandOn = (game, mob, x, y) => {
        // if we're standing on a bounce block then change the velocity of the player
        if (game.getBlock(x, y, 0) === 110) {
            // we want to allow the player to walk across the block with out bouncing
            if (mob.vy > 1) {
                mob.vy = -25;
            }
        }
    };
} 