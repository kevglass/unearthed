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

import stone_tile from "./img/tiles/stone.png";
import coal_tile from "./img/tiles/coal.png";
import gold_tile from "./img/tiles/gold.png";
import iron_tile from "./img/tiles/iron.png";
import silver_tile from "./img/tiles/silver.png";
import diamond_tile from "./img/tiles/diamond.png";

import { NETWORK } from "./Network";
import { GAME } from "./Game";


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


    18: { sprite: loadImage("tile.stone", stone_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    19: { sprite: loadImage("tile.coal", coal_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    20: { sprite: loadImage("tile.iron", iron_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    21: { sprite: loadImage("tile.silver", silver_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    22: { sprite: loadImage("tile.gold", gold_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
    23: { sprite: loadImage("tile.diamond", diamond_tile), blocks: true, ladder: false, needsGround: false, blocksDiscovery: true, leaveBackground: true },
};

const DEFAULT_MAP: number[] = [
];


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

export class GameMap {
    map: number[] = [];
    spriteMap: HTMLImageElement[] = [
    ];
    backgroundSpriteMap: HTMLImageElement[] = [
    ];
    background: number[] = [];
    discovered: boolean[] = [];
    discoveryEnabled = true;
    backingTile?: HTMLImageElement;
    backingTopTile?: HTMLImageElement;
    undiscovered: HTMLImageElement[] = [];
    
    reset() {
        console.log("Reset map");
        this.clear();
        this.generate();
        this.refreshSpriteTileMap();
        this.setDiscovered(0, 0);
        NETWORK.sendMapUpdate(undefined);
    }

    clear() {
        this.map = [...DEFAULT_MAP];
        this.background = [];
        this.discovered = [];
        for (let i=0;i<this.map.length;i++) {
            this.background.push(0);
            this.discovered.push(false);
        }
    }

    loadFromStorage(): boolean {
        const existingMap = localStorage.getItem("map");
        const existingBG = localStorage.getItem("mapbg");
        if (existingMap) {
            const savedMap = JSON.parse(existingMap);
            if (savedMap.length >= DEFAULT_MAP.length) {
                this.map = savedMap;

                if (existingBG) {
                    const savedMap = JSON.parse(existingBG);
                    if (savedMap.length >= DEFAULT_MAP.length) {
                        this.background = savedMap;
                    }
                }

                this.refreshSpriteTileMap();
                return true;
            }
        }

        return false;
    }

    generate() {
        console.log("Generating map");
    
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
                this.setTile(x, SKY_HEIGHT-i, 1, 0);
            }
            this.setTile(x, SKY_HEIGHT-h, 2, 0);
        
            if (Math.random() < 0.2) {
                const grass = Math.floor(Math.random() * 4) + 9;
                this.setTile(x, SKY_HEIGHT-h-1, grass, 0);
            } else if (Math.random() < 0.23) {
                const flower = Math.floor(Math.random() * 3) + 13;
                this.setTile(x, SKY_HEIGHT-h-1, flower, 0);
            }
        
            if (Math.random() > 0.85) {
                if (sinceLastTree > 5) {
                    sinceLastTree = 0;
                    const heightOfTree = Math.floor(Math.random() * 3) + 2;
                    this.setTile(x, SKY_HEIGHT-h-1, 16, 0);
                    for (let i=1;i<heightOfTree;i++) {
                        this.setTile(x, SKY_HEIGHT-h-1-i, 17, 0);
                    }
        
                    for (let tx=-1;tx<2;tx++) {
                        for (let ty=-3;ty<0;ty++) {
                            this.setTile(x+tx, SKY_HEIGHT-h-heightOfTree+ty, 5, 0);
                        }
                    }
                }
            }
        }
    
        // caverns time
        for (let i=0;i<100;i++) {
            this.placeSeam(0, 4, SKY_HEIGHT+5, MAP_DEPTH - 15, 5);
        }
        for (let i=0;i<80;i++) {
            this.placeSeam(18, 3, SKY_HEIGHT+5, MAP_DEPTH - 15, 3);
        }
        for (let i=0;i<60;i++) {
            this.placeSeam(19, 3, SKY_HEIGHT+5, MAP_DEPTH - 15, 3);
        }
        for (let i=0;i<40;i++) {
            this.placeSeam(20, 3, SKY_HEIGHT+40, MAP_DEPTH - 15, 3);
        }
        for (let i=0;i<30;i++) {
            this.placeSeam(21, 3, SKY_HEIGHT+60, MAP_DEPTH - 15, 2);
        }
        for (let i=0;i<30;i++) {
            this. placeSeam(22, 3, SKY_HEIGHT+100, MAP_DEPTH - 15, 2);
        }
        for (let i=0;i<30;i++) {
            this.placeSeam(23, 3, SKY_HEIGHT+150, MAP_DEPTH - 15, 2);
        }
    
        localStorage.setItem("map", JSON.stringify(this.map));
        localStorage.setItem("mapbg", JSON.stringify(this.background));
    }
    
    private placeSeam(tile: number, size: number, upper: number, lower: number, cutBase: number) {
        let x = 10 + Math.floor(Math.random() * (MAP_WIDTH - 20));
        let y = upper + Math.floor(Math.random() * (MAP_DEPTH - upper));
        const cutCount = cutBase + Math.floor(Math.random() * 5);
    
        for (let cut=0;cut<cutCount;cut++) {
            const brushWidth = size + Math.floor(Math.random() * 2);
            const brushHeight = size + Math.floor(Math.random() * 2);
    
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
                        if ((ty > SKY_HEIGHT + 5) && (ty < MAP_DEPTH - 15)) {
                            edges.push([tx, ty]);
                        }
                    }
    
                    this.map[tx + (ty * MAP_WIDTH)] = tile;
                    this.background[tx + (ty * MAP_WIDTH)] = 1;
                }
            }
    
            if (edges.length === 0) {
                return;
            }
    
            let nextCenter = edges[Math.floor(Math.random() * edges.length)];
            x = nextCenter[0];
            y = nextCenter[1];
        }
    }

    getMapData(): { f: number[], b: number[] } {
        return { f: this.map, b: this.background };
    }
    
    setMapData(data:  { f: number[], b: number[] }) {
        this.clear();
        this.map = data.f;
        this.background = data.b;
        this.refreshSpriteTileMap();
    
        this.setDiscovered(0, 0);
    }
    
    refreshSpriteTile(x: number, y: number) {
        const i = x + (y * MAP_WIDTH);
        const tile = tiles[this.map[i]]?.sprite;
        this.spriteMap[i] = tile;
        const bg = tiles[this.background[i]]?.sprite;
        this.backgroundSpriteMap[i] = bg;
    }
    
    refreshSpriteTileMap(): void {
        for (let i=0;i<this.map.length;i++) {
            const tile = tiles[this.map[i]]?.sprite;
            this.spriteMap[i] = tile;
            const bg = tiles[this.background[i]]?.sprite;
            this.backgroundSpriteMap[i] = bg;
        }
    }
    
    isDiscovered(x: number, y: number): boolean {
        if (!this.discoveryEnabled) {
            return true;
        }
        x = Math.floor(x);
        y = Math.floor(y);
    
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return true;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return true;
        }
    
        return this.discovered[x + (y * MAP_WIDTH)];
    }
    
    setDiscovered(x: number, y: number, force: boolean = false): void {
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return;
        }
    
        this.discoverImpl(x,y,force);
    }
    
    private discoverImpl(xp: number, yp: number, force: boolean = false): void {
        let toCheck: { x: number, y: number }[] = [];
        toCheck.push({x: xp, y: yp});
    
        while (toCheck.length > 0) {
            const point = toCheck.splice(0, 1)[0];
    
            let x = Math.floor(point.x);
            let y = Math.floor(point.y);
    
            if ((x < 0) || (x >= MAP_WIDTH)) {
                continue;
            }
            if (y < 0 || y >= MAP_DEPTH) {
                continue;
            }
    
            if (!this.discovered[x + (y * MAP_WIDTH)] || force) {
                this.discovered[x + (y * MAP_WIDTH)] = true;
                const tile = tiles[this.getTile(x,y,0)];
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
    
    setTile(x: number, y: number, tile: number, layer: number): void {
        x = Math.floor(x);
        y = Math.floor(y);
    
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return;
        }
    
        const before = this.map[x + (y * MAP_WIDTH)];
    
        if (layer === 0) {
            this.map[x + (y * MAP_WIDTH)] = tile;
            const sprite = tiles[tile]?.sprite;
            this.spriteMap[x + (y * MAP_WIDTH)] = sprite;
    
            if (GAME.isHostingTheServer) {
                localStorage.setItem("map", JSON.stringify(this.map));
            }
    
            if (tile === 0) {
                this.setDiscovered(x,y,true);
            }
        } else if (layer === 1) {
            this.background[x + (y * MAP_WIDTH)] = tile;
            const sprite = tiles[tile]?.sprite;
            this.backgroundSpriteMap[x + (y * MAP_WIDTH)] = sprite;
            if (GAME.isHostingTheServer) {
                localStorage.setItem("mapbg", JSON.stringify(this.background));
            }
        }
    
        if (tile === 0) {
            const above = this.getTile(x, y-1, layer);
            const tile = tiles[above];
            if (tile && tile.needsGround) {
                this.setTile(x, y-1, 0, layer);
            }
    
            if (layer === 0) {
                const behind = this.getTile(x, y, 1);
                if (behind === 0) {
                    const tile = tiles[before];
                    if (tile && tile.leaveBackground) {
                        this.setTile(x, y, before, 1);
                    }
                }
            }
        }
    }
    
    isLadder(x: number, y: number): boolean {
        const tile1 = this.getTile(x,y,0);
        const tile2 = this.getTile(x,y,1);
        const def1 = tiles[tile1];
        const def2 = tiles[tile2];
        return (def1 && def1.ladder) || (!def1 && def2 && def2.ladder);
    }
    
    isBlocked(x: number, y: number): boolean {
        const tile = this.getTile(x,y,0);
        const def = tiles[tile];
        return (def && def.blocks);
    }
    
    getTile(x: number, y: number, layer: number): number {
        x = Math.floor(x);
        y = Math.floor(y);
    
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return 1;
        }
        if (y < 0) {
            return 0;
        }
        if (y >= MAP_DEPTH) {
            return 1;
        }
    
        if (layer === 1) {
            return this.background[x+(y*MAP_WIDTH)];
        }
    
        return this.map[x + (y * MAP_WIDTH)];
    }
    
    render(g: CanvasRenderingContext2D, overX: number, overY: number, canAct: boolean, 
                              screenx: number, screeny: number, screenwidth: number, screenheight: number) {
        const height = this.map.length / MAP_WIDTH;
    
        if (!this.backingTile) {
            this.backingTile = getSprite("tile.backing");
        }
        if (!this.backingTopTile) {
            this.backingTopTile = getSprite("tile.backingtop");
        }
        if (this.undiscovered.length === 0) {
            this.undiscovered.push(getSprite("tile.undiscovered1"));
            this.undiscovered.push(getSprite("tile.undiscovered2"));
            this.undiscovered.push(getSprite("tile.undiscovered3"));
            this.undiscovered.push(getSprite("tile.undiscovered4"));
        }
        
        const xp = Math.floor(screenx / TILE_SIZE) - 1;
        const yp = Math.floor(screeny / TILE_SIZE) - 1;
        const tilesAcross = Math.floor(screenwidth / TILE_SIZE) + 3;
        const tilesDown = Math.floor(screenheight / TILE_SIZE) + 3;
        for (let x=xp;x<xp+tilesAcross;x++) {
            for (let y=yp;y<yp+tilesDown;y++) {
                if (this.isDiscovered(x,y)) {
                    const bg = this.backgroundSpriteMap[x + (y * MAP_WIDTH)];
                    if (bg) {
                        g.drawImage(bg, x * TILE_SIZE, y * TILE_SIZE);
                        let overhang = this.getTile(x, y-1, 0);
                        g.drawImage(overhang ? this.backingTopTile : this.backingTile, x * TILE_SIZE, y * TILE_SIZE);
                    }
                    const sprite = this.spriteMap[x + (y * MAP_WIDTH)];
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
                if (!this.isDiscovered(x,y)) {
                    g.drawImage(this.undiscovered[(x + y) % this.undiscovered.length], (x * TILE_SIZE) - (TILE_SIZE / 2), (y * TILE_SIZE) - (TILE_SIZE / 2));
                }
            }
        }
    }
}

export const GAME_MAP: GameMap = new GameMap();
GAME_MAP.clear();
if (!GAME_MAP.loadFromStorage()) {
    GAME_MAP.generate();
}
GAME_MAP.setDiscovered(0, 0);
