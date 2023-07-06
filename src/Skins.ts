import { Bone } from "./engine/Bones";
import { BoneDefinition, SkinDefinition } from "./mods/Mods";

/**
 * The bones that build up the human skeleton
 */
export enum BoneNames {
    ROOT = "root",
    BODY = "body",
    EAR = "ear",
    TAIL = "tail",
    HEAD = "head",
    LEFT_ARM = "leftarm",
    RIGHT_ARM = "rightarm",
    LEFT_LEG = "leftleg",
    RIGHT_LEG = "rightleg",
    BACK_LEFT_LEG = "backleftleg",
    BACK_RIGHT_LEG = "backrightleg",
    HELD = "held"
};

export interface Skin {
    width: number;
    height: number;
    skeleton: Bone;
}

/**
 * Create a human skeleton - this is used as the template for all players. Probably
 * should be in a configuration file
 * 
 * @returns The root bone of a human skeleton thats been created
 */
function createHumanSkeleton(): Bone {
    const root = new Bone(BoneNames.ROOT, 0, 0, 0, 0);
    const body = new Bone(BoneNames.BODY, -20, -40, 0, 3, "skins/a/body", -22, 0, root);
    const head = new Bone(BoneNames.HEAD, 10, 10, 0.1, 3, "skins/a/head", -32, -64, body);
    const arm1 = new Bone(BoneNames.RIGHT_ARM, 35, 35, 0, 0, "skins/a/arm", -25, -25, body);
    const arm2 = new Bone(BoneNames.LEFT_ARM, 10, 35, 0, 4, "skins/a/arm", -25, -25, body);
    const leg1 = new Bone(BoneNames.LEFT_LEG, 40, 75, 0, 2, "skins/a/leg", -25, -25, body);
    const leg2 = new Bone(BoneNames.RIGHT_LEG, 20, 75, 0, 2, "skins/a/leg", -25, -25, body);
    const pick = new Bone(BoneNames.HELD, 20, 80, 0.7, 1, "holding/pick_iron", -70, -130, arm1).setScale(0.7);

    return root;
}

function createFoxSkeleton(): Bone {
    const root = new Bone(BoneNames.ROOT, 0, 0, 0, 0);
    const body = new Bone(BoneNames.BODY, -50, -37, 0, 3, "skins/fox/body", 0, 0, root);
    const ear = new Bone(BoneNames.EAR, 64, 0, -0.1, 4, "skins/fox/ear", 0, -15, body);
    const tail = new Bone(BoneNames.TAIL, -35, 40, -0.2, 2, "skins/fox/tail", 0, -15, body);
    const bleg1 = new Bone(BoneNames.BACK_LEFT_LEG, 20, 50, 0, 0, "skins/fox/leg", -10, 0, body);
    const bleg2 = new Bone(BoneNames.BACK_RIGHT_LEG, 20, 50, 0, 4, "skins/fox/leg", -10, 0, body);
    const leg1 = new Bone(BoneNames.LEFT_LEG, 80, 50, 0, 1, "skins/fox/leg", -10, 0, body);
    const leg2 = new Bone(BoneNames.RIGHT_LEG, 75, 50, 0, 4, "skins/fox/leg", -10, 0, body);

    return root;
}

export const SKINS: Record<string, Skin> = {
    "fox": {
        width: 55,
        height: 37,
        skeleton: createFoxSkeleton(),
    },
    "human": {
        width: 40,
        height: 90,
        skeleton: createHumanSkeleton(),
    },
}

export function getSkin(name: string): Skin {
    return SKINS[name];
}

export function skinFromJson(data: SkinDefinition): Skin {
    if (data.width && data.height && data.skeleton) {
        return {
            width: data.width,
            height: data.height,
            skeleton: boneFromJson(undefined, data.skeleton)
        };
    } else {
        throw "Invalid Skin Json - missing width, height or skeleton";
    }
}

export function boneFromJson(parent: Bone | undefined, data: BoneDefinition): Bone {
    if (data.name) {
        const bone = new Bone(data.name, data.centerX, data.centerY, data.angle, data.layer, data.image, data.spriteOffsetX, data.spriteOffsetY, parent);
        if (data.children) {
            for (const child of data.children) {
                boneFromJson(bone, child)
            }
        }
        return bone;
    } else {
        throw "Invalid bone definition: " + data.name;
    }
}