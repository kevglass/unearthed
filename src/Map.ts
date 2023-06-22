export const MAP_WIDTH: number = 40;
export const TILE_SIZE: number = 128;
export const SKY_HEIGHT: number = 30;
export const MAP_DEPTH: number = 300;

import { loadImage } from "./Resources";
import dirt_tile from "./img/tiles/dirt.png";
import dirt_grass_tile from "./img/tiles/dirt_grass.png";
import brick_grey_tile from "./img/tiles/brick_grey.png";
import brick_red_tile from "./img/tiles/brick_red.png";
import leaves_tile from "./img/tiles/leaves.png";
import sand_tile from "./img/tiles/sand.png";
import wood_tile from "./img/tiles/wood.png";

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
const existingMap = localStorage.getItem("map");
if (existingMap) {
    const savedMap = JSON.parse(existingMap);
    if (savedMap.length === DEFAULT_MAP.length) {
        map = savedMap;
    }
}
const spriteMap: HTMLImageElement[] = [
];

interface Block {
    sprite: HTMLImageElement;
    blocks: boolean;
}

export const tiles: Record<number, Block> = {
    1: { sprite: loadImage("tile.dirt", dirt_tile), blocks: true },
    2: { sprite: loadImage("tile.dirt_grass", dirt_grass_tile), blocks: true },
    3: { sprite: loadImage("tile.brick_grey", brick_grey_tile), blocks: true },
    4: { sprite: loadImage("tile.brick_red", brick_red_tile), blocks: true },
    5: { sprite: loadImage("tile.leaves_tile", leaves_tile), blocks: true },
    6: { sprite: loadImage("tile.sand_tile", sand_tile), blocks: true },
    7: { sprite: loadImage("tile.wood_tile", wood_tile), blocks: true },
};

export function getMapData(): number[] {
    return map;
}

export function setMapData(data: number[]) {
    map = data;
    refreshSpriteTileMap();
}

export function refreshSpriteTile(x: number, y: number) {
    const i = x + (y * MAP_WIDTH);
    const tile = tiles[map[i]]?.sprite;
    spriteMap[i] = tile;
}

export function refreshSpriteTileMap(): void {
    for (let i=0;i<map.length;i++) {
        const tile = tiles[map[i]]?.sprite;
        spriteMap[i] = tile;
    }
}

export function setTile(x: number, y: number, tile: number): void {
    x = Math.floor(x);
    y = Math.floor(y);

    if ((x < 0) || (x >= MAP_WIDTH)) {
        return;
    }
    if (y < 0) {
        return;
    }

    map[x + (y * MAP_WIDTH)] = tile;
    const sprite = tiles[tile]?.sprite;
    spriteMap[x + (y * MAP_WIDTH)] = sprite;

    localStorage.setItem("map", JSON.stringify(map));
}

export function getTile(x: number, y: number): number {
    x = Math.floor(x);
    y = Math.floor(y);

    if ((x < 0) || (x >= MAP_WIDTH)) {
        return 1;
    }
    if (y < 0) {
        return 0;
    }


    return map[x + (y * MAP_WIDTH)];
}

export function renderMap(g: CanvasRenderingContext2D, overX: number, overY: number, canAct: boolean, 
                          screenx: number, screeny: number, screenwidth: number, screenheight: number) {
    const height = map.length / MAP_WIDTH;

    const xp = Math.floor(screenx / TILE_SIZE) - 1;
    const yp = Math.floor(screeny / TILE_SIZE) - 1;
    const tilesAcross = Math.floor(screenwidth / TILE_SIZE) + 3;
    const tilesDown = Math.floor(screenheight / TILE_SIZE) + 3;
    for (let x=xp;x<xp+tilesAcross;x++) {
        for (let y=yp;y<yp+tilesDown;y++) {
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