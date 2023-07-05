
/**
 * An item that can be placed in the players inventory
 */
export interface InventItem {
    /** The sprite to draw for the item - both as the bone and the UI */
    sprite: string;
    /** The tile to be placed when they use this item - 0 for none, like tools */
    place: number;
    /** The sprite offset when this item is held */
    spriteOffsetX: number;
    /** The sprite offset when this item is held */
    spriteOffsetY: number;
    /** The scale of the sprite to apply when its held */
    spriteScale: number;
    /** The tool ID if not placing a block */
    toolId?: string;
    /** True if the tool works on an empty space */
    targetEmpty: boolean;
    /** True if the tool works on an full space (one with a block in) */
    targetFull: boolean;
    /** Delay on operation */
    delay?: number;
}

export let DEFAULT_INVENTORY: InventItem[];

export function initInventory() {
    DEFAULT_INVENTORY = [];
}