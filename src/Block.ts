import { GameMap, MAP_DEPTH, MAP_WIDTH, TILE_SIZE } from "./Map";
import { addParticle, createDirtParticle } from "./engine/Particles";
import { playSfx } from "./engine/Resources";

/**
 * Definition of a block that can appear in the map
 */
export interface Block {
    /** The id of the sprite to draw for the block */
    sprite: string;
    /** True if this one blocks movement */
    blocks: boolean;
    /** True if this block act as a ladder */
    ladder: boolean;
    /** The portal information if this block is a portal */
    portal?: (portal: Portal) => void;
    /** True if this block needs ground under it to exist - like flowers - automatically destroy if nothing there */
    needsGround: boolean;
    /** True if this one blocks the discovery process - leaves for instance don't */
    blocksDiscovery: boolean;
    /** True if this block leaves a copy of itself in the background layer when removed from the foreground, used for caves discovery */
    leaveBackground: boolean;
    /** True if this would block you when you're falling downward. */
    blocksDown: boolean;
    /** True if this block prevents lights passing */
    blocksLight: boolean;
    /** The timer object with the number of ticks it takes for the block's effect to happen and the callback that defines the effect */
    timer?: { timer: number, callback: (map: GameMap, timer: Timer) => void }|null;
    /** Does this block light the area */
    light?: boolean;
    /** True if we can't place this block in the background */
    backgroundDisabled?: boolean;
}

export interface Timer {
    /** The tile index in the map */
    tileIndex: number;
    /** The layer the timer is for */
    layer: number;
    /** The number of ticks until the timer triggers */
    timer: number;
    /** The callback to call when the timer triggers */
    callback: (map: GameMap, timer: Timer) => void;
}

export interface Portal {
    /** The tile index in the map */
    tileIndex: number;
    /** The code of the target server this portal links to */
    code: string | null;
}

/**
 * The list of tiles that be used in the map
 */
export let BLOCKS: Record<number, Block> = {};

/**
 * Initialise our tiles array once resources have been loaded
 */
export function initTiles() {
    BLOCKS = 
    {
        1: { sprite: "tiles/dirt",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        2: { sprite: "tiles/dirt_grass",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        3: { sprite: "tiles/brick_grey",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true },
        4: { sprite: "tiles/brick_red",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true },
        5: { sprite: "tiles/leaves",blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        6: { sprite: "tiles/sand",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true },
        7: { sprite: "tiles/wood",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true },
        8: { sprite: "tiles/ladder",blocks: false, blocksDown: false, ladder: true, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: false },
        9: { sprite: "tiles/grass1",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        10: { sprite: "tiles/grass2",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        11: { sprite: "tiles/grass3",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        12: { sprite: "tiles/grass4",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        13: { sprite: "tiles/flowerwhite",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        14: { sprite: "tiles/flowerblue",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        15: { sprite: "tiles/flowerred",blocks: false, blocksDown: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        16: { sprite: "tiles/trunk_bottom",blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
        17: { sprite: "tiles/trunk_mid",blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false },
    
        18: { sprite: "tiles/stone",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        19: { sprite: "tiles/coal",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        20: { sprite: "tiles/iron",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        21: { sprite: "tiles/silver",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        22: { sprite: "tiles/gold",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        23: { sprite: "tiles/diamond",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true, blocksLight: true },
        24: { sprite: "tiles/platform",blocks: false, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: false },
        25: { sprite: "tiles/tnt",blocks: true, blocksDown: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true, timer: { timer: 120, callback: EXPLOSION_MUTATOR } },
        26: { sprite: "tiles/torchtile",blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false, blocksLight: false, light: true, backgroundDisabled: true},
        27: { sprite: "tiles/portal",blocks: false, blocksDown: false, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false, blocksLight: true, backgroundDisabled: true, portal: (portal: Portal) => { const url = new URL(location.href); url.searchParams.set('portal', '1'); url.searchParams.set('server', portal?.code ?? ''); window.open(url.href) }},
    };
}

/**
 * A callback to explode a tile location 
 * 
 * @param map The map the explosion is taking place on
 * @param timer The timer that triggered the explosion
 */
const EXPLOSION_MUTATOR = (map: GameMap, timer: Timer): void => {
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
