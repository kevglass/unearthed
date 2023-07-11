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
    };
}

