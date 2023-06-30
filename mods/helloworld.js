const mod = {
    name: "Hello World Mod",
    chatName: "Mod",
    version: 2,

    onWorldStart(game) {
        game.displayChat("Hello World!");
    }
};

mod;