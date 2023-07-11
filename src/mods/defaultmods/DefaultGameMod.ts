import { GameMap, Layer, MAP_DEPTH, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE } from "src/Map";
import { GameContext, MobContext, ServerMod } from "../Mods";
import { Portal, Timer } from "src/Block";
import { addParticle, createDirtParticle } from "src/engine/Particles";
import { playSfx } from "src/engine/Resources";

export class DefaultBlockMod implements ServerMod {
    id: string = "default-blockTools";
    name: string = "BlockTools-Default";
    chatName: string = "blockTools";
    version: number = 1;
    apiVersion: number = 1;

    blockIds: Record<string, string> = {};

    /**
     * A callback to explode a tile location 
     * 
     * @param map The map the explosion is taking place on
     * @param timer The timer that triggered the explosion
     */
    explosionMutator = (map: GameMap, timer: Timer): void => {
        for (let x = timer.tileIndex % MAP_WIDTH - 1; x <= timer.tileIndex % MAP_WIDTH + 1; x++) {
            for (let y = Math.floor(timer.tileIndex / MAP_WIDTH) - 1; y <= Math.floor(timer.tileIndex / MAP_WIDTH) + 1; y++) {
                if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_DEPTH) {
                    continue;
                }
                if (map.getTile(x, y, timer.layer) !== 0) {
                    map.setTile(x, y, 0, timer.layer);
                    for (let i = 0; i < 5; i++) {
                        addParticle(createDirtParticle((x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE));
                    }
                }
            }
        }
        playSfx("explosion", 1);
    }

    onGameStart(game: GameContext): void {
        game.addTool("holding/pick_iron", 0, "iron-pick", false, true, 60, true, 0.01);
        game.addTool("holding/pick_stone", 0, "stone-pick", false, true, 75, true, 0.01);

        game.addBlock(1, { sprite: "tiles/dirt", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(2, { sprite: "tiles/dirt_grass", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(3, { sprite: "tiles/brick_grey", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addBlock(4, { sprite: "tiles/brick_red", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addBlock(5, { sprite: "tiles/leaves", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(6, { sprite: "tiles/sand", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addBlock(7, { sprite: "tiles/wood", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addBlock(8, { sprite: "tiles/ladder", blocks: false, blocksDown: false, ladder: true, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: false });
        game.addBlock(9, { sprite: "tiles/grass1", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(10, { sprite: "tiles/grass2", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(11, { sprite: "tiles/grass3", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(12, { sprite: "tiles/grass4", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(13, { sprite: "tiles/flowerwhite", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(14, { sprite: "tiles/flowerblue", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(15, { sprite: "tiles/flowerred", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(16, { sprite: "tiles/trunk_bottom", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(17, { sprite: "tiles/trunk_mid", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false });

        game.addBlock(18, { sprite: "tiles/stone", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(19, { sprite: "tiles/coal", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(20, { sprite: "tiles/iron", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(21, { sprite: "tiles/silver", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(22, { sprite: "tiles/gold", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(23, { sprite: "tiles/diamond", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(24, { sprite: "tiles/platform", blocks: false, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: false });
        game.addBlock(25, { sprite: "tiles/tnt", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true, timer: { timer: 120, callback: this.explosionMutator } });
        game.addBlock(26, { sprite: "tiles/torchtile", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false, light: true, backgroundDisabled: true });
        game.addBlock(27, {
            sprite: "tiles/portal", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true, backgroundDisabled: true, portal: (portal: Portal) => {
                const url = new URL(location.href);
                url.searchParams.set('portal', '1');
                url.searchParams.set('server', portal?.code ?? '');
                window.open(url.href)
            }
        });
        game.addBlock(28, { sprite: "tiles/rock", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });

        this.blockIds["dirt"] = game.addTool("tiles/dirt", 1, undefined, true, false, 0, false, 1);
        this.blockIds["stone"] = game.addTool("tiles/stone", 18, undefined, true, false, 0, false, 1);
        this.blockIds["wood"] = game.addTool("tiles/wood", 7, undefined, true, false, 0, false, 1);
        game.addTool("tiles/brick_grey", 3, undefined, true, false);
        game.addTool("tiles/brick_red", 4, undefined, true, false);
        game.addTool("tiles/sand", 6, undefined, true, false);
        game.addTool("tiles/wood", 7, undefined, true, false);
        game.addTool("tiles/ladder", 8, undefined, true, false);
        game.addTool("tiles/platform", 24, undefined, true, false);
        game.addTool("holding/torch", 26, undefined, true, false);
        game.addTool("tiles/tnt", 25, undefined, true, false);
        game.addTool("tiles/portal", 27, undefined, true, false);
    }

    onSetTile(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, block: number, oldBlock: number): void {
        if (!game.inCreativeMode()) {
            if (block === 0) {
                if (oldBlock === 1) {
                    game.createItem(x, y, 1, this.blockIds["dirt"]);
                }
                if (oldBlock === 28) {
                    game.createItem(x, y, 1, this.blockIds["stone"]);
                }
                if (oldBlock === 16) {
                    game.createItem(x, y, 1, this.blockIds["wood"]);
                }
                if (oldBlock === 17) {
                    game.createItem(x, y, 1, this.blockIds["wood"]);
                }
            }
        }
    }

    onUseTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "iron-pick" || toolId === "stone-pick" || toolId === "hands") {
            game.setBlock(x, y, layer, 0);
            game.playSfx('mining_break', 0.6, 5);
        }
    }

    onProgressTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "iron-pick" || toolId === "stone-pick" || toolId === "hands") {
            game.playSfx('mining', 0.5, 5);
        }
    }

    generateWorld(game: GameContext, width: number, height: number): void {
        console.log("Generating map");

        // map generation
        let h = 0;
        let offset = 0;
        let sinceLastTree = 0;

        // first lets generate some hills, plants and trees. Could have used perlin 
        // noise here but found a simple height adjusting flow was easier. Make it more likely
        // to raise the height of the ground until we reach max hill height (10,then switch
        // to making it more likely to move down until we reach the ground. Get nice flowing
        // hills this way.
        for (let x = 5; x < MAP_WIDTH; x++) {
            sinceLastTree++;
            if (h > 10) {
                offset = 0.3;
            }
            if (h < 2) {
                offset = 0;
            }
            if (Math.random() < 0.2 + offset) {
                h--;
            } else if (Math.random() > 0.5 + offset) {
                h++;
            }

            if (h < 0) {
                h = 0;
            }
            for (let i = 0; i < h; i++) {
                game.setBlock(x, SKY_HEIGHT - i, Layer.FOREGROUND, 1);
            }
            game.setBlock(x, SKY_HEIGHT - h, Layer.FOREGROUND, 2);

            // consider adding a plant or grass on top
            if (Math.random() < 0.2) {
                const grass = Math.floor(Math.random() * 4) + 9;
                game.setBlock(x, SKY_HEIGHT - h - 1, Layer.FOREGROUND, grass);
            } else if (Math.random() < 0.23) {
                const flower = Math.floor(Math.random() * 3) + 13;
                game.setBlock(x, SKY_HEIGHT - h - 1, Layer.FOREGROUND, flower);
            } else if (Math.random() < 0.23) {
                const rock = 28;
                game.setBlock(x, SKY_HEIGHT - h - 1, Layer.FOREGROUND, rock);
            }

            // build a tree now and again
            if (Math.random() > 0.85) {
                if (sinceLastTree > 5) {
                    sinceLastTree = 0;
                    const heightOfTree = Math.floor(Math.random() * 3) + 2;
                    game.setBlock(x, SKY_HEIGHT - h - 1, Layer.FOREGROUND, 16);
                    for (let i = 1; i < heightOfTree; i++) {
                        game.setBlock(x, SKY_HEIGHT - h - 1 - i, Layer.FOREGROUND, 17);
                    }

                    for (let tx = -1; tx < 2; tx++) {
                        for (let ty = -3; ty < 0; ty++) {
                            game.setBlock(x + tx, SKY_HEIGHT - h - heightOfTree + ty, Layer.FOREGROUND, 5);
                        }
                    }
                }
            }
        }

        // cut some caverns into the ground
        for (let i = 0; i < 100; i++) {
            this.placeSeam(game, 0, 4, SKY_HEIGHT + 5, MAP_DEPTH - 15, 5);
        }

        // now add some stone - quite a lot and across the whole depth
        for (let i = 0; i < 80; i++) {
            this.placeSeam(game, 18, 3, SKY_HEIGHT + 5, MAP_DEPTH - 15, 3);
        }
        // now add some coal - quite a lot and across the whole depth
        for (let i = 0; i < 60; i++) {
            this.placeSeam(game, 19, 3, SKY_HEIGHT + 5, MAP_DEPTH - 15, 3);
        }
        // now add some iron - less and only at 40 depth or deeper
        for (let i = 0; i < 40; i++) {
            this.placeSeam(game, 20, 3, SKY_HEIGHT + 40, MAP_DEPTH - 15, 3);
        }
        // now add some silver - less and only at 60 depth or deeper
        for (let i = 0; i < 30; i++) {
            this.placeSeam(game, 21, 3, SKY_HEIGHT + 60, MAP_DEPTH - 15, 2);
        }
        // now add some gold - less and only at 100 depth or deeper
        for (let i = 0; i < 30; i++) {
            this.placeSeam(game, 22, 3, SKY_HEIGHT + 100, MAP_DEPTH - 15, 2);
        }
        // now add some iron - even less and only at 150 depth or deeper
        for (let i = 0; i < 20; i++) {
            this.placeSeam(game, 23, 3, SKY_HEIGHT + 150, MAP_DEPTH - 15, 2);
        }
    }

    private placeSeam(game: GameContext, tile: number, size: number, upper: number, lower: number, cutBase: number): void {
        let x = 10 + Math.floor(Math.random() * (MAP_WIDTH - 20));
        let y = upper + Math.floor(Math.random() * (MAP_DEPTH - upper));
        const cutCount = cutBase + Math.floor(Math.random() * 5);

        // for each cut use the brush to apply the tile specified
        for (let cut = 0; cut < cutCount; cut++) {
            const brushWidth = size + Math.floor(Math.random() * 2);
            const brushHeight = size + Math.floor(Math.random() * 2);

            let edges = [];

            // place the brush size tiles
            for (let bx = 0; bx < brushWidth; bx++) {
                for (let by = 0; by < brushHeight; by++) {
                    // round the corners - i.e. don't draw them
                    if (bx === 0 && (by === 0 || by === brushHeight - 1)) {
                        continue;
                    }
                    if (bx === brushWidth - 1 && (by === 0 || by === brushHeight - 1)) {
                        continue;
                    }

                    let tx = x + bx - Math.floor(brushWidth / 2);
                    let ty = y + by - Math.floor(brushHeight / 2);

                    // remember the edges of the brush
                    if ((bx === 0 || by === 0 || bx === brushHeight - 1 || by === brushWidth - 1)) {
                        if ((ty > SKY_HEIGHT + 5) && (ty < MAP_DEPTH - 15)) {
                            edges.push([tx, ty]);
                        }
                    }

                    // place the tiles
                    game.setBlock(tx, ty, Layer.FOREGROUND, tile);
                    game.setBlock(tx, ty, Layer.BACKGROUND, 1);
                }
            }

            if (edges.length === 0) {
                return;
            }

            // select an edge from the last cut and use it as a start point for
            // the next cut
            let nextCenter = edges[Math.floor(Math.random() * edges.length)];
            x = nextCenter[0];
            y = nextCenter[1];
        }
    }
}