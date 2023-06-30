const mod = {
    name: "Hello World Mod",
    chatName: "Mod",
    version: 2,

    onGameStart: (game) => {
        game.replaceImage("tiles/tnt", game.getModResource("tntalt.png"));
    },

    onWorldStart: (game) => {
        game.displayChat("Hello World!");
    },
};

mod;