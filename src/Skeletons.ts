import { Bone } from "./Bones";

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

function createHumanSkeleton(): Bone {
    const male = new Bone(HumanBones.ROOT, 0, 0, 0, 0);
    const body = new Bone(HumanBones.BODY, 0, -20, 0, 3, "male.body", -22, 0, male);
    const head = new Bone(HumanBones.HEAD, 0, 0, 0.1, 3, "male.head", -32, -64, body);
    const arm1 = new Bone(HumanBones.LEFT_ARM, 0, 20, 1, 5, "male.arm", -14, -10, body);
    const arm2 = new Bone(HumanBones.RIGHT_ARM, 0, 20, 1, 0, "male.arm", -14, -10, body);
    const leg1 = new Bone(HumanBones.LEFT_LEG, 0, 60, 0, 4, "male.leg", -14, -2, body);
    const leg2 = new Bone(HumanBones.RIGHT_LEG, 0, 60, 0, 2, "male.leg", -14, -2, body);
    const pick = new Bone(HumanBones.HELD, 0, 0, -2.1, 1, "pick.iron", -70, -130, arm2).setScale(0.7);

    return male;
}

export const HUMAN_SKELETON: Bone = createHumanSkeleton();