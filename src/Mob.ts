import { Anim, findAnimation } from "./Animations";
import { Bone } from "./engine/Bones";
import { Graphics } from "./engine/Graphics";
import { GameMap, Layer, SKY_HEIGHT, TILE_SIZE } from "./Map";
import { Network } from "./Network";
import { addParticle, createDirtParticle } from "./engine/Particles";
import { playSfx } from "./engine/Resources";
import { BoneNames, getSkin } from "./Skins";
import { BLOCKS } from "./Block";
import { ALL_ITEMS as ALL_ITEMS, ITEM_HANDS, Item, ItemDefinition } from "./InventItem";
import { MobThinkFunction } from "./mods/Mods";

/**
 * The control state for the mob - this is passed across the network
 * to sync up the clients
 */
export interface Controls {
    /** True if the player is pressing left key (or equivalent)*/
    left: boolean;
    /** True if the player is pressing right key (or equivalent) */
    right: boolean;
    /** True if the player is pressing up key (or equivalent)*/
    up: boolean;
    /** True if the player is pressing up down (or equivalent)*/
    down: boolean;
    /** True if the player is pressing mouse button (or equivalent) */
    mouse: boolean;
}

/**
 * The names of the sprites assigned to each body part
 */
export interface BodyParts {
    /** The sprite assigned to the body part */
    body: string;
    /** The sprite assigned to the legs part */
    legs: string;
    /** The sprite assigned to the head part */
    head: string;
    /** The sprite assigned to the arms part */
    arms: string;
}

/**
 * A collection of exposed to mods to describe the state of the mod
 */
export interface MobState {
    /** True if the mod was blocked from moving left last frame */
    blockedLeft: boolean;
    /** True if the mod was blocked from moving right last frame */
    blockedRight: boolean;
    /** True if the mod was blocked from moving below last frame */
    blockedBelow: boolean;
}

/**
 * A mob or mobile in the world. Right now this is only players but could be extended
 * to add the monsters and anything else that moves around.
 */
export class Mob {
    /** The root bone of this mobs' skeleton */
    rootBone: Bone;
    /** All the bones in this mobs' skeleton */
    allBones: Bone[];
    /** The x coordinate of this mob's position in the world */
    x: number = 200;
    /** The y coordinate of this mob's position in the world */
    y: number = 200;
    /** The width of the bounding box for collision around this mob */
    width: number = 40;
    /** The height of the bounding box for collision around this mob */
    height: number = 90;
    /** The y component of velocity of this mob - used for falling and jumping */
    vy: number = 0;
    /** True if this mob is flipped horizontally - flip = true is left */
    flip: boolean = false;
    /** The animation this mob is applying */
    anim?: Anim;
    /** True if we're moving this frame */
    moving: boolean = false;
    /** True if this mob is working (mining) */
    working: boolean = false;
    /** The head tile to apply to the head bone - this is used to have the mob look at what they're doing */
    headTilt: number = 0;
    /** The unique ID given to this mob */
    id: string;
    /** The last time this mob was updated (either locally or from the network) */
    lastUpdate: number = Date.now();
    /** The last time this mob created a particle - just throttling  */
    lastParticleCreated: number = Date.now();
    /** The amount of damage this mob has done to a tile - this is the timer for destroying blocks */
    blockDamage: number = 0;
    /** The x coordinate of the cell this mob's cursor is over */
    overX: number = 0;
    /** The y coordinate of the cell this mob's cursor is over */
    overY: number = 0;
    /** The name shown above the mob's head */
    name: string;
    /** Network message sequence number to send*/
    seq: number = 0;
    /** The network participant ID */
    participantId: string = "";
    /** The sequence of the last update we applied - prevents us applying out of date updates */
    lastUpdateSeq: number = 0;
    /** The item thats currently being held */
    itemHeld: Item | null = null;
    /** Parts */
    bodyParts: BodyParts = {
        body: "a",
        head: "a",
        arms: "a",
        legs: "a",
    };

    /** True if this mob is locally controlled */
    local: boolean = false;
    /** The game map this mob is on */
    gameMap: GameMap;
    /** The network this mob is using */
    network: Network;
    /** We'll ignore blockages until this is zero or we pass this on the Y value */
    fallThroughUntil: number = 0;

    /** The item in the mob's inventory */
    inventory: Item[] = ALL_ITEMS.map(d => {
        return {
            def: d,
            count: 1
        }
    });
    /** The quick slot items selected */
    quickSlots: (Item | null)[] = [null, null, null, null, null, null, null, null];

    /** The type of the mob */
    type: string = "human";

    /** The x coordinate of the last location we worked out - to prevent repeats */
    lastToolActionX: number = -1;
    /** The y coordinate of the last location we worked out - to prevent repeats */
    lastToolActionY: number = -1;
    /** The layer of the last location we worked out - to prevent repeats */
    lastToolActionLayer: number = -1;

    /** Current state of this mob's controls - based on local controls or network updates */
    controls: Controls = {
        left: false,
        right: false,
        up: false,
        mouse: false,
        down: false,
    };
    /** A collection of state exposed to mods */
    state: MobState = {
        blockedLeft: false,
        blockedRight: false,
        blockedBelow: false
    };
    /** The function to be called to let this mob think each frame */
    thinkFunction?: MobThinkFunction;
    /** Generic user data that can be used by mods */
    data: Record<string, any> = {};
    /** True if this is player controlled */
    private isControlledByPlayer: boolean = false;

    /**
     * Create a new mob
     * 
     * @param network The network maintaining this mob
     * @param gameMap The game map this mob exists on
     * @param id The ID to assign to the new mob
     * @param name The name given for the mob
     * @param original The original skeleton to copy for this mob
     * @param x The x coordinate of the mob's initial position
     * @param y The y coordinate of the mob's initial position
     */
    constructor(network: Network, gameMap: GameMap, id: string, name: string, playerControlled: boolean, type: string, x: number, y: number, local: boolean = false) {
        this.gameMap = gameMap;
        this.network = network;
        const skin = getSkin(type);
        this.width = skin.width;
        this.height = skin.height;
        this.rootBone = skin.skeleton.copy();
        this.allBones = this.rootBone.findAll();
        this.x = x;
        this.y = y;
        this.id = id;
        this.name = name;
        this.type = type;
        this.local = local;

        this.initInventory();

        this.isControlledByPlayer = playerControlled;
    }

    /**
     * Reinitialize the inventory of this mob to the default one
     */
    initInventory(): void {
        if (this.gameMap.game.serverSettings.isCreativeMode()) {
            this.inventory = ALL_ITEMS.map(d => {
                return {
                    def: d,
                    count: 1
                }
            });

            // load the quickslots
            this.loadQuickSlots();
    
            if (this.quickSlots[0] === null) {
                this.quickSlots[0] = this.inventory.find(i => i.def.toolId === "iron-pick") ?? null;
            }
        } else {
            // load the quickslots
            this.loadItems();
        }

    }

    /**
     * Load the quick slot setup from local storage
     */
    loadQuickSlots(): void {
        const toLoad = localStorage.getItem("quickslots");
        if (toLoad) {
            const quickSlotsData = JSON.parse(toLoad);
            for (let i=0;i<8;i++) {
                const slot = quickSlotsData[i];

                this.quickSlots[i] = this.inventory.find(item => item.def.type === slot.id) ?? null;
            }
        }
    }

    isPlayer(): boolean {
        return this.isPlayerControlled();
    }

    isPlayerControlled(): boolean {
        return this.isControlledByPlayer;
    }

    /**
     * Save the current state of the quick slots to local storage
     */
    saveQuickSlots(): void {
        const toSave = this.quickSlots.map(m => {
            return {
                id: m?.def.type
            }
        });
        localStorage.setItem("quickslots", JSON.stringify(toSave));
    }

    /**
     * Update this mob from the network state given. We'll attempt to move
     * the mob to the right location and apply any state changes (controls etc). If we're 
     * pretty close to position we'll allow it to stay as is until the controls change.
     * 
     * @param state The new state of this mob
     */
    updateFromNetworkState(state: any): void {
        // the state update is out of date skip ite
        if (state.seq < this.lastUpdateSeq) {
            return;
        }
        this.lastUpdateSeq = state.seq;

        // process the state into usable values
        this.seq = state.seq;
        this.lastUpdate = Date.now();
        let controlsChanged = (JSON.stringify(this.controls) !== JSON.stringify(state.controls));
        let dx = Math.abs(state.x - this.x);
        let dy = Math.abs(state.y - this.y);

        // if the mob has either changed controls or is out of sync
        // with us by a full tile, then apply positional update
        const JITTER_ALLOWANCE = 128;
        if (controlsChanged || dx > JITTER_ALLOWANCE || dy > JITTER_ALLOWANCE) {
            this.controls = state.controls;
            this.flip = state.flip;
            this.x = state.x;
            this.y = state.y;
            this.vy = state.vy;
        }

        // update the rest of the state based on what we've been told
        this.anim = findAnimation(this.type, state.anim)!;
        this.blockDamage = state.damage;
        this.overX = state.overX;
        this.overY = state.overY;
        this.working = state.working;
        this.name = state.name;
        this.itemHeld = state.itemHeld;
        this.bodyParts = state.bodyParts;
        this.type = state.type;
        this.moving = state.moving;
    }

    /**
     * Get a state representation of this Mob that can be sent to other
     * clients 
     * 
     * @returns The blob of state that should be sent to other players
     */
    getNetworkState(): any {
        return {
            seq: this.seq,
            id: this.id,
            x: this.x,
            y: this.y,
            vy: this.vy,
            flip: this.flip,
            controls: this.controls,
            anim: this.anim?.name ?? "",
            working: this.working,
            damage: this.blockDamage,
            overX: this.overX,
            overY: this.overY,
            name: this.name,
            itemHeld: this.itemHeld,
            bodyParts: this.bodyParts,
            moving: this.moving,
            type: this.type,
            isPlayer: this.isPlayerControlled()
        };
    }

    /**
     * Set the control state
     * 
     * @param left True if the left button is being pressed
     * @param right True if the right button is being pressed
     * @param up True if the up button is being pressed
     * @param down True if the down button is being pressed
     */
    setControls(left: boolean, right: boolean, up: boolean, down: boolean) {
        this.controls.left = left;
        this.controls.right = right;
        this.controls.up = up;
        this.controls.down = down;
    }

    /**
     * Indicate the mob is working (mining)
     */
    work(): void {
        this.working = true;
    }

    /**
     * Check if this mob is blocked from moving right
     * 
     * @returns True if this mob can't move right
     */
    blockedRight(): boolean {
        const stepSize = this.height / 5;
        let count = 0;
        let blocked = false;

        const tiles = [];
        let lastx = -1;
        let lasty = -1;
        for (let s = 0; s < (this.height * 2); s += stepSize) {
            count++;
            const x = Math.floor((this.x + this.width) / TILE_SIZE);
            const y = Math.floor((this.y - this.height + s) / TILE_SIZE);

            if (lastx !== x || lasty !== y) {
                lastx = x;
                lasty = y;
                if (this.gameMap.isBlocked(x, y)) {
                    blocked = true;
                    tiles.push([x, y]);
                }
            }
        }

        // notify mods of the blockage but only once per tile
        for (const t of tiles) {
            this.gameMap.game.mods.blocked(this, t[0], t[1]);
        }

        return blocked;
    }

    /**
     * Check if this mob is blocked from moving left
     * 
     * @returns True if this mob can't move left
     */
    blockedLeft(): boolean {
        const stepSize = this.height / 5;
        let count = 0;
        let blocked = false;

        const tiles = [];
        let lastx = -1;
        let lasty = -1;

        for (let s = 0; s < (this.height * 2); s += stepSize) {
            count++;
            const x = Math.floor((this.x - this.width) / TILE_SIZE);
            const y = Math.floor((this.y - this.height + s) / TILE_SIZE);
            if (lastx !== x || lasty !== y) {
                lastx = x;
                lasty = y;
                if (this.gameMap.isBlocked(x, y)) {
                    blocked = true;
                    tiles.push([x, y])
                }
            }
        }

        // notify mods of the blockage but only once per tile
        for (const t of tiles) {
            this.gameMap.game.mods.blocked(this, t[0], t[1]);
        }

        return blocked;
    }

    /**
     * Check if this mob is blocked from moving up
     * 
     * @returns True if this mob can't move up
     */
    hittingHead(): boolean {
        if (this.vy > 0) {
            return false;
        }

        let blocked = false;
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        const tiles = [];
        let lastx = -1;
        let lasty = -1;

        for (let s = offset; s <= width + offset; s += stepSize) {
            const x = Math.floor((this.x - this.width + s) / TILE_SIZE);
            const y = Math.floor((this.y - this.height) / TILE_SIZE);
            if (lastx !== x || lasty !== y) {
                lastx = x;
                lasty = y;
                if (this.gameMap.isBlocked(x, y)) {
                    blocked = true;
                    tiles.push([x, y]);
                }
            }
        }

        // notify mods of the blockage but only once per tile
        for (const t of tiles) {
            this.gameMap.game.mods.hitHead(this, t[0], t[1]);
        }

        return blocked;
    }

    /**
     * Check if this mob is blocked from moving down
     * 
     * @returns True if this mob can't move down
     */
    standingOnSomething(includeLadders: boolean = true): boolean {
        if (this.vy < 0) {
            return false;
        }
        if (includeLadders && this.gameMap.isLadder(Math.floor(this.x / TILE_SIZE), Math.floor((this.y + this.height) / TILE_SIZE))) {
            return true;
        }
        if (this.fallThroughUntil > 0) {
            return false;
        }
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        let blocked = false;
        const tiles = [];
        let lastx = -1;
        let lasty = -1;

        for (let s = offset; s <= width + offset; s += stepSize) {
            const x = Math.floor((this.x - this.width + s) / TILE_SIZE);
            const y = Math.floor((this.y + this.height) / TILE_SIZE);
            if (lastx !== x || lasty !== y) {
                lastx = x;
                lasty = y;
                if (this.gameMap.isBlocked(x, y, true)) {
                    const tile = BLOCKS[this.gameMap.getTile(x, y, Layer.FOREGROUND)];
                    // platforms are only standable for the first quarter of the tile
                    let platformFall = false;
                    if (tile && !tile.blocks && tile.blocksDown) {
                        const ty = (this.y + this.height);
                        const dy = ty - (Math.floor(ty / TILE_SIZE) * TILE_SIZE)

                        if (dy > TILE_SIZE / 4) {
                            platformFall = true;
                        }
                    }
                    if (!platformFall) {
                        blocked = true;
                        tiles.push([x, y]);
                    }
                }
            }
        }

        // notify mods of the blockage but only once per tile
        for (const t of tiles) {
            this.gameMap.game.mods.standing(this, t[0], t[1]);
        }


        return blocked;
    }

    /**
     * Initialize the state to "standing still" at the start of the frame
     */
    still(): void {
        this.headTilt = 0;
        this.anim = findAnimation(this.type, "idle")!;
        this.moving = false;
        this.working = false;

        this.controls.left = false;
        this.controls.right = false;
        this.controls.up = false;
        this.controls.down = false;
        this.controls.mouse = false;
    }

    /**
     * Indicate that the mob wan't to move right (either local controls or network update)
     */
    private moveRight(): void {
        this.headTilt = 0.1;
        this.anim = findAnimation(this.type, "walk")!;
        this.moving = true;
        this.flip = true;
    }

    /**
     * Indicate that the mob wan't to jump (either local controls or network update)
     */
    private moveUp(): void {
        if (this.gameMap.isLadder(Math.floor(this.x / TILE_SIZE), Math.floor(((this.y + (this.height / 2) / TILE_SIZE))))) {
            this.vy = -10;
        } else if (this.vy === 0 && this.standingOnSomething()) {
            this.vy = -20;
            if (this.isPlayerControlled()) {
                playSfx("jump", 0.1);
            }
        }
    }

    private moveDown(): void {
        if (this.standingOnSomething()) {
            if (this.gameMap.isLadder(Math.floor(this.x / TILE_SIZE), Math.floor((this.y + this.height) / TILE_SIZE))) {
                this.vy = 10;
            } else {
                const tile = BLOCKS[this.gameMap.getTile(Math.floor(this.x / TILE_SIZE), Math.floor((this.y + this.height) / TILE_SIZE), Layer.FOREGROUND)];
                if (tile && tile.blocksDown && !tile.blocks) {
                    this.fallThroughUntil = this.y + TILE_SIZE;
                }
            }
        }
    }

    /**
     * Indicate that the mob wan't to move left (either local controls or network update)
     */
    private moveLeft(): void {
        this.headTilt = 0.1;
        this.anim = findAnimation(this.type, "walk")!;
        this.moving = true;
        this.flip = false;
    }

    loadItems(): void {
        if (!this.gameMap.game.serverSettings.isCreativeMode()) {
            this.inventory = [];
            const inventString = localStorage.getItem("inventory");
            if (inventString) {
                const toLoad = JSON.parse(inventString);
                for (const record of toLoad) {
                    const def = ALL_ITEMS.find(m => m.type === record.id);
                    if (def) {
                        this.inventory.push({
                            def: def,
                            count: record.count
                        });
                    }
                }
            }
        }

        this.loadQuickSlots();
    }

    saveItems(): void {
        if (!this.gameMap.game.serverSettings.isCreativeMode()) {
            // save the contents of the inventory out
            const toSave = this.inventory.map(m => {
                return {
                    id: m.def.type,
                    count: m.count
                }
            });
            localStorage.setItem("inventory", JSON.stringify(toSave));
        }

        this.saveQuickSlots();
    }

    /**
     * Remove an item from this mobs inventory including clearing out items
     * when count goes to zero
     * 
     * @param itemType The type of the item to remove
     * @param count The number of hte item to remove
     */
    removeItem(itemType: string, count: number): void {
        if (this.gameMap.game.serverSettings.isCreativeMode()) {
            return;
        }

        const existing = this.inventory.find(item => item.def.type === itemType);
        if (existing) {
            existing.count -= count;
            if (existing.count <= 0) {
                this.inventory.splice(this.inventory.indexOf(existing), 1);
                for (let i=0;i<this.quickSlots.length;i++) {
                    if (this.quickSlots[i] === existing) {
                        this.quickSlots[i] = null;
                    }
                }

                this.saveItems();
            }
        } else {
            console.log("Couldn't find item to remove");
        }
    }

    /**
     * Count the number of an item a mob has
     * 
     * @param itemType The type of the item to count
     * @return The number of the item the mob has in their inventory
     */
    getItemCount(itemType: string): number {
        const existing = this.inventory.find(item => item.def.type === itemType);
        
        return existing?.count ?? 0;
    }
    /**
     * Add an item to this mob's inventory. Combine it with matching
     * ones if present
     * 
     * @param itemType The type of the item to add
     * @param count The number of the item to add
     */
    addItem(itemType: string, count: number): void {
        if (this.gameMap.game.serverSettings.isCreativeMode()) {
            return;
        }

        const existing = this.inventory.find(item => item.def.type === itemType);
        if (existing) {
            existing.count += count;
            this.saveItems();
        } else {
            const def = ALL_ITEMS.find(m => m.type === itemType);
            if (def) {
                this.inventory.push({ def, count });
            } else {
                console.error("Attempt to add item with unknown item ID");
            }
            this.saveItems();
        }
    }

    /**
     * Mark that the mob is being updated by local controls
     */
    localUpdate(): void {
        this.lastUpdate = Date.now();
        this.local = true;
    }

    /**
     * Reset this mob to starting poisition
     */
    reset(): void {
        this.vy = 0;
        this.x = 200;
        this.y = (SKY_HEIGHT - 6) * TILE_SIZE;
        this.lastUpdate = Date.now();
    }

    /**
     * Update this mob by moving its animation forward and applying any controls being pressed
     * 
     * @param animTime The animation time to apply
     * @param placingOnBackgroundLayer True if we're placing items on the background layer
     */
    update(animTime: number, placingOnBackgroundLayer: boolean): void {
        // override the bone images based on this mob's configuration
        if (this.type === "human") {
            for (const bone of this.allBones) {
                if (bone.name === BoneNames.HELD) {
                    bone.sprite = this.itemHeld?.def.sprite;
                    bone.spriteOffsetX = this.itemHeld?.def.spriteOffsetX;
                    bone.spriteOffsetY = this.itemHeld?.def.spriteOffsetY;
                    bone.scale = this.itemHeld?.def.spriteScale ?? 1;
                }
                if (bone.name === BoneNames.HEAD) {
                    bone.sprite = "skins/" + this.bodyParts.head + "/head";
                }
                if (bone.name === BoneNames.LEFT_ARM || bone.name === BoneNames.RIGHT_ARM) {
                    bone.sprite = "skins/" + this.bodyParts.arms + "/arm";
                }
                if (bone.name === BoneNames.BODY) {
                    bone.sprite = "skins/" + this.bodyParts.body + "/body";
                }
                if (bone.name === BoneNames.LEFT_LEG || bone.name === BoneNames.RIGHT_LEG) {
                    bone.sprite = "skins/" + this.bodyParts.body + "/leg";
                }
            }
        }


        this.seq++;
        const py = Math.floor(this.y / TILE_SIZE);
        const dy = this.overY - py;

        // reset the state for this frame
        this.state.blockedBelow = false;
        this.state.blockedLeft = false;
        this.state.blockedRight = false;

        // apply any controls
        if (this.controls.right) {
            this.moveRight();
        }
        if (this.controls.left) {
            this.moveLeft();
        }
        if (this.controls.up) {
            this.moveUp();
        }

        // if we've released the mouse then we can work on the same location again
        if (!this.controls.mouse) {
            this.lastToolActionX = -1;
        }

        // apply use of an item if we're holding one and the mouse button (or equivalent is being pressed)
        const usingItem = this.itemHeld ?? ITEM_HANDS;
        if (usingItem) {
            const layer = placingOnBackgroundLayer ? Layer.BACKGROUND : Layer.FOREGROUND;

            let changedLocation = (this.lastToolActionX !== this.overX || this.lastToolActionY !== this.overY || this.lastToolActionLayer !== layer);
            let targetEmpty = (usingItem?.def.place !== 0 || usingItem?.def.targetEmpty) && changedLocation;
            let targetFull =  usingItem?.def.targetFull && changedLocation;

            if (this.controls.mouse && targetFull && this.gameMap.getTile(this.overX, this.overY, layer) !== usingItem.def.place) {
                this.work();
                this.blockDamage++;

                const delay = usingItem.def.delay ?? 60;
                if (this.blockDamage >= delay) {
                    if (this.local) {
                        // if we're not in creative mode then we need to apply 
                        // anything related to items
                        if (!this.gameMap.game.serverSettings.isCreativeMode()) {
                            this.removeItem(usingItem.def.type, usingItem.def.amountUsed ?? 0);
                        }

                        this.network.sendNetworkTile(this, this.overX, this.overY, usingItem.def.place, layer, usingItem.def.toolId);
                    }
                    this.lastToolActionX = this.overX;
                    this.lastToolActionY = this.overY;
                    this.lastToolActionLayer = layer;
                    this.blockDamage = 0;
                    this.gameMap.game.gamepad.vibrate();
                } else {
                    if (this.blockDamage % 20 === 0) {
                        this.gameMap.game.mods.toolProgress(this, this.overX, this.overY, layer, usingItem.def.toolId ?? "");
                    }
                    if (Date.now() - this.lastParticleCreated > 100) {
                        this.lastParticleCreated = Date.now();
                        addParticle(createDirtParticle((this.overX + 0.5) * TILE_SIZE, (this.overY + 0.5) * TILE_SIZE));
                    }
                }

                if (dy < 0) {
                    this.headTilt = 0.2;
                }
                if (dy > 0) {
                    this.headTilt = -0.2;
                }
            } else if (this.controls.mouse && targetEmpty && this.gameMap.getTile(this.overX, this.overY, layer) === 0) {
                if (usingItem.def.place !== 0) {
                    const block = BLOCKS[usingItem.def.place];
                    if (layer !== Layer.BACKGROUND || (block && !block.backgroundDisabled)) {
                        if (this.local) {
                            // if we're not in creative mode then we need to apply 
                            // anything related to items
                            if (!this.gameMap.game.serverSettings.isCreativeMode()) {
                                this.removeItem(usingItem.def.type, usingItem.def.amountUsed ?? 0);
                            }

                            this.network.sendNetworkTile(this, this.overX, this.overY, usingItem.def.place, layer);
                            if (this.gameMap.getTile(this.overX, this.overY, layer) === usingItem.def.place) {
                                playSfx('place', 0.2);
                            }
                        }

                        for (let i = 0; i < 5; i++) {
                            addParticle(createDirtParticle((this.overX + 0.5) * TILE_SIZE, (this.overY + 0.5) * TILE_SIZE));
                        }
                    }
                } else {
                    if (this.local) {
                        this.network.sendNetworkTile(this, this.overX, this.overY, usingItem.def.place, layer, usingItem.def.toolId);
                        this.lastToolActionX = this.overX;
                        this.lastToolActionY = this.overY;
                        this.lastToolActionLayer = layer;
                    }
                }
            }
        }

        // if we're hitting our head on a block and moving updates
        // then stop and move us out of the collision
        if (this.hittingHead() && this.vy < 0) {
            this.vy = 0;
            this.y = (Math.floor((this.y) / TILE_SIZE) * TILE_SIZE) + this.height;
        }

        // if we're not standing on something then fall
        if (!this.standingOnSomething()) {
            if (this.vy < TILE_SIZE / 2) {
                this.vy += 1;
            }
        }

        if (this.controls.down) {
            this.moveDown();
        }

        // this is particularly poor, if we're using the WALK animation then
        // we consider ourself attempting to move - so apply the directional movement
        if (this.moving) {
            // we're trying to walk
            if (this.flip) {
                if (!this.blockedRight()) {
                    this.x += 7;
                    if (this.standingOnSomething() && this.seq % 15 === 0) {
                        if (this.isPlayerControlled()) {
                            playSfx('footstep', 0.1, 5);
                        }
                    }
                } else {
                    // if we're blocked then move us out of the collision
                    this.x = (Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE) - this.width;
                    this.anim = findAnimation(this.type, "idle");
                    this.state.blockedRight = true;
                }
            } else {
                if (!this.blockedLeft()) {
                    this.x -= 7;
                    if (this.standingOnSomething() && this.seq % 15 === 0) {
                        if (this.isPlayerControlled()) {
                            playSfx('footstep', 0.1, 5);
                        }
                    }
                } else {
                    // if we're blocked then move us out of the collision
                    this.x = (Math.floor((this.x - this.width) / TILE_SIZE) * TILE_SIZE) + TILE_SIZE + this.width - 1;
                    this.anim = findAnimation(this.type, "idle");
                    this.state.blockedLeft = true;
                }
            }
        }

        // apply vertical velocity (if there is any)
        this.y += this.vy

        if (this.standingOnSomething()) {
            if (this.standingOnSomething(false) || !this.gameMap.isLadder(Math.floor(this.x / TILE_SIZE), Math.floor((this.y + this.height) / TILE_SIZE))) {
                // if we have a grace fall from sliding down from a block
                if (this.fallThroughUntil === 0) {
                    // otherwise move us out of the collision with the floor and stop falling
                    this.y = (Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE) - this.height;
                    this.state.blockedBelow = true;
                }
            }

            // check to see if vy has been modified by a mod after a standing event
            if (this.vy > 0) {
                this.vy = 0;
            }
        }

        if (this.y > this.fallThroughUntil) {
            this.fallThroughUntil = 0;
        }

        if (this.thinkFunction) {
            this.thinkFunction(this.gameMap.game.mods.context, this);
        }

        // update the state of the  bones for animation
        if (this.anim) {
            for (const bone of this.allBones) {
                bone.update(animTime, this.anim);
            }
        }

        // if we're working (mining) then apply that animation to the right arm
        if (this.working) {
            const workAnim = findAnimation(this.type, "work");
            if (workAnim) {
                this.rootBone.findNamedBone(BoneNames.RIGHT_ARM)!.update(animTime, workAnim);
            }
            if (this.overX * TILE_SIZE > this.x) {
                this.flip = true;
            }
            if (this.overX * TILE_SIZE < this.x) {
                this.flip = false;
            }
        }

        // if we're jumping then tilt the head up
        if (this.vy < 0) {
            this.headTilt = 0.3;
        }

        // apply whatever head tilt we have now
        const head = this.rootBone.findNamedBone(BoneNames.HEAD);
        if (head) {
            head.ang = -this.headTilt;
        }

        // if we're the host then we need to consider whether we pick up
        // items
        if (this.gameMap.game.isHostingTheServer) {
            // only players pick up items
            if (this.isPlayerControlled()) {
                for (let item of this.gameMap.items) {
                    const dx = Math.abs(this.x - item.x);
                    const dy = Math.abs(this.y - item.y);

                    // only collect one item per frame
                    if ((dx < TILE_SIZE / 3) && (dy < TILE_SIZE / 2)) {
                        this.network.sendItemCollection(item.id, this.id);

                        if (this.local) {
                            playSfx("pickup", 0.35);
                        }
                        break;
                    }
                }
            }
        }
    }

    /**
     * Draw a mob to the screen
     * 
     * @param g The graphics context to draw on to
     * @param showBounds True if we should show the bounds of the mobs too
     */
    draw(g: Graphics, showBounds: boolean): void {
        g.save();
        g.translate(this.x, this.y);

        // draw the layers of bones
        this.rootBone.renderBoneOnLayers(g, this.flip);

        // draw the mob bounds
        if (showBounds) {
            g.setFillColor(0, 255, 0, 0.4);
            g.fillRect(-this.width, -this.height, this.width * 2, this.height * 2);
        }

        // draw the mob name
        g.setTextAlign("center");
        g.setFillColor(0, 0, 0, 1);
        g.setFont("40px KenneyFont");
        g.fillText(this.name, 0, -140);

        g.restore();
    }
}