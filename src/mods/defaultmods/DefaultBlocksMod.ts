import { GameMap, Layer, MAP_DEPTH, MAP_WIDTH, TILE_SIZE } from "src/Map";
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
                if (map.getTile(x,y, timer.layer) !== 0) {
                    map.setTile(x, y, 0, timer.layer);
                    for (let i=0;i<5;i++) {
                        addParticle(createDirtParticle((x+ 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE));
                    }
                }
            }
        }
        playSfx("explosion", 1);
    }

    onGameStart(game: GameContext): void {

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
}