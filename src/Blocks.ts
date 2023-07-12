import { Block } from "./mods/ModApi";

export interface Timer {
    /** The x coordinate of the tile index in the map */
    tileX?: number;
    /** The y coordinate of the tile index in the map */
    tileY?: number;
    /** The layer the timer is for */
    layer?: number;
    /** The number of ticks until the timer triggers */
    timer: number;
    /** The name of the callback to fire */
    callbackName: string;
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

