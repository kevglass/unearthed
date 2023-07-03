(() => {
    return new class {
        id = "wand";
        name = "Wand Mod";
        chatName = "Wand";
        version = 3;

        onGameStart = (game) => {
            // add a tool into the game - a magic wand
            // that create random blocks
            //
            // "holding/wand"   - The image to use for the tool
            // 0                - The block to place by default (0 for none)
            // "magic-wand"     - an ID for the tool for callbacks
            // true             - Should this tool target empty spaces
            game.addTool("holding/wand", 0, "magic-wand", true, false);
        };

        onUseTool = (game, player, x, y, layer, toolId) => {
            // if the player has waves our magic wand at a location
            if (toolId === "magic-wand") {
                game.log("Got tool ID invocation: " + toolId);

                // if theres no block already there
                if (game.getBlock(x, y, 0) === 0) {
                    // create a block of a random type
                    game.setBlock(x, y, 0, Math.floor(Math.random() * 5) + 10);
                    // play a whizzy sound effect
                    game.playSfx("foreground", 0.5);
                    // add some particles for style!
                    game.addParticlesAtTile("particles/blue", x, y, 10);
                    game.addParticlesAtTile("particles/white", x, y, 10);
                }
            }
        };
    }
})();