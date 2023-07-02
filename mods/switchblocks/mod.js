(() => {
    return new class {
        id = "switches";
        name = "Switch Blocks";
        chatName = "Switch";
        version = 2;
        switchState = 0;

        onGameStart = (game) => {
            game.addImage("tiles/blockon", game.getModResource("on.png"));
            game.addImage("tiles/blockoff", game.getModResource("off.png"));
            game.addImage("tiles/blockswitch", game.getModResource("switch.png"));
            game.addBlock(120,
                {
                    sprite: "tiles/blockon",
                    blocks: true,
                    blocksDown: true, 
                    ladder: false, 
                    needsGround: false, 
                    blocksDiscovery: false, 
                    leaveBackground: false, 
                    blocksLight: false
                },
            );
            game.addBlock(121,
                {
                    sprite: "tiles/blockoff",
                    blocks: false,
                    blocksDown: false, 
                    ladder: false, 
                    needsGround: false, 
                    blocksDiscovery: false, 
                    leaveBackground: false, 
                    blocksLight: false
                },
            );
            game.addBlock(122,
                {
                    sprite: "tiles/blockswitch",
                    blocks: false,
                    blocksDown: false, 
                    ladder: false, 
                    needsGround: false, 
                    blocksDiscovery: false, 
                    leaveBackground: false, 
                    blocksLight: false
                },
            );
            game.addTool("tiles/blockoff", 121, "", false);
            game.addTool("tiles/blockswitch", 122, "", false);
        };

        onWorldStart = (game) => {
        };


        onTrigger = (game, mob, x, y) => {
            // if the player has triggered our switch
            if (game.getBlock(x,y,0) === 122) {
                if (this.switchState === 0) {
                    this.switchState = 1;
                    // we're turning block on so scan through and replace
                    game.replaceAllBlocks(121, 120);
                } else {
                    this.switchState = 0;
                    game.replaceAllBlocks(120, 121);
                }
            }
        };
    }
})();