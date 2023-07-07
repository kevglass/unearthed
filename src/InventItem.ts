
/**
 * An item that can be placed in the players inventory
 */
export interface ItemDefinition {
    /** The unique ID of this type of item */
    type: string;
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
    /** True if an item is breakable - i.e. it will show condition */
    breakable?: boolean;
    /** Amount of the item used each use */
    amountUsed?: number;
}

export const ITEM_HANDS: Item =
{
    def: {
        type: "hands",
        sprite: "",
        place: 0,
        spriteOffsetX: 0,
        spriteOffsetY: 0,
        spriteScale: 1,
        toolId: "hands",
        targetEmpty: false,
        targetFull: true,
        delay: 150
    },
    count: 1
};

export let ALL_ITEMS: ItemDefinition[];

export function initInventory() {
    ALL_ITEMS = [];
}

/**
 * An instance of an item
 */
export interface Item {
    /** The definition this item is using */
    def: ItemDefinition;
    /** The number of this item available (can be partial for tools that wear out) */
    count: number;
}

export interface InGameItem extends Item {
    /** The unique ID of the item */
    id: string;
    /** The x coordinate position of the item in game */
    x: number;
    /** The y coordinate of the item in game */
    y: number;
}