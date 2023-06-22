export interface AnimPoint {
    time: number;
    ang: number;
}

export interface Anim {
    frames: Record<string, AnimPoint[]>,
    name: string
}

export const IDLE_ANIM: Anim = {
    frames: {
        "leftleg": [{ time: 0, ang: 0 },],
        "rightleg": [{ time: 0, ang: 0 },],
        "leftarm": [{ time: 0, ang: 0 },],
        "rightarm": [{ time: 0, ang: 1 },],
    },
    name: "idle"
}

export const WALK_ANIM: Anim = {
    name: "walk",
    frames: {
        "leftleg": [{ time: 0, ang: -1 }, { time: 0.5, ang: 1 }],
        "rightleg": [{ time: 0, ang: 1 }, { time: 0.5, ang: -1 }],
        "leftarm": [{ time: 0, ang: -1 }, { time: 0.5, ang: 1 }],
        "rightarm": [{ time: 0, ang: 1 }, { time: 0.5, ang: -1 }],
    }
}

export const WORK_ANIM: Anim = {
    name: "work",
    frames: {
        "rightarm": [{ time: 0, ang: 0 }, { time: 0.5, ang: 2 }],
    }
}

export const ALL_ANIMS = [IDLE_ANIM, WALK_ANIM, WORK_ANIM];

export function findAnimation(name: string) {
    return ALL_ANIMS.find(a => a.name === name);
}