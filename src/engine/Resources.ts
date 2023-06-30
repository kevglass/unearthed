//
// This is a big ole' collection of imported PNGs that have been
// packed up for us by webpack. I wouldn't normally do it this way
// but its worked out ok.
//

import { GraphicsImage } from "./Graphics";

function importAll(r: any) {
    let images: any = {};

    r.keys().map((item: any, index: any) => {
        images[item.replace('./', '')] = r(item).default;
    });
    return images;
}

export const RESOURCES = importAll(require.context('../', true, /.{3}.(png|mp3)$/));

/** A list of all the reported errors for resources so we only show them once */
const reportedErrors: Record<string, boolean> = {};

/** The collection of all sprites loaded by the game */
export const sprites: Record<string, GraphicsImage> = {};
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
 * @param resource The path to the resource
 * @returns The newly created image/sprite
 */
function loadImage(name: string, resource: string): GraphicsImage {
    const image = new GraphicsImage(name, new Image());
    sprites[name] = image;
    image.get().src = RESOURCES[resource];
    image.get().onload = () => { loadedCount--; };
    loadedCount++;
    return sprites[name];
}

export function loadImageFromUrl(name: string, url: string): GraphicsImage {
    const image = new GraphicsImage(name, new Image());
    sprites[name] = image;
    image.get().src = url;
    image.get().onload = () => { loadedCount--; };
    loadedCount++;
    return sprites[name];
}

/**
 * Load a sound effect into the resources cache
 * 
 * @param name The name to give the sound effect in the cache
 * @param resource The path to the resource
 */
function loadSfx(name: string, resource: string): void {
    loadedCount++;

    var req = new XMLHttpRequest();
    req.open("GET", RESOURCES[resource], true);
    req.responseType = "arraybuffer";

    req.onload = (event) => {
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
export function getSprite(name: string): GraphicsImage {
    if (!sprites[name] && !reportedErrors[name]) {
        reportedErrors[name] = true;
        console.log("Couldn't locate sprite with name: " + name);
    }
    return sprites[name];
}

/**
 * Set whether audio should be muted
 * 
 * @param muted True if the sound should be muted
 */
export function setSoundMuted(muted: boolean): void {
    localStorage.setItem('muted', muted ? '1' : '0');
}
/**
 * Check if sound is muted
 * 
 * @return True if sound is muted
 */
export function isSoundMuted() {
    return localStorage.getItem("muted") === "1";
}

/**
 * Confirm the audio context - 
 */
export function confirmAudioContext(): void {
    try {
      audioContext.resume().catch((e) => {
        console.log("Resume audio context failed");
        console.error(e);
      });
    } catch (e) {
      console.log("Resume audio context failed");
      console.error(e);
    }
}

/**
 * Play a sound effect
 * 
 * @param name The name of the sound effect to play
 * @param variations The number of variations of the sound effect to choose from
 */
export function playSfx(name: string, volume: number, variations: number | null = null): void {
    if (!audioContext || isSoundMuted()) {
        return;
    }

    confirmAudioContext();

    const variationName = variations ? `${name}_${(Math.floor(Math.random() * variations)).toString().padStart(3, '0')}` : name;
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
    } else {
        if (!sprites[name] && !reportedErrors[variationName]) {
            reportedErrors[variationName] = true;
            console.log("Couldn't locate sfx with name: " + variationName);
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

let audioContext: AudioContext = new AudioContext();

/**
 * Check if all the resources managed by this cache have been loaded
 * 
 * @returns True if all the resources have been loaded
 */
export function resourcesLoaded(): boolean {
    return loadedCount === 0;
}

/**
 * Load all the resources and associate them with keys
 */
export function loadAllResources() {
    console.log("Loading Resources....");

    // load all the images and link them to a name based on directory structure
    for (const link of Object.keys(RESOURCES)) {
        if (link.startsWith("img")) {
            const key = link.substring("img/".length, link.length-4);
            loadImage(key, link);
            console.log(" ==> Loading Image: " + key);
        }
        if (link.startsWith("sfx")) {
            const key = link.substring("sfx/".length, link.length-4);
            loadSfx(key, link);
            console.log(" ==> Loading SFX: " + key);
        }
    }
}
