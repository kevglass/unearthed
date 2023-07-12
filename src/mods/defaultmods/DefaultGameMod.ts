import { MAP_DEPTH, MAP_WIDTH, SKY_HEIGHT } from "src/Map";
import { GameContext, Layer, MobContext, Portal, ServerMod } from "../ModApi";

export class DefaultBlockMod implements ServerMod {
    id: string = "default-blockTools";
    name: string = "BlockTools-Default";
    chatName: string = "blockTools";
    version: number = 1;
    apiVersion: number = 1;

    produces: Record<number, { chance: number, itemId: string }> = {};
    seedItemId: string = "";

    explosionMutator = (game: GameContext, tileX: number, tileY: number, layer: number): void => {
        for (let x =tileX - 1; x <= tileX + 1; x++) {
            for (let y = tileY - 1; y <= tileY + 1; y++) {
                if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_DEPTH) {
                    continue;
                }
                if (game.getBlock(x, y, layer) !== 0) {
                    game.setBlock(x, y, layer, 0);
                    game.addParticlesAtTile("particles/red", x, y, 5);
                }
            }
        }
        game.playSfx("explosion", 1);
    }

    onGameStart(game: GameContext): void {
        const ironPickId = game.addTool("holding/pick_iron", 0, "iron-pick", false, true, 60, true, 0.01);
        const stonePickId = game.addTool("holding/pick_stone", 0, "stone-pick", false, true, 75, true, 0.01);

        game.addBlock(1, { sprite: "tiles/dirt", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(2, { sprite: "tiles/dirt_grass", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        this.produces[1] = this.produces[2] = { chance: 1, itemId: game.addTool("tiles/dirt", 1, undefined, true, false, 0, false, 1) };

        game.addBlock(3, { sprite: "tiles/brick_grey", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addTool("tiles/brick_grey", 3, undefined, true, false, 0, false, 1);

        game.addBlock(4, { sprite: "tiles/brick_red", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addTool("tiles/brick_red", 4, undefined, true, false, 0, false, 1);

        game.addBlock(5, { sprite: "tiles/leaves", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        this.produces[5] = { chance: 0.2, itemId: game.addTool("tiles/seed", 0, "seeds", false, true, 0, false, 0) };
        this.seedItemId = this.produces[5].itemId;

        game.addBlock(6, { sprite: "tiles/sand", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        game.addTool("tiles/sand", 6, undefined, true, false, 0, false, 1);

        game.addBlock(7, { sprite: "tiles/wood", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true });
        this.produces[7] = { chance: 1, itemId: game.addTool("tiles/wood", 7, undefined, true, false, 0, false, 1) };

        game.addBlock(8, { sprite: "tiles/ladder", blocks: false, blocksDown: false, ladder: true, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: false });
        const ladderId = game.addTool("tiles/ladder", 8, undefined, true, false, 0, false, 1);

        game.addBlock(9, { sprite: "tiles/grass1", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(10, { sprite: "tiles/grass2", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(11, { sprite: "tiles/grass3", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(12, { sprite: "tiles/grass4", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(13, { sprite: "tiles/flowerwhite", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(14, { sprite: "tiles/flowerblue", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(15, { sprite: "tiles/flowerred", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });

        game.addBlock(16, { sprite: "tiles/trunk_bottom", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        game.addBlock(17, { sprite: "tiles/trunk_mid", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        const woodItem = this.produces[16] = this.produces[17] = { chance: 1, itemId: game.addTool("tiles/wood", 7, undefined, true, false, 0, false, 1) };

        game.addBlock(18, { sprite: "tiles/stone", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        game.addBlock(28, { sprite: "tiles/rock", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
        const stoneItem = this.produces[28] = this.produces[18] = { chance: 1, itemId: game.addTool("tiles/stone", 18, undefined, true, false, 0, false, 1) };

        game.addBlock(19, { sprite: "tiles/coal", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        const coalItem = this.produces[19] = { chance: 1, itemId: game.addTool("tiles/coalore", 0, undefined, false, false, undefined, false, 0) };

        game.addBlock(20, { sprite: "tiles/iron", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        const ironItem = this.produces[20] = { chance: 1, itemId: game.addTool("tiles/ironore", 0, undefined, false, false, undefined, false, 0) };

        game.addBlock(21, { sprite: "tiles/silver", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        const silverItemId = this.produces[21] = { chance: 1, itemId: game.addTool("tiles/silverore", 0, undefined, false, false, undefined, false, 0) };

        game.addBlock(22, { sprite: "tiles/gold", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        const goldItemId = this.produces[22] = { chance: 1, itemId: game.addTool("tiles/goldore", 0, undefined, false, false, undefined, false, 0) };

        game.addBlock(23, { sprite: "tiles/diamond", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true });
        const diamondItemId = this.produces[23] = { chance: 1, itemId: game.addTool("tiles/diamondore", 0, undefined, false, false, undefined, false, 0) };

        game.addBlock(24, { sprite: "tiles/platform", blocks: false, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: false });
        const platformId = game.addTool("tiles/platform", 24, undefined, true, false, 0, false, 1);

        game.addBlock(25, { sprite: "tiles/tnt", blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true, timer: { timer: 120, callbackName: "tntTimer" } });
        const tntId = game.addTool("tiles/tnt", 25, undefined, true, false, 0, false, 1);

        game.addBlock(26, { sprite: "tiles/torchtile", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false, light: true, backgroundDisabled: true });
        const torchId = game.addTool("holding/torch", 26, undefined, true, false, 0, false, 1);

        game.addBlock(27, {
            sprite: "tiles/portal", blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true, backgroundDisabled: true, 
            portal: (portal: Portal) => {
                const url = new URL(location.href);
                url.searchParams.set('portal', '1');
                url.searchParams.set('server', portal?.code ?? '');
                window.open(url.href)
            }
        });

        game.addTool("tiles/portal", 27, undefined, true, false, 0, false, 1);
        game.addBlock(29, { sprite: "tiles/sapling", blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false });
       
        ///
        /// Recipes
        const stonePickRecipe = {
            name: "Stone Pick Axe",
            inputs: [
                {
                    type: stoneItem.itemId,
                    count: 3,
                },
                {
                    type: woodItem.itemId,
                    count: 2
                }
            ],
            output: {
                type: stonePickId,
                count: 1
            }
        };
        game.addRecipe("stone-pick", stonePickRecipe);

        const ironPickRecipe = {
            name: "Iron Pick Axe",
            inputs: [
                {
                    type: ironItem.itemId,
                    count: 3,
                },
                {
                    type: woodItem.itemId,
                    count: 2
                }
            ],
            output: {
                type: ironPickId,
                count: 1
            }
        };
        game.addRecipe("iron-pick", ironPickRecipe);
        const torchRecipe = {
            name: "Torch",
            inputs: [
                {
                    type: coalItem.itemId,
                    count: 1,
                },
                {
                    type: woodItem.itemId,
                    count: 1
                }
            ],
            output: {
                type: torchId,
                count: 3
            }
        };
        game.addRecipe("torch", torchRecipe);
        const ladderRecipe = {
            name: "Ladder",
            inputs: [
                {
                    type: woodItem.itemId,
                    count: 1
                }
            ],
            output: {
                type: ladderId,
                count: 3
            }
        };
        game.addRecipe("ladder", ladderRecipe);
    }

    onSetTile(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, block: number, oldBlock: number): void {
        if (!game.inCreativeMode()) {
            if ((block === 0) && (layer == Layer.FOREGROUND)) {
                if (this.produces[oldBlock]) {
                    if (Math.random() < this.produces[oldBlock].chance) {
                        game.createItem(x, y, 1, this.produces[oldBlock].itemId);
                    }
                }
            }
        }
    }

    onTimerFired(game: GameContext, callbackName: string, tileX?: number | undefined, tileY?: number | undefined, layer?: number | undefined): void {
        if (callbackName === "tntTimer") {
            this.explosionMutator(game, tileX!, tileY!, layer!);
        }

        if (callbackName === "growTree") {
            const x = tileX!;
            const y = tileY!;
            if (game.getBlock(x, y - 1, Layer.FOREGROUND) === 29) {
                game.setBlock(x, y - 1, Layer.FOREGROUND, 16);
                if (game.getBlock(x, y - 2, Layer.FOREGROUND) === 0) {
                    game.setBlock(x, y - 2, Layer.FOREGROUND, 17);

                    for (let xo = -1; xo < 2; xo++) {
                        for (let yo = -1; yo < 2; yo++) {
                            if (game.getBlock(x + xo, y - 4 + yo, Layer.FOREGROUND) === 0) {
                                game.setBlock(x + xo, y - 4 + yo, Layer.FOREGROUND, 5);
                            }
                        }
                    }
                }
            }
        }
    }

    onUseTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "iron-pick" || toolId === "stone-pick" || toolId === "hands") {
            game.setBlock(x, y, layer, 0);
            game.playSfx('mining_break', 0.6, 5);
        }

        if (toolId === "seeds" && mob) {
            // only grows in dirt on the top
            if (game.getBlock(x, y, Layer.FOREGROUND) === 2) {
                if (game.getBlock(x, y - 1, Layer.FOREGROUND) === 0) {
                    game.setBlock(x, y - 1, Layer.FOREGROUND, 29);
                    game.takeItem(mob, 1, this.seedItemId);

                    game.startTimer("growTree", 360, x, y, Layer.FOREGROUND);
                }
            }
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
        for (let i = 0; i < 70; i++) {
            this.placeSeam(game, 19, 3, SKY_HEIGHT + 5, MAP_DEPTH - 15, 3);
        }
        // now add some iron - less and only at 40 depth or deeper
        for (let i = 0; i < 60; i++) {
            this.placeSeam(game, 20, 3, SKY_HEIGHT + 20, MAP_DEPTH - 45, 3);
        }
        // now add some silver - less and only at 60 depth or deeper
        for (let i = 0; i < 40; i++) {
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