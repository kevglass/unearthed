import { Anim, IDLE_ANIM, WALK_ANIM, WORK_ANIM, findAnimation } from "./Animations";
import { Bone, updateBones, renderLayeredBones } from "./Bones";
import { getTile, refreshSpriteTile, setTile, TILE_SIZE } from "./Map";
import { sendNetworkTile } from "./Network";
import { addParticle, createDirtParticle } from "./Particles";

export interface InventItem {
    sprite: string;
    place: number;
}

export const INVENTORY: InventItem[] = [
    { sprite: "pick.iron", place: 0 },
    { sprite: "tile.dirt", place: 1 },
    { sprite: "tile.brick_grey", place: 3 },
    { sprite: "tile.brick_red", place: 4 },
    { sprite: "tile.sand_tile", place: 6 },
    { sprite: "tile.wood_tile", place: 7 },
];

export interface Controls {
    left: boolean;
    right: boolean;
    up: boolean;
    mouse: boolean;
}

export class Mob {
    bone: Bone;
    allBones: Bone[];
    x: number = 200;
    y: number = 200;
    width: number = 35;
    height: number = 90;
    vy: number = 0;
    flip: boolean = false;
    anim: Anim = IDLE_ANIM;
    working: boolean = false;
    headTilt: number = 0;
    id: string;
    lastUpdate: number = Date.now();
    lastParticleCreated: number = Date.now();
    damage: number = 0;
    overX: number = 0;
    overY: number = 0;
    name: string;
    seq: number = 0;
    sid: string = "";
    lastUpdateSeq: number = 0;
    itemHeld?: InventItem;

    controls: Controls = {
        left: false,
        right: false,
        up: false,
        mouse: false,
    };

    constructor(id: string, name: string, original: Bone, x: number, y: number) {
        this.bone = original.copy();
        this.allBones = this.bone.findAll();
        this.x = x;
        this.y = y;
        this.id = id;
        this.name = name;
    }

    updateFromNetworkState(state: any): void {
        if (state.seq < this.lastUpdateSeq) {
            return;
        }
        this.lastUpdateSeq = state.seq;

        const currentSequence = this.seq;

        this.seq = state.seq;
        this.lastUpdate = Date.now();
        let controlsChanged = (JSON.stringify(this.controls) !== JSON.stringify(state.controls));
        let dx = Math.abs(state.x - this.x);
        let dy = Math.abs(state.y - this.y);
        let dvy = Math.abs(state.vy - this.vy);

        const JITTER_ALLOWANCE = 128;
        if (controlsChanged || dx > JITTER_ALLOWANCE || dy > JITTER_ALLOWANCE) {
            this.controls = state.controls;
            this.flip = state.flip;
            this.x = state.x;
            this.y = state.y;
            this.vy = state.vy;
        }

        this.anim = findAnimation(state.anim)!;
        this.damage = state.damage;
        this.overX = state.overX;
        this.overY = state.overY;
        this.working = state.working;
        this.name = state.name;
        this.itemHeld = state.itemHeld;
    }

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
            damage: this.damage,
            overX: this.overX,
            overY: this.overY,
            name: this.name,
            item: this.itemHeld
        };
    }

    work(): void {
        this.working = true;
    }

    blockedRight(): boolean {
        const stepSize = this.height / 5;
        let count = 0;
        for (let s=0;s<(this.height * 2);s+=stepSize) {
            count++;
            if (getTile((this.x + this.width) / TILE_SIZE, (this.y - this.height + s) / TILE_SIZE) !== 0) {
                return true;
            }
        }

        return false;
    }

    blockedLeft(): boolean {
        const stepSize = this.height / 5;
        let count = 0;
        for (let s=0;s<(this.height * 2);s+=stepSize) {
            count++;
            if (getTile((this.x - this.width) / TILE_SIZE, (this.y - this.height + s) / TILE_SIZE) !== 0) {
                return true;
            }
        }

        return false;
    }

    hittingHead(): boolean {
        if (this.vy > 0) {
            return false;
        }
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        for (let s=offset;s<=width+offset;s+=stepSize) {
            if (getTile((this.x - this.width + s) / TILE_SIZE, (this.y - this.height) / TILE_SIZE) !== 0) {
                return true;
            }
        }

        return false;
    }

    standingOnSomething(): boolean {
        if (this.vy < 0) {
            return false;
        }
        const offset = 10;
        const width = (this.width * 2) - (offset * 2);

        const stepSize = width / 5;
        for (let s=offset;s<=width+offset;s+=stepSize) {
            if (getTile((this.x - this.width + s) / TILE_SIZE, (this.y + this.height) / TILE_SIZE) !== 0) {
                return true;
            }
        }

        return false;
    }

    still(): void {
        this.headTilt = 0;
        this.anim = IDLE_ANIM;
        this.working = false;

        this.controls.left = false;
        this.controls.right = false;
        this.controls.up = false;
        this.controls.mouse = false;
    }

    moveRight(): void {
        this.headTilt = 0.1;
        this.anim = WALK_ANIM;
        this.flip = true;
    }

    jump(): void {
        if (this.vy === 0 && this.standingOnSomething()) {
            this.vy = -20;
        }
    }

    moveLeft(): void {
        this.headTilt = 0.1;
        this.anim = WALK_ANIM;
        this.flip = false;
    }

    // local update
    localUpdate(): void {
        this.lastUpdate = Date.now();
    }

    update(animTime: number): void {
        const hand = this.allBones.find(b => b.name === "held");
        if (hand) {
            hand.sprite = this.itemHeld?.sprite;
        }

        this.seq++;
        const px = Math.floor(this.x / TILE_SIZE);
        const py = Math.floor(this.y / TILE_SIZE);
        const dx = this.overX - px;
        const dy = this.overY - py;

        if (this.controls.right) {
            this.moveRight();
        }
        if (this.controls.left) {
            this.moveLeft();
        }
        if (this.controls.up) {
            this.jump();
        }

        if (this.itemHeld) {
            if (this.controls.mouse && this.itemHeld?.place === 0 && getTile(this.overX, this.overY) !== 0) {
                this.work();
                this.damage++;

                if (this.damage >= 90) {
                    setTile(this.overX, this.overY, 0);
                    sendNetworkTile(this.overX, this.overY, 0);
                    this.damage = 0;
                } else {
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
            if (this.controls.mouse && this.itemHeld.place !== 0 && getTile(this.overX, this.overY) === 0) {
                setTile(this.overX, this.overY, this.itemHeld.place);
                sendNetworkTile(this.overX, this.overY, this.itemHeld.place);
                
                refreshSpriteTile(this.overX, this.overY);
                for (let i=0;i<5;i++) {
                    addParticle(createDirtParticle((this.overX + 0.5) * TILE_SIZE, (this.overY + 0.5) * TILE_SIZE));
                }
            }
        }
        
        if (this.hittingHead() && this.vy < 0) {
            this.vy = 0;
        } 
        
        if (!this.standingOnSomething()) {
            if (this.vy < TILE_SIZE / 2) {
                this.vy += 1;
            }
        } else {
            // correct to closest tile
            this.y = (Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE) - this.height;
            this.vy = 0;
        }

        if (this.anim === WALK_ANIM) {
            // we're trying to walk
            if (this.flip) {
                if (!this.blockedRight()) {
                    this.x += 7;
                } else {
                    this.x = (Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE) - this.width;
                    this.anim = IDLE_ANIM;
                }
            } else {
                if (!this.blockedLeft()) {
                    this.x -= 7;
                } else {
                    this.x = (Math.floor((this.x - this.height) / TILE_SIZE) * TILE_SIZE) + TILE_SIZE - 1 + this.width;
                    this.anim = IDLE_ANIM;
                }
            }
        }

        this.y += this.vy;

        updateBones(animTime, this.bone, this.allBones, this.anim);

        if (this.working) {
            updateBones(animTime, this.bone.findBone("rightarm")!, this.allBones, WORK_ANIM);

            if (this.overX * TILE_SIZE > this.x) {
                this.flip = true;
            }
            if (this.overX * TILE_SIZE < this.x) {
                this.flip = false;
            }
        }

        if (this.vy < 0) {
            this.headTilt = 0.3;
        }
        this.bone.findBone("head")!.ang = this.headTilt;
    }

    draw(g: CanvasRenderingContext2D, showBounds: boolean): void {
        g.save();
        g.translate(this.x, this.y);
        renderLayeredBones(this.bone, g, this.flip);

        if (showBounds) {
            g.fillStyle = "rgba(0,255,0,0.4)";
            g.fillRect(-this.width, -this.height, this.width * 2, this.height * 2);
        }

        g.textAlign = "center";
        g.fillStyle = "black";
        g.font = "40px Helvetica";
        g.fillText(this.name, 0, -120);

        g.restore();
    }
}