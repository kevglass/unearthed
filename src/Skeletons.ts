import { Bone } from "./engine/Bones";

/**
 * The bones that build up the human skeleton
 */
export enum HumanBones {
    ROOT = "root",
    BODY = "body",
    HEAD = "head",
    LEFT_ARM = "leftarm",
    RIGHT_ARM = "rightarm",
    LEFT_LEG = "leftleg",
    RIGHT_LEG = "rightleg",
    HELD = "held"
};

/**
 * Create a human skeleton - this is used as the template for all players. Probably
 * should be in a configuration file
 * 
 * @returns The root bone of a human skeleton thats been created
 */
function createHumanSkeleton(): Bone {
    const root = new Bone(HumanBones.ROOT, 0, 0, 0, 0);
    const body = new Bone(HumanBones.BODY, -20, -40, 0, 3, "skins/a/body", -22, 0, root);
    const head = new Bone(HumanBones.HEAD, 10, 10, 0.1, 3, "skins/a/head", -32, -64, body);
    const arm1 = new Bone(HumanBones.RIGHT_ARM, 35, 35, 0, 0, "skins/a/arm", -25, -25, body);
    const arm2 = new Bone(HumanBones.LEFT_ARM, 10, 35, 0, 4, "skins/a/arm", -25, -25, body);
    const leg1 = new Bone(HumanBones.LEFT_LEG, 40, 75, 0, 2, "skins/a/leg", -25, -25, body);
    const leg2 = new Bone(HumanBones.RIGHT_LEG, 20, 75, 0, 2, "skins/a/leg", -25, -25, body);
    const pick = new Bone(HumanBones.HELD, 20, 80, 0.7, 1, "holding/pick_iron", -70, -130, arm1).setScale(0.7);

    return root;
}

export const SKELETONS: Record<string, Bone> = {
    "human": createHumanSkeleton()
}

export function getSkeleton(name: string): Bone {
    return SKELETONS[name];
}