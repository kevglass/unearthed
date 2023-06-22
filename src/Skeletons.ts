import { Bone } from "./Bones";

function createHumanSkeleton(): Bone {
    const male = new Bone("root", 0, 0, 0, 0);
    const body = new Bone("body", 0, -20, 0, 3, "male.body", -22, 0, male);
    const head = new Bone("head", 0, 0, 0.1, 3, "male.head", -32, -64, body);
    const arm1 = new Bone("leftarm", 0, 20, 1, 5, "male.arm", -14, -10, body);
    const arm2 = new Bone("rightarm", 0, 20, 1, 0, "male.arm", -14, -10, body);
    const leg1 = new Bone("leftleg", 0, 60, 0, 4, "male.leg", -14, -2, body);
    const leg2 = new Bone("rightleg", 0, 60, 0, 2, "male.leg", -14, -2, body);
    const pick = new Bone("held", 0, 0, -2.1, 1, "pick.iron", -70, -130, arm2).setScale(0.7);

    return male;
}

export const HUMAN_SKELETON: Bone = createHumanSkeleton();