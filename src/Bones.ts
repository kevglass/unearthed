import { Anim } from "./Animations";
import { Graphics } from "./Graphics";
import { getSprite } from "./Resources";

/**
 * A simple bone implementation. Bones have attached sprites for visuals, children to create hierarchies and angles to
 * support animation. 
 */
export class Bone {
    /** The parnet bone this is connected to - undefined if this is a root bone of a skeleton */
    parent?: Bone;
    /** The center point that the bone will be rotated around */
    centerX: number = 0;
    /** The center point that the bone will be rotated around */
    centerY: number = 0;
    /** The current angle of rotation of this bone */
    ang: number = 0;
    /** The name of the sprite that is attached to this bone  */
    sprite?: string = "";
    /** The offset of the sprite relative to this bone (used when drawing) */
    spriteOffsetX?: number;
    /** The offset of the sprite relative to this bone (used when drawing) */
    spriteOffsetY?: number;

    /** The z layer this bone should be rendered on - this lets us do nice 2d stacking */
    layer: number;
    /** The bones that are attached to this bone and will be effected by its rotation  */
    children: Bone[] = [];

    /** The amount to scale the image attached to this bone */
    scale: number = 1;
    /** A symbolic name given to this bone */
    name: string;

    /**
     * Create a new bone
     * 
     * @param name A symbolic name for the bone
     * @param centerX The center of rotation 
     * @param centerY The center of rotation
     * @param ang The initial angle this bone is rotated by (generally 0)
     * @param layer The z layer on which to draw bone
     * @param sprite The name of the sprite to attach to this bone
     * @param spriteOffsetX The offset of the sprite relative to this bone
     * @param spriteOffsetY The offset of the sprite relative to this bone
     * @param parent The bone this bone should be attached to (or undefined if this the root bone)
     */
    constructor(name: string, centerX: number, centerY: number, ang: number, layer: number, sprite?: string, spriteOffsetX?: number, spriteOffsetY?: number, parent?: Bone) {
        this.name = name;
        this.centerX = centerX;
        this.centerY = centerY;
        this.spriteOffsetX = spriteOffsetX;
        this.spriteOffsetY = spriteOffsetY;
        this.ang = ang;
        this.sprite = sprite;
        this.parent = parent;
        this.layer = layer;

        if (parent && !parent.children.includes(this)) {
            parent.children.push(this);
        }
    }

    /**
     * Set the scale to apply to the image attached to this bone
     * 
     * @param s The scale to apply
     * @returns This bone for chaining
     */
    setScale(s: number): Bone {
        this.scale = s;
        return this;
    }

    /**
     * Make a copy of this bone
     * 
     * @param parent The parent bone to attach the copy to (or undefined if its the root bone)
     * @returns The new created copy of this bone
     */
    copy(parent?: Bone): Bone {
        const result = new Bone(this.name, this.centerX, this.centerY, this.ang, this.layer, this.sprite, this.spriteOffsetX, this.spriteOffsetY, parent);
        result.scale = this.scale;

        for (const child of this.children) {
            // note that creating a bone will add it to its parent
            child.copy(result);
        }
        return result;
    }

    /**
     * Find all the bones in the hierarchy - useful for searches etc
     * 
     * @returns THe list of bones including this bone and all its children
     */
    findAll(): Bone[] {
        const result: Bone[] = [this];
        for (const child of this.children) {
            result.push(...child.findAll());
        }

        return result;
    }

    /**
     * Find a bone in this bone's hierarchy that has the name given
     * 
     * @param name The name to search for
     * @returns The bone with the given name from this hierarchy (or undefined if no bone was found)
     */
    findNamedBone(name: string): Bone | undefined {
        if (name === this.name) {
            return this;
        }

        for (const child of this.children) {
            const target = child.findNamedBone(name);

            if (target) {
                return target;
            }
        }
        return undefined;
    }

    /**
     * Update the state of this bone and its children based on a particular 
     * time and animation
     * 
     * @param animTime The time through animation we're updating to
     * @param animDefinition The animation we're applying
     */
    update(animTime: number, animDefinition: Anim) {
        const anim = animDefinition.frames[this.name];
        if (anim) {
            for (const pt of anim) {
                if (animTime > pt.time) {
                    // ugly ass tweening between the two 
                    // points in the animation
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

                    this.ang = baseAng + (angDiff * step);
                }
            }
        }
    }

    /**
     * Render this bone and its children
     * 
     * @param g The graphics context on which to render
     * @param layer The layer we're rendering
     */
    render(g: Graphics, layer: number): void {
        // render this bone and its children, only actually
        // drawing sprites if we're on the right layer
        g.save();
        g.translate(this.centerX, this.centerY);
        g.rotate(this.ang);
        g.scale(this.scale, this.scale);

        if (layer === this.layer && this.sprite) {
            const sprite = getSprite(this.sprite);
            if (sprite) {
                g.drawImage(sprite, this.spriteOffsetX!, this.spriteOffsetY!);
            }
        }

        for (const child of this.children) {
            child.render( g, layer);
        }
        g.restore();
    }
    
    /**
     * Render this bone and its children in layer order
     * 
     * @param g The graphics context on which to render
     * @param flip True if we're flipping direction (left/right) - this means
     * render the layers in the opposite order
     */
    renderBoneOnLayers(g: Graphics, flip: boolean = false): void {
        if (!flip) {
            g.save();
            g.scale(-1, 1);
            for (let layer = 0; layer < 10; layer++) {
                this.render(g, layer);
            }
            g.restore();
        } else {
            for (let layer = 0; layer < 10; layer++) {
                this.render(g, layer);
            }
        }
    }
}