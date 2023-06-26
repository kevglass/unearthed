//
// This is a very simplified skeletal animation system. Bones are connected to each 
// other forming a hierarchy. Each bone can have multiple children. Each bone
// can have a single image/sprite attached. Bones rotate in their own coordinate system but
// are effected by the rotation of parents.
//

import { HumanBones } from "./Skeletons";

// A point in time in a skeletal animation. At the time given (range 0->1) the 
// bone should be rotated to the given angle
export interface AnimPoint {
    time: number;
    ang: number;
}

// The animation defines a series of points in time for each bone. The animation
// system tweens between these points to create the smooth transition between 
// animation frames
export interface Anim {
    frames: Record<string, AnimPoint[]>,
    name: string
}

// The idle animation when the player isn't doing anything. This is completely
// static and has all bones in default state apart from the hand thats holding the 
// item - thats raised a little for that classic post.
export const IDLE_ANIM: Anim = {
    frames: {
        [HumanBones.LEFT_LEG]: [{ time: 0, ang: 0 },],
        [HumanBones.RIGHT_LEG]: [{ time: 0, ang: 0 },],
        [HumanBones.LEFT_ARM]: [{ time: 0, ang: 0 },],
        [HumanBones.RIGHT_ARM]: [{ time: 0, ang: 1 },],
    },
    name: "idle"
}

// The walk animation is used when the player is moving horizontally. The animation
// simply moves the arms and legs back and forward between two extremes of rotation
// that looked decent. Note that the left/right arm/leg are moved in the opposite 
// direction to each other to give the sense of walking.
export const WALK_ANIM: Anim = {
    name: "walk",
    frames: {
        [HumanBones.LEFT_LEG]: [{ time: 0, ang: -1 }, { time: 0.5, ang: 1 }],
        [HumanBones.RIGHT_LEG]: [{ time: 0, ang: 1 }, { time: 0.5, ang: -1 }],
        [HumanBones.LEFT_ARM]: [{ time: 0, ang: -1 }, { time: 0.5, ang: 1 }],
        [HumanBones.RIGHT_ARM]: [{ time: 0, ang: 1 }, { time: 0.5, ang: -1 }],
    }
}

// The working animation is only applied to the right and causes the player's arm 
// to move back and forth as though mining. The intention here was to be able to apply
// animations like this over the top of WALK_ANIM etc so we could have "working while walking"
export const WORK_ANIM: Anim = {
    name: "work",
    frames: {
        [HumanBones.RIGHT_ARM]: [{ time: 0, ang: 0 }, { time: 0.5, ang: 2 }],
    }
}

// List of all the animations to make finding easier. 
const ALL_ANIM = [IDLE_ANIM, WALK_ANIM, WORK_ANIM];

/**
 * Find an animation by its SYMBOLIC NAME
 * @param name Find 
 * @returns 
 */
export function findAnimation(name: string) {
    return ALL_ANIM.find(a => a.name === name);
}