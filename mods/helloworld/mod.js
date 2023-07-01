const mod = {
    name: "Hello World Mod",
    chatName: "Mod",
    version: 2,

    onGameStart: (game) => {
        game.addImage("tiles/tnt", game.getModResource("tntalt.png"));
    },

    onWorldStart: (game) => {
        game.displayChat("Hello World!");
    },

    // generateWorld: (game, width, height) => {
    //     for (let i=0;i<width;i++) {
    //         game.setBlock(i, 30, 0, i % 7 === 6 ? 0 : 1);
    //     }
    // }
};

mod;