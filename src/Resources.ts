//
// This is a big ole' collection of imported PNGs that have been
// packed up for us by webpack. I wouldn't normally do it this way
// but its worked out ok.
//
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
import sound_is_on_ui from "./img/ui/soundison.png";
import sound_is_off_ui from "./img/ui/soundisoff.png";

import backing_tile from "./img/tiles/backing.png";
import backingtop_tile from "./img/tiles/backingtop.png";
import undiscovered1_tile from "./img/tiles/undiscovered1.png";
import undiscovered2_tile from "./img/tiles/undiscovered2.png";
import undiscovered3_tile from "./img/tiles/undiscovered3.png";
import undiscovered4_tile from "./img/tiles/undiscovered4.png";

import pick_iron from "./img/holding/pick_iron.png";
import torch from "./img/holding/torch.png";

import clouds_bg from "./img/bg/clouds.png";
import hills_bg from "./img/bg/hills.png";
import square_orange_particle from "./img/particles/square_orange.png";
import square_red_particle from "./img/particles/square_red.png";
import logo from "./img/logo.png";

import click_002 from "./sfx/click_002.mp3";

import impactMetal_heavy_000 from "./sfx/impactMetal_heavy_000.mp3";
import impactMetal_heavy_001 from "./sfx/impactMetal_heavy_001.mp3";
import impactMetal_heavy_002 from "./sfx/impactMetal_heavy_002.mp3";
import impactMetal_heavy_003 from "./sfx/impactMetal_heavy_003.mp3";
import impactMetal_heavy_004 from "./sfx/impactMetal_heavy_004.mp3";
import impactMining_000 from "./sfx/impactMining_000.mp3";
import impactMining_001 from "./sfx/impactMining_001.mp3";
import impactMining_002 from "./sfx/impactMining_002.mp3";
import impactMining_003 from "./sfx/impactMining_003.mp3";
import impactMining_004 from "./sfx/impactMining_004.mp3";

import impactPlank_medium_004 from "./sfx/impactPlank_medium_004.mp3";

import footstep_concrete_000 from "./sfx/footstep_concrete_000.mp3";
import footstep_concrete_001 from "./sfx/footstep_concrete_001.mp3";
import footstep_concrete_002 from "./sfx/footstep_concrete_002.mp3";
import footstep_concrete_003 from "./sfx/footstep_concrete_003.mp3";
import footstep_concrete_004 from "./sfx/footstep_concrete_004.mp3";
import footstep_carpet_003 from "./sfx/footstep_carpet_003.mp3";

import select_006 from "./sfx/select_006.mp3";

/** The collection of all sprites loaded by the game */
const sprites: Record<string, HTMLImageElement> = {};
/** The collection of all sound effects loaded by the game */
const sfx: Record<string, ArrayBuffer> = {};
/** The audio elements changed to sources for the audio context */
const audioBuffers: Record<string, AudioBuffer> = {};

/** The number of assets left to load */
let loadedCount = 0;

/**
 * Load a sprite into the resources cache
 * 
 * @param name The name to give the sprite in the cache
 * @param url The URL (normally a webpack reference) to load the sprite from
 * @returns The newly created image/sprite
 */
export function loadImage(name: string, url: string): HTMLImageElement {
    sprites[name] = new Image();
    sprites[name].src = url;
    loadedCount++;
    sprites[name].onload = () => { loadedCount--; };
    return sprites[name];
}

/**
 * Load a sound effect into the resources cache
 * 
 * @param name The name to give the sound effect in the cache
 * @param url The URL (normally a webpack reference) to load the sound effect from
 */
export function loadSfx(name: string, url: string): void {
    loadedCount++;

    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    
    req.onload = (event) => {
      console.log("loaded");
      var arrayBuffer = req.response; 
      if (arrayBuffer) {
        sfx[name] = arrayBuffer;
      }
      loadedCount--; 
    };
    req.onerror = () => {
        alert("Error loading: " + name);
    }
    
    req.send();
}

/**
 * Get a sprite from the cache with a specific name
 * 
 * @param name The name of the sprite to retrieve
 * @returns The sprite or undefined if the sprite couldn't be found
 */
export function getSprite(name: string): HTMLImageElement {
    return sprites[name];
}

/**
 * Play a sound effect
 * 
 * @param name The name of the sound effect to play
 * @param variations The number of variations of the sound effect to choose from
 */
export function playSfx(name: string, volume: number, variations: number|null = null): void {
    if (!audioContext) {
        return;
    }

    audioContext.resume().catch((e) => {
      console.log("Resume audio context failed");
      console.error(e);
    });

    const variationName = variations ? `${name}.${(Math.floor(Math.random() * variations)).toString().padStart(3, '0')}` : name;
    const effect = sfx[variationName];

    if (effect) {
        if (!audioBuffers[variationName]) {
            audioContext.decodeAudioData(effect).then((buffer: AudioBuffer) => {
                audioBuffers[variationName] = buffer;
                playBuffer(buffer, volume);
            });
        } else {
            playBuffer(audioBuffers[variationName], volume);
        }
    }
}

function playBuffer(buffer: AudioBuffer, volume: number = 1): void {
    const source = audioContext.createBufferSource();
    const gainNode: GainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
}

let audioContext: AudioContext

export function startAudioOnFirstInput() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }
}
/**
 * Check if all the resources managed by this cache have been loaded
 * 
 * @returns True if all the resources have been loaded
 */
export function resourcesLoaded(): boolean {
    return loadedCount === 0;
}

// same legs for everyone at themoment
loadImage("male.leg", male_leg);

// male body skin
loadImage("male.head", male_head);
loadImage("male.body", male_body);
loadImage("male.arm", male_arm);

// female body skin
loadImage("female.head", female_head);
loadImage("female.body", female_body);
loadImage("female.arm", female_arm);

// items
loadImage("pick.iron", pick_iron);
loadImage("torch", torch);

// misc resources
loadImage("clouds", clouds_bg);
loadImage("hills", hills_bg);
loadImage("red.particle", square_red_particle);
loadImage("orange.particle", square_orange_particle);
loadImage("logo", logo);

// ui resources
loadImage("ui.sloton", sloton_ui);
loadImage("ui.slotoff", slotoff_ui);
loadImage("ui.left", left_ui);
loadImage("ui.right", right_ui);
loadImage("ui.up", up_ui);
loadImage("ui.down", down_ui);
loadImage("ui.front", front_ui);
loadImage("ui.back", back_ui);
loadImage("ui.arrowup", arrowup_ui);
loadImage("ui.soundison", sound_is_on_ui);

// images that are used for the tilemap rendering but are not tiles
loadImage("tile.backing", backing_tile);
loadImage("tile.backingtop", backingtop_tile);
loadImage("tile.undiscovered1", undiscovered1_tile);
loadImage("tile.undiscovered2", undiscovered2_tile);
loadImage("tile.undiscovered3", undiscovered3_tile);
loadImage("tile.undiscovered4", undiscovered4_tile);

// ui sounds
loadSfx("click", click_002);

// mining sounds
loadSfx("mining.000", impactMetal_heavy_000);
loadSfx("mining.001", impactMetal_heavy_001);
loadSfx("mining.002", impactMetal_heavy_002);
loadSfx("mining.003", impactMetal_heavy_003);
loadSfx("mining.004", impactMetal_heavy_004);
loadSfx("mining_break.000", impactMining_000);
loadSfx("mining_break.001", impactMining_001);
loadSfx("mining_break.002", impactMining_002);
loadSfx("mining_break.003", impactMining_003);
loadSfx("mining_break.004", impactMining_004);

// building sounds
loadSfx("place", impactPlank_medium_004);

// footstep sounds
loadSfx("footstep.000", footstep_concrete_000);
loadSfx("footstep.001", footstep_concrete_001);
loadSfx("footstep.002", footstep_concrete_002);
loadSfx("footstep.003", footstep_concrete_003);
loadSfx("footstep.004", footstep_concrete_004);
loadSfx("jump", footstep_carpet_003);

// explosion sounds
loadSfx("explosion", select_006);
