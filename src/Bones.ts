import { Anim } from "./Animations";
import { getSprite } from "./Resources";

export class Bone {
    parent?: Bone;
    dx: number = 0;
    dy: number = 0;
    ang: number = 0;
    sprite?: string = "";
    spritex?: number;
    spritey?: number;

    layer: number;
    children: Bone[] = [];

    scale: number = 1;
    name: string;

    constructor(name: string, dx: number, dy: number, ang: number, layer: number, sprite?: string, spritex?: number, spritey?: number, parent?: Bone) {
        this.name = name;
        this.dx = dx;
        this.dy = dy;
        this.spritex = spritex;
        this.spritey = spritey;
        this.ang = ang;
        this.sprite = sprite;
        this.parent = parent;
        this.layer = layer;

        if (parent && !parent.children.includes(this)) {
            parent.children.push(this);
        }
    }

    setScale(s: number): Bone {
        this.scale = s;
        return this;
    }

    copy(parent?: Bone): Bone {
        const result = new Bone(this.name, this.dx, this.dy, this.ang, this.layer, this.sprite, this.spritex, this.spritey, parent);
        result.scale = this.scale;

        for (const child of this.children) {
            // note that creating a bone will add it to its parent
            child.copy(result);
        }
        return result;
    }

    findAll(): Bone[] {
        const result: Bone[] = [this];
        for (const child of this.children) {
            result.push(...child.findAll());
        }

        return result;
    }

    findBone(name: string): Bone | undefined {
        if (name === this.name) {
            return this;
        }

        for (const child of this.children) {
            const target = child.findBone(name);

            if (target) {
                return target;
            }
        }
        return undefined;
    }
}

export function updateBones(animTime: number, bone: Bone, allBones: Bone[], animDefinition: Anim) {
    for (const bone of allBones) {
        const anim = animDefinition.frames[bone.name];
        if (anim) {
            for (const pt of anim) {
                if (animTime > pt.time) {
                    let next = anim.indexOf(pt) + 1;
                    if (next >= anim.length) {
                        next = 0;
                    }

                    let baseTime = pt.time;
                    let nextTime = anim[next].time;
                    if (nextTime === 0) {
                        nextTime = 1;
                    }

                    let baseAng = pt.ang;
                    let nextAng = anim[next].ang;
                    let angDiff = nextAng - baseAng;

                    let td = nextTime - baseTime;
                    let nt = animTime - baseTime;
                    let step = nt / td;
                    let ang = baseAng + (angDiff * step);
                    
                    // lerp between pts in time
                
                    bone.ang =  ang;
                }
            }
        }
    }
}

export function renderBones(bone: Bone, g: CanvasRenderingContext2D, layer: number): void {
    g.save();
    g.translate(bone.dx, bone.dy);
    g.rotate(bone.ang);
    g.scale(bone.scale, bone.scale);

    if (layer === bone.layer && bone.sprite) {
        g.drawImage(getSprite(bone.sprite), bone.spritex!, bone.spritey!);
    }

    for (const child of bone.children) {
        renderBones(child, g, layer);
    }
    g.restore();
}

export function renderLayeredBones(bone: Bone, g: CanvasRenderingContext2D, flip: boolean = false): void {
    if (flip) {
        g.save();
        g.scale(-1, 1);
        for (let layer = 10; layer >= 0; layer--) {
            renderBones(bone, g, layer);
        }
        g.restore();
    } else {
        for (let layer = 0; layer < 10; layer++) {
            renderBones(bone, g, layer);
        }
    }
}