const mod = {
    id: "generator",
    name: "Generator Mod",
    chatName: "GenX",
    version: 1,

    generateWorld: (game, width, height) => {
        for (let i=0;i<width;i++) {
            game.setBlock(i, 30, 0, i % 7 === 6 ? 0 : 1);
        }
    }
};

mod;