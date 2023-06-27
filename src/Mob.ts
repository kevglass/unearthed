import { Anim, IDLE_ANIM, WALK_ANIM, WORK_ANIM, findAnimation } from "./Animations";
import { Bone } from "./Bones";
import { GameMap, Layer, TILE_SIZE } from "./Map";
import { Network } from "./Network";
import { addParticle, createDirtParticle } from "./Particles";
import { playSfx } from "./Resources";
import { HumanBones } from "./Skeletons";

/**
 * An item that can be placed in the players inventory
 */
export interface InventItem {
    /** The sprite to draw for the item - both as the bone and the UI */
    sprite: string;
    /** The tile to be placed when they use this item - 0 for none, like tools */
    place: number;
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
    /** True if the player is pressing mouse button (or equivalent) */
    mouse: boolean;
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
    width: number = 35;
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
    /** The skin to apply to the head */
    head: string = "male";
    /** The skin to apply to the body */
    body: string = "male";
    /** True if this mob is locally controlled */
    local: boolean = false;
    /** The game map this mob is on */
    gameMap: GameMap;
    /** The network this mob is using */
    network: Network;

    /** The item in the mob's inventory */
    inventory: InventItem[] = [
        { sprite: "pick.iron", place: 0 },
        { sprite: "tile.dirt", place: 1 },
        { sprite: "tile.brick_grey", place: 3 },
        { sprite: "tile.brick_red", place: 4 },
        { sprite: "tile.sand_tile", place: 6 },
        { sprite: "tile.wood_tile", place: 7 },
        { sprite: "tile.ladder_tile", place: 8 },
        { sprite: "tile.platform_tile", place: 24 },
        { sprite: "tile.tnt", place: 25 },
    ];

    /** Current state of this mob's controls - based on local controls or network updates */
    controls: Controls = {
        left: false,
        right: false,
        up: false,
        mouse: false,
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
        this.head = state.head;
        this.body = state.body;
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
            head: this.head,
            body: this.body
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
    standingOnSomething(): boolean {
        if (this.vy < 0) {
            return false;
        }
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        for (let s=offset;s<=width+offset;s+=stepSize) {
            if (this.gameMap.isBlocked((this.x - this.width + s) / TILE_SIZE, (this.y + this.height) / TILE_SIZE, true)) {
                return true;
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
        if (this.gameMap.isLadder(Math.floor(this.x/TILE_SIZE), Math.floor((this.y + this.height)/TILE_SIZE))) {
            this.vy = -10;
        } else if (this.vy === 0 && this.standingOnSomething()) {
            this.vy = -20;
            playSfx("jump", 0.1);
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
            }
            if (bone.name === HumanBones.HEAD) {
                bone.sprite = this.head + ".head";
            }
            if (bone.name === HumanBones.LEFT_ARM || bone.name === HumanBones.RIGHT_ARM) {
                bone.sprite = this.body + ".arm";
            }
            if (bone.name === HumanBones.BODY) {
                bone.sprite = this.body + ".body";
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
        } else {
            // otherwise move us out of the collision with the floor and stop falling
            this.y = (Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE) - this.height;
            this.vy = 0;
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
        this.y += this.vy;

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
        this.rootBone.findNamedBone(HumanBones.HEAD)!.ang = this.headTilt;
    }

    /**
     * Draw a mob to the screen
     * 
     * @param g The graphics context to draw on to
     * @param showBounds True if we should show the bounds of the mobs too
     */
    draw(g: CanvasRenderingContext2D, showBounds: boolean): void {
        g.save();
        g.translate(this.x, this.y);

        // draw the layers of bones
        this.rootBone.renderBoneOnLayers(g, this.flip);

        // draw the mob bounds
        if (showBounds) {
            g.fillStyle = "rgba(0,255,0,0.4)";
            g.fillRect(-this.width, -this.height, this.width * 2, this.height * 2);
        }

        // draw the mob name
        g.textAlign = "center";
        g.fillStyle = "black";
        g.font = "40px Helvetica";
        g.fillText(this.name, 0, -120);

        g.restore();
    }
}