import male_head from "./img/playermale/male_head.png";
import male_body from "./img/playermale/male_body.png";
import male_arm from "./img/playermale/male_arm.png";
import male_leg from "./img/playermale/male_leg.png";

import female_head from "./img/playerfemale/female_head.png";
import female_body from "./img/playerfemale/female_body.png";
import female_arm from "./img/playerfemale/female_arm.png";

import sloton_ui from "./img/ui/sloton.png";
import slotoff_ui from "./img/ui/slotoff.png";
import left_ui from "./img/ui/left.png";
import right_ui from "./img/ui/right.png";
import up_ui from "./img/ui/up.png";
import down_ui from "./img/ui/down.png";
import front_ui from "./img/ui/front.png";
import back_ui from "./img/ui/back.png";
import arrowup_ui from "./img/ui/arrowup.png";

import pick_iron from "./img/holding/pick_iron.png";
import clouds_bg from "./img/bg/clouds.png";
import backing_tile from "./img/tiles/backing.png";
import backingtop_tile from "./img/tiles/backingtop.png";
import square_orange_particle from "./img/particles/square_orange.png";
import square_red_particle from "./img/particles/square_red.png";
import logo from "./img/logo.png";

const sprites: Record<string, HTMLImageElement> = {};
let loadedCount = 0;

export function loadImage(name: string, url: string): HTMLImageElement {
    sprites[name] = new Image();
    sprites[name].src = url;
    loadedCount++;
    sprites[name].onload = () => { loadedCount--; };

    return sprites[name];
}

export function getSprite(name: string): HTMLImageElement {
    return sprites[name];
}

export function resourcesLoaded(): boolean {
    return loadedCount === 0;
}

loadImage("male.leg", male_leg);

loadImage("male.head", male_head);
loadImage("male.body", male_body);
loadImage("male.arm", male_arm);
loadImage("female.head", female_head);
loadImage("female.body", female_body);
loadImage("female.arm", female_arm);

loadImage("pick.iron", pick_iron);
loadImage("clouds", clouds_bg);
loadImage("red.particle", square_red_particle);
loadImage("orange.particle", square_orange_particle);
loadImage("logo", logo);

loadImage("ui.sloton", sloton_ui);
loadImage("ui.slotoff", slotoff_ui);
loadImage("ui.left", left_ui);
loadImage("ui.right", right_ui);
loadImage("ui.up", up_ui);
loadImage("ui.down", down_ui);
loadImage("ui.front", front_ui);
loadImage("ui.back", back_ui);
loadImage("ui.arrowup", arrowup_ui);

loadImage("tile.backing", backing_tile);
loadImage("tile.backingtop", backingtop_tile);