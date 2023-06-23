export const MAP_WIDTH: number = 40;
export const TILE_SIZE: number = 128;
export const SKY_HEIGHT: number = 30;
export const MAP_DEPTH: number = 300;

import { getSprite, loadImage } from "./Resources";
import dirt_tile from "./img/tiles/dirt.png";
import dirt_grass_tile from "./img/tiles/dirt_grass.png";
import brick_grey_tile from "./img/tiles/brick_grey.png";
import brick_red_tile from "./img/tiles/brick_red.png";
import leaves_tile from "./img/tiles/leaves.png";
import sand_tile from "./img/tiles/sand.png";
import wood_tile from "./img/tiles/wood.png";
import ladder_tile from "./img/tiles/ladder.png";

const DEFAULT_MAP: number[] = [
];

for (let i=0;i<MAP_WIDTH * SKY_HEIGHT;i++) {
    DEFAULT_MAP.push(0);
}
for (let i=0;i<MAP_WIDTH;i++) {
    DEFAULT_MAP.push(2);
}
for (let i=0;i<(MAP_DEPTH * MAP_WIDTH)-DEFAULT_MAP.length;i++) {
    DEFAULT_MAP.push(1);
}

let map: number[] = DEFAULT_MAP;
let background: number[] = [];
for (let i=0;i<map.length;i++) {
    background.push(0);
}

const existingMap = localStorage.getItem("map");
const existingBG = localStorage.getItem("mapbg");
if (existingMap) {
    const savedMap = JSON.parse(existingMap);
    if (savedMap.length === DEFAULT_MAP.length) {
        map = savedMap;
    }
}
if (existingBG) {
    const savedMap = JSON.parse(existingBG);
    if (savedMap.length === DEFAULT_MAP.length) {
        background = savedMap;
    }
}

const spriteMap: HTMLImageElement[] = [
];
const backgroundSpriteMap: HTMLImageElement[] = [
];

interface Block {
    sprite: HTMLImageElement;
    blocks: boolean;
    ladder: boolean;
}

export const tiles: Record<number, Block> = {
    1: { sprite: loadImage("tile.dirt", dirt_tile), blocks: true, ladder: false },
    2: { sprite: loadImage("tile.dirt_grass", dirt_grass_tile), blocks: true, ladder: false },
    3: { sprite: loadImage("tile.brick_grey", brick_grey_tile), blocks: true, ladder: false },
    4: { sprite: loadImage("tile.brick_red", brick_red_tile), blocks: true, ladder: false },
    5: { sprite: loadImage("tile.leaves_tile", leaves_tile), blocks: true, ladder: false },
    6: { sprite: loadImage("tile.sand_tile", sand_tile), blocks: true, ladder: false },
    7: { sprite: loadImage("tile.wood_tile", wood_tile), blocks: true, ladder: false },
    8: { sprite: loadImage("tile.ladder_tile", ladder_tile), blocks: false, ladder: true },
};

export function getMapData(): { f: number[], b: number[] } {
    return { f: map, b: background };
}

export function setMapData(data:  { f: number[], b: number[] }) {
    map = data.f;
    background = data.b;
    refreshSpriteTileMap();
}

export function refreshSpriteTile(x: number, y: number) {
    const i = x + (y * MAP_WIDTH);
    const tile = tiles[map[i]]?.sprite;
    spriteMap[i] = tile;
    const bg = tiles[background[i]]?.sprite;
    backgroundSpriteMap[i] = bg;
}

export function refreshSpriteTileMap(): void {
    for (let i=0;i<map.length;i++) {
        const tile = tiles[map[i]]?.sprite;
        spriteMap[i] = tile;
        const bg = tiles[background[i]]?.sprite;
        backgroundSpriteMap[i] = bg;
    }
}

export function setTile(x: number, y: number, tile: number, layer: number): void {
    x = Math.floor(x);
    y = Math.floor(y);

    if ((x < 0) || (x >= MAP_WIDTH)) {
        return;
    }
    if (y < 0) {
        return;
    }

        if (layer === 0) {
        map[x + (y * MAP_WIDTH)] = tile;
        const sprite = tiles[tile]?.sprite;
        spriteMap[x + (y * MAP_WIDTH)] = sprite;
        localStorage.setItem("map", JSON.stringify(map));
    } else if (layer === 1) {
        background[x + (y * MAP_WIDTH)] = tile;
        const sprite = tiles[tile]?.sprite;
        backgroundSpriteMap[x + (y * MAP_WIDTH)] = sprite;
        localStorage.setItem("mapbg", JSON.stringify(background));
    }
}

export function isLadder(x: number, y: number): boolean {
    const tile1 = getTile(x,y,0);
    const tile2 = getTile(x,y,1);
    const def1 = tiles[tile1];
    const def2 = tiles[tile2];
    return (def1 && def1.ladder) || (!def1 && def2 && def2.ladder);
}

export function isBlocked(x: number, y: number): boolean {
    const tile = getTile(x,y,0);
    const def = tiles[tile];
    return (def && def.blocks);
}

export function getTile(x: number, y: number, layer: number): number {
    x = Math.floor(x);
    y = Math.floor(y);

    if ((x < 0) || (x >= MAP_WIDTH)) {
        return 1;
    }
    if (y < 0) {
        return 0;
    }

    if (layer === 1) {
        return background[x+(y*MAP_WIDTH)];
    }

    return map[x + (y * MAP_WIDTH)];
}

let backingTile: HTMLImageElement;
let backingTopTile: HTMLImageElement;

export function renderMap(g: CanvasRenderingContext2D, overX: number, overY: number, canAct: boolean, 
                          screenx: number, screeny: number, screenwidth: number, screenheight: number) {
    const height = map.length / MAP_WIDTH;

    if (!backingTile) {
        backingTile = getSprite("tile.backing");
    }
    if (!backingTopTile) {
        backingTopTile = getSprite("tile.backingtop");
    }
    
    const xp = Math.floor(screenx / TILE_SIZE) - 1;
    const yp = Math.floor(screeny / TILE_SIZE) - 1;
    const tilesAcross = Math.floor(screenwidth / TILE_SIZE) + 3;
    const tilesDown = Math.floor(screenheight / TILE_SIZE) + 3;
    for (let x=xp;x<xp+tilesAcross;x++) {
        for (let y=yp;y<yp+tilesDown;y++) {
            const bg = backgroundSpriteMap[x + (y * MAP_WIDTH)];
            if (bg) {
                g.drawImage(bg, x * TILE_SIZE, y * TILE_SIZE);
                let overhang = getTile(x, y-1, 0);
                g.drawImage(overhang ? backingTopTile : backingTile, x * TILE_SIZE, y * TILE_SIZE);
            }
            const sprite = spriteMap[x + (y * MAP_WIDTH)];
            if (sprite) {
                g.drawImage(sprite, x * TILE_SIZE, y * TILE_SIZE);
            }

            if (x === overX && y === overY && canAct) {
                g.fillStyle = "rgba(255, 255, 255, 0.3)";
                g.fillRect(x* TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}