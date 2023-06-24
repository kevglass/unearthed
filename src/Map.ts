export const MAP_WIDTH: number = 140;
export const TILE_SIZE: number = 128;
export const SKY_HEIGHT: number = 30;
export const MAP_DEPTH: number = 230;

import { getSprite, loadImage } from "./Resources";
import dirt_tile from "./img/tiles/dirt.png";
import dirt_grass_tile from "./img/tiles/dirt_grass.png";
import brick_grey_tile from "./img/tiles/brick_grey.png";
import brick_red_tile from "./img/tiles/brick_red.png";
import leaves_tile from "./img/tiles/leaves.png";
import sand_tile from "./img/tiles/sand.png";
import wood_tile from "./img/tiles/wood.png";
import ladder_tile from "./img/tiles/ladder.png";

import grass1_tile from "./img/tiles/grass1.png";
import grass2_tile from "./img/tiles/grass2.png";
import grass3_tile from "./img/tiles/grass3.png";
import grass4_tile from "./img/tiles/grass4.png";
import flowerwhite_tile from "./img/tiles/flowerwhite.png";
import flowerred_tile from "./img/tiles/flowerred.png";
import flowerblue_tile from "./img/tiles/flowerblue.png";
import trunkmid_tile from "./img/tiles/trunk_mid.png";
import trunkbottom_tile from "./img/tiles/trunk_bottom.png";
import { hosting } from ".";
import { sendMapUpdate } from "./Network";


interface Block {
    sprite: HTMLImageElement;
    blocks: boolean;
    ladder: boolean;
    needsGround: boolean;
    blocksDiscovery: boolean;
    leaveBackground: boolean;
}

export const tiles: Record<number, Block> = {
    1: { sprite: loadImage("tile.dirt", dirt_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    2: { sprite: loadImage("tile.dirt_grass", dirt_grass_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    3: { sprite: loadImage("tile.brick_grey", brick_grey_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false },
    4: { sprite: loadImage("tile.brick_red", brick_red_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false },
    5: { sprite: loadImage("tile.leaves_tile", leaves_tile), blocks: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false },
    6: { sprite: loadImage("tile.sand_tile", sand_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false },
    7: { sprite: loadImage("tile.wood_tile", wood_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: false },
    8: { sprite: loadImage("tile.ladder_tile", ladder_tile), blocks: false, ladder: true , needsGround: false, blocksDiscovery: true, leaveBackground: false },
    9: { sprite: loadImage("tile.grass1", grass1_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false },
    10: { sprite: loadImage("tile.grass2", grass2_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false },
    11: { sprite: loadImage("tile.grass3", grass3_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false  },
    12: { sprite: loadImage("tile.grass4", grass4_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false  },
    13: { sprite: loadImage("tile.flowerwhite", flowerwhite_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false  },
    14: { sprite: loadImage("tile.flowerblue", flowerblue_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false  },
    15: { sprite: loadImage("tile.flowerred", flowerred_tile), blocks: false, ladder: false, needsGround: true, blocksDiscovery: false, leaveBackground: false  },
    16: { sprite: loadImage("tile.trunkbottom", trunkbottom_tile), blocks: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false  },
    17: { sprite: loadImage("tile.trunkmid", trunkmid_tile), blocks: false, ladder: false, needsGround: false, blocksDiscovery: false, leaveBackground: false  },
};

const DEFAULT_MAP: number[] = [
];
let map: number[] = [];
const spriteMap: HTMLImageElement[] = [
];
const backgroundSpriteMap: HTMLImageElement[] = [
];
let background: number[] = [];
let discovered: boolean[] = [];
let discoveeryEnabled = true;


for (let i=0;i<MAP_WIDTH * SKY_HEIGHT;i++) {
    DEFAULT_MAP.push(0);
}
for (let i=0;i<MAP_WIDTH;i++) {
    DEFAULT_MAP.push(2);
}
const totalSize = (MAP_DEPTH * MAP_WIDTH)-DEFAULT_MAP.length;
for (let i=0;i<totalSize;i++) {
    DEFAULT_MAP.push(1);
}

clearMap();
generateMap();

export function resetMap() {
    clearMap();
    generateMap();
    refreshSpriteTileMap();
    setDiscovered(0, 0);
    sendMapUpdate(undefined);
}

function clearMap() {
    map = [...DEFAULT_MAP];
    background = [];
    discovered = [];
    for (let i=0;i<map.length;i++) {
        background.push(0);
        discovered.push(false);
    }
}

function generateMap() {
    // map generation
    let h = 0;
    let offset = 0;
    let sinceLastTree = 0;
    
    for (let x=5;x<MAP_WIDTH;x++) {
        sinceLastTree++;
        if (h > 10) {
            offset = 0.3;
        }
        if (h < 2) {
            offset = 0;
        }
        if (Math.random() < 0.2 + offset) {
            h--;
        } else if (Math.random() > 0.5 + offset) {
            h++;
        } 
    
        if (h < 0) {
            h = 0;
        }
        for (let i=0;i<h;i++) {
            setTile(x, SKY_HEIGHT-i, 1, 0);
        }
        setTile(x, SKY_HEIGHT-h, 2, 0);
    
        if (Math.random() < 0.2) {
            const grass = Math.floor(Math.random() * 4) + 9;
            setTile(x, SKY_HEIGHT-h-1, grass, 0);
        } else if (Math.random() < 0.23) {
            const flower = Math.floor(Math.random() * 3) + 13;
            setTile(x, SKY_HEIGHT-h-1, flower, 0);
        }
    
        if (Math.random() > 0.85) {
            if (sinceLastTree > 5) {
                sinceLastTree = 0;
                const heightOfTree = Math.floor(Math.random() * 3) + 2;
                setTile(x, SKY_HEIGHT-h-1, 16, 0);
                for (let i=1;i<heightOfTree;i++) {
                    setTile(x, SKY_HEIGHT-h-1-i, 17, 0);
                }
    
                for (let tx=-1;tx<2;tx++) {
                    for (let ty=-3;ty<0;ty++) {
                        setTile(x+tx, SKY_HEIGHT-h-heightOfTree+ty, 5, 0);
                    }
                }
            }
        }
    }

    // caverns time
    for (let i=0;i<100;i++) {
        let x = 10 + Math.floor(Math.random() * (MAP_WIDTH - 20));
        let y = SKY_HEIGHT + 5 + Math.floor(Math.random() * (MAP_DEPTH - (SKY_HEIGHT + 20)));
        const cutCount = 5 + Math.floor(Math.random() * 5);

        for (let cut=0;cut<cutCount;cut++) {
            const brushWidth = 4 + Math.floor(Math.random() * 2);
            const brushHeight = 4 + Math.floor(Math.random() * 2);

            let edges = [];

            for (let bx = 0;bx<brushWidth;bx++) {
                for (let by=0;by<brushHeight;by++) {
                    // round the corners
                    if (bx === 0 && (by === 0 || by === brushHeight-1)) {
                        continue;
                    }
                    if (bx === brushWidth-1 && (by === 0 || by === brushHeight-1)) {
                        continue;
                    }

                    let tx = x + bx - Math.floor(brushWidth / 2);
                    let ty = y + by - Math.floor(brushHeight / 2);

                    if ((bx === 0 || by === 0 || bx === brushHeight-1 || by === brushWidth -1)) {
                        if (ty > SKY_HEIGHT + 5) {
                            edges.push([tx, ty]);
                        }
                    }

                    map[tx + (ty * MAP_WIDTH)] = 0;
                    background[tx + (ty * MAP_WIDTH)] = 1;
                }
            }

            let nextCenter = edges[Math.floor(Math.random() * edges.length)];
            x = nextCenter[0];
            y = nextCenter[1];
        }
    }
}

const existingMap = localStorage.getItem("map");
const existingBG = localStorage.getItem("mapbg");
if (existingMap) {
    const savedMap = JSON.parse(existingMap);
    if (savedMap.length === DEFAULT_MAP.length) {
        map = savedMap;

        if (existingBG) {
            const savedMap = JSON.parse(existingBG);
            if (savedMap.length === DEFAULT_MAP.length) {
                background = savedMap;
            }
        }
    }
}

setDiscovered(0, 0);

export function getMapData(): { f: number[], b: number[] } {
    return { f: map, b: background };
}

export function setMapData(data:  { f: number[], b: number[] }) {
    clearMap();
    map = data.f;
    background = data.b;
    refreshSpriteTileMap();

    setDiscovered(0, 0);
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

export function isDiscovered(x: number, y: number): boolean {
    if (!discoveeryEnabled) {
        return true;
    }
    x = Math.floor(x);
    y = Math.floor(y);

    if ((x < 0) || (x >= MAP_WIDTH)) {
        return true;
    }
    if (y < 0) {
        return true;
    }

    return discovered[x + (y * MAP_WIDTH)];
}

export function setDiscovered(x: number, y: number, force: boolean = false): void {
    discoverImpl(x,y,force);
}

function discoverImpl(xp: number, yp: number, force: boolean = false): void {
    let toCheck: { x: number, y: number }[] = [];
    toCheck.push({x: xp, y: yp});

    while (toCheck.length > 0) {
        const point = toCheck.splice(0, 1)[0];

        let x = Math.floor(point.x);
        let y = Math.floor(point.y);

        if ((x < 0) || (x >= MAP_WIDTH)) {
            continue;
        }
        if (y < 0) {
            continue;
        }

        if (!discovered[x + (y * MAP_WIDTH)] || force) {
            discovered[x + (y * MAP_WIDTH)] = true;
            const tile = tiles[getTile(x,y,0)];
            if (!tile || !tile.blocks || !tile.blocksDiscovery) {
                toCheck.push({x: x - 1, y: y});
                toCheck.push({x: x - 1, y: y - 1});
                toCheck.push({x: x - 1, y: y + 1});
                
                toCheck.push({x: x + 1, y: y - 1});
                toCheck.push({x: x + 1, y: y});
                toCheck.push({x: x + 1, y: y + 1});

                toCheck.push({x: x, y: y - 1});
                toCheck.push({x: x, y: y + 1});
            }
        }

        force = false;
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

    const before = map[x + (y * MAP_WIDTH)];

    if (layer === 0) {
        map[x + (y * MAP_WIDTH)] = tile;
        const sprite = tiles[tile]?.sprite;
        spriteMap[x + (y * MAP_WIDTH)] = sprite;

        if (hosting) {
            localStorage.setItem("map", JSON.stringify(map));
        }

        if (tile === 0) {
            setDiscovered(x,y,true);
        }
    } else if (layer === 1) {
        background[x + (y * MAP_WIDTH)] = tile;
        const sprite = tiles[tile]?.sprite;
        backgroundSpriteMap[x + (y * MAP_WIDTH)] = sprite;
        if (hosting) {
            localStorage.setItem("mapbg", JSON.stringify(background));
        }
    }

    if (tile === 0) {
        const above = getTile(x, y-1, layer);
        const tile = tiles[above];
        if (tile && tile.needsGround) {
            setTile(x, y-1, 0, layer);
        }

        if (layer === 0) {
            const behind = getTile(x, y, 1);
            if (behind === 0) {
                const tile = tiles[before];
                if (tile && tile.leaveBackground) {
                    setTile(x, y, before, 1);
                }
            }
        }
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
let undiscovered: HTMLImageElement[] = [];

export function renderMap(g: CanvasRenderingContext2D, overX: number, overY: number, canAct: boolean, 
                          screenx: number, screeny: number, screenwidth: number, screenheight: number) {
    const height = map.length / MAP_WIDTH;

    if (!backingTile) {
        backingTile = getSprite("tile.backing");
    }
    if (!backingTopTile) {
        backingTopTile = getSprite("tile.backingtop");
    }
    if (undiscovered.length === 0) {
        undiscovered.push(getSprite("tile.undiscovered1"));
        undiscovered.push(getSprite("tile.undiscovered2"));
        undiscovered.push(getSprite("tile.undiscovered3"));
        undiscovered.push(getSprite("tile.undiscovered4"));
    }
    
    const xp = Math.floor(screenx / TILE_SIZE) - 1;
    const yp = Math.floor(screeny / TILE_SIZE) - 1;
    const tilesAcross = Math.floor(screenwidth / TILE_SIZE) + 3;
    const tilesDown = Math.floor(screenheight / TILE_SIZE) + 3;
    for (let x=xp;x<xp+tilesAcross;x++) {
        for (let y=yp;y<yp+tilesDown;y++) {
            if (isDiscovered(x,y)) {
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

    for (let x=xp;x<xp+tilesAcross;x++) {
        for (let y=yp;y<yp+tilesDown;y++) {
            if (!isDiscovered(x,y)) {
                g.drawImage(undiscovered[(x + y) % undiscovered.length], (x * TILE_SIZE) - (TILE_SIZE / 2), (y * TILE_SIZE) - (TILE_SIZE / 2));
            }
        }
    }
}