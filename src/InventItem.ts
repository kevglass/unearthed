
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
}

export let DEFAULT_INVENTORY: InventItem[];

export function initInventory() {
    DEFAULT_INVENTORY = [
        { sprite: "holding/pick_iron", place: 0, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/dirt", place: 1, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/brick_grey", place: 3, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/brick_red", place: 4, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/sand", place: 6, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/wood", place: 7, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/ladder", place: 8, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/platform", place: 24, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "holding/torch", place: 26, spriteOffsetX: -90, spriteOffsetY: -150, spriteScale: 0.7 },
        { sprite: "tiles/tnt", place: 25, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/portal", place: 27, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
    ];
}