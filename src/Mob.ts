import { Anim, IDLE_ANIM, WALK_ANIM, WORK_ANIM, findAnimation } from "./Animations";
import { Bone } from "./engine/Bones";
import { Graphics } from "./engine/Graphics";
import {GameMap, Layer, MAP_WIDTH, TILE_SIZE, tiles} from "./Map";
import { GameMap, Layer, SKY_HEIGHT, TILE_SIZE, tiles } from "./Map";
import { Network } from "./Network";
import { addParticle, createDirtParticle } from "./engine/Particles";
import { playSfx } from "./engine/Resources";
import { HumanBones } from "./Skeletons";

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
    anim: Anim = IDLE_ANIM;
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
    itemHeld?: InventItem;
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
    inventory: InventItem[] = [
        { sprite: "holding/pick_iron", place: 0, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/dirt", place: 1, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7  },
        { sprite: "tiles/brick_grey", place: 3, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7  },
        { sprite: "tiles/brick_red", place: 4,spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7   },
        { sprite: "tiles/sand", place: 6, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7  },
        { sprite: "tiles/wood", place: 7, spriteOffsetX: -70, spriteOffsetY: -130 , spriteScale: 0.7  },
        { sprite: "tiles/ladder", place: 8, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7   },
        { sprite: "tiles/platform", place: 24, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7  },
        { sprite: "holding/torch", place: 26, spriteOffsetX: -90, spriteOffsetY: -150, spriteScale: 0.7 },
        { sprite: "tiles/tnt", place: 25, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
        { sprite: "tiles/portal", place: 27, spriteOffsetX: -70, spriteOffsetY: -130, spriteScale: 0.7 },
    ];

    /** Current state of this mob's controls - based on local controls or network updates */
    controls: Controls = {
        left: false,
        right: false,
        up: false,
        mouse: false,
        down: false,
    };

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
    constructor(network: Network, gameMap: GameMap, id: string, name: string, original: Bone, x: number, y: number) {
        this.gameMap = gameMap;
        this.network = network;
        this.rootBone = original.copy();
        this.allBones = this.rootBone.findAll();
        this.x = x;
        this.y = y;
        this.id = id;
        this.name = name;
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
        this.anim = findAnimation(state.anim)!;
        this.blockDamage = state.damage;
        this.overX = state.overX;
        this.overY = state.overY;
        this.working = state.working;
        this.name = state.name;
        this.itemHeld = state.itemHeld;
        this.bodyParts = state.bodyParts;
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
            anim: this.anim.name,
            working: this.working,
            damage: this.blockDamage,
            overX: this.overX,
            overY: this.overY,
            name: this.name,
            itemHeld: this.itemHeld,
            bodyParts: this.bodyParts,
        };
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
        for (let s=0;s<(this.height * 2);s+=stepSize) {
            count++;
            if (this.gameMap.isBlocked((this.x + this.width) / TILE_SIZE, (this.y - this.height + s) / TILE_SIZE)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if this mob is blocked from moving left
     * 
     * @returns True if this mob can't move left
     */
    blockedLeft(): boolean {
        const stepSize = this.height / 5;
        let count = 0;
        for (let s=0;s<(this.height * 2);s+=stepSize) {
            count++;
            if (this.gameMap.isBlocked((this.x - this.width) / TILE_SIZE, (this.y - this.height + s) / TILE_SIZE)) {
                return true;
            }
        }

        return false;
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
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        for (let s=offset;s<=width+offset;s+=stepSize) {
            if (this.gameMap.isBlocked((this.x - this.width + s) / TILE_SIZE, (this.y - this.height) / TILE_SIZE)) {
                return true;
            }
        }

        return false;
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
        if (includeLadders && this.gameMap.isLadder(Math.floor(this.x/TILE_SIZE), Math.floor((this.y + this.height)/TILE_SIZE))) {
            return true;
        }
        if (this.fallThroughUntil > 0) {
            return false;
        }
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        for (let s=offset;s<=width+offset;s+=stepSize) {
            if (this.gameMap.isBlocked((this.x - this.width + s) / TILE_SIZE, (this.y + this.height) / TILE_SIZE, true)) {
                const tile = tiles[this.gameMap.getTile((this.x - this.width + s) / TILE_SIZE, (this.y + this.height) / TILE_SIZE, Layer.FOREGROUND)];
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
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Initialize the state to "standing still" at the start of the frame
     */
    still(): void {
        this.headTilt = 0;
        this.anim = IDLE_ANIM;
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
    moveRight(): void {
        this.headTilt = 0.1;
        this.anim = WALK_ANIM;
        this.flip = true;
    }

    /**
     * Indicate that the mob wan't to jump (either local controls or network update)
     */
    jump(): void {
        if (this.gameMap.isLadder(Math.floor(this.x/TILE_SIZE), Math.floor(((this.y + (this.height / 2)/TILE_SIZE))))) {
            this.vy = -10;
        } else if (this.vy === 0 && this.standingOnSomething()) {
            this.vy = -20;
            playSfx("jump", 0.1);
        } 
    }

    fall(): void {
        if (this.standingOnSomething()) {
            if (this.gameMap.isLadder(Math.floor(this.x/TILE_SIZE), Math.floor((this.y + this.height)/TILE_SIZE))) {
                this.vy = 10;
            } else {
                const tile = tiles[this.gameMap.getTile(Math.floor(this.x/TILE_SIZE), Math.floor((this.y + this.height)/TILE_SIZE), Layer.FOREGROUND)];
                if (tile && tile.blocksDown && !tile.blocks) {
                    this.fallThroughUntil = this.y + TILE_SIZE;
                }
            }
        }
    }

    /**
     * Indicate that the mob wan't to move left (either local controls or network update)
     */
    moveLeft(): void {
        this.headTilt = 0.1;
        this.anim = WALK_ANIM;
        this.flip = false;
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
    }

    /**
     * Update this mob by moving its animation forward and applying any controls being pressed
     * 
     * @param animTime The animation time to apply
     * @param placingOnBackgroundLayer True if we're placing items on the background layer
     */
    update(animTime: number, placingOnBackgroundLayer: boolean): void {
        // override the bone images based on this mob's configuration
        for (const bone of this.allBones) {
            if (bone.name === HumanBones.HELD) {
                bone.sprite = this.itemHeld?.sprite;
                bone.spriteOffsetX = this.itemHeld?.spriteOffsetX;
                bone.spriteOffsetY = this.itemHeld?.spriteOffsetY;
                bone.scale = this.itemHeld?.spriteScale ?? 1;
            }
            if (bone.name === HumanBones.HEAD) {
                bone.sprite = "skins/" + this.bodyParts.head + "/head";
            }
            if (bone.name === HumanBones.LEFT_ARM || bone.name === HumanBones.RIGHT_ARM) {
                bone.sprite = "skins/" + this.bodyParts.arms + "/arm";
            }
            if (bone.name === HumanBones.BODY) {
                bone.sprite = "skins/" + this.bodyParts.body + "/body";
            }
            if (bone.name === HumanBones.LEFT_LEG || bone.name === HumanBones.RIGHT_LEG) {
                bone.sprite = "skins/" + this.bodyParts.body + "/leg";
            }
        }


        this.seq++;
        const py = Math.floor(this.y / TILE_SIZE);
        const dy = this.overY - py;

        // apply any controls
        if (this.controls.right) {
            this.moveRight();
        }
        if (this.controls.left) {
            this.moveLeft();
        }
        if (this.controls.up) {
            this.jump();
        }

        // apply use of an item if we're holding one and the mouse button (or equivalent is being pressed)
        if (this.itemHeld) {
            const layer = placingOnBackgroundLayer ? Layer.BACKGROUND : Layer.FOREGROUND;

            if (this.controls.mouse && this.itemHeld?.place === 0 && this.gameMap.getTile(this.overX, this.overY, layer) !== 0) {
                this.work();
                this.blockDamage++;

                if (this.blockDamage >= 60) {
                    if (this.local) {
                        this.network.sendNetworkTile(this.overX, this.overY, 0, layer);
                    }
                    this.blockDamage = 0;
                    playSfx('mining_break', 0.6, 5);
                } else {
                    if (this.blockDamage % 20 === 0) {
                        playSfx('mining', 0.5, 5);
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
            }
            if (this.controls.mouse && this.itemHeld.place !== 0 && this.gameMap.getTile(this.overX, this.overY, layer) === 0) {
                const block = tiles[this.itemHeld.place];
                if (layer !== Layer.BACKGROUND || (block && !block.backgroundDisabled)) {
                    if (this.local) {
                        this.network.sendNetworkTile(this.overX, this.overY, this.itemHeld.place, layer);
                    }
                    
                    this.gameMap.refreshSpriteTile(this.overX, this.overY);
                    playSfx('place', 0.2);
                    for (let i=0;i<5;i++) {
                        addParticle(createDirtParticle((this.overX + 0.5) * TILE_SIZE, (this.overY + 0.5) * TILE_SIZE));
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
            this.fall();
        }

        // this is particularly poor, if we're using the WALK animation then
        // we consider ourself attempting to move - so apply the directional movement
        if (this.anim === WALK_ANIM) {
            // we're trying to walk
            if (this.flip) {
                if (!this.blockedRight()) {
                    this.x += 7;
                    if (this.standingOnSomething() && this.seq % 15 === 0) {
                        playSfx('footstep', 0.1, 5);
                    }
                } else {
                    // if we're blocked then move us out of the collision
                    this.x = (Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE) - this.width;
                    this.anim = IDLE_ANIM;
                }
            } else {
                if (!this.blockedLeft()) {
                    this.x -= 7;
                    if (this.standingOnSomething() && this.seq % 15 === 0) {
                        playSfx('footstep', 0.1, 5);
                    }
                } else {
                    // if we're blocked then move us out of the collision
                    this.x = (Math.floor((this.x - this.height) / TILE_SIZE) * TILE_SIZE) + TILE_SIZE - 1 + this.width;
                    this.anim = IDLE_ANIM;
                }
            }
        }

        // apply vertical velocity (if there is any)
        this.y += this.vy

        if (this.standingOnSomething()) {
            if (this.standingOnSomething(false) || !this.gameMap.isLadder(Math.floor(this.x/TILE_SIZE), Math.floor((this.y + this.height)/TILE_SIZE))) {
                // if we have a grace fall from sliding down from a block
                if (this.fallThroughUntil === 0) {
                    // otherwise move us out of the collision with the floor and stop falling
                    this.y = (Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE) - this.height;
                }
            }
            this.vy = 0;;
        }

        if (this.y > this.fallThroughUntil) {
            this.fallThroughUntil = 0;
        }
        // update the state of the  bones for animation
        for (const bone of this.allBones) {
            bone.update(animTime, this.anim);
        }

        // if we're working (mining) then apply that animation to the right arm
        if (this.working) {
            this.rootBone.findNamedBone(HumanBones.RIGHT_ARM)!.update(animTime, WORK_ANIM);
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
        this.rootBone.findNamedBone(HumanBones.HEAD)!.ang = -this.headTilt;
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
            g.setFillStyle("rgba(0,255,0,0.4)");
            g.fillRect(-this.width, -this.height, this.width * 2, this.height * 2);
        }

        // draw the mob name
        g.setTextAlign("center");
        g.setFillStyle("black");
        g.setFont("40px KenneyFont");
        g.fillText(this.name, 0, -140);

        g.restore();
    }
}