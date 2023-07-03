new class {
    id = "maptest";
    name = "Map Mod";
    chatName = "Map";
    version = 2;

    onWorldStart = (game) => {
        game.loadMap(game.getModResource("testmap.bin"));
    };
}