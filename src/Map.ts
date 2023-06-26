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

/** The total width of the map in tiles */
export const MAP_WIDTH: number = 140;
/** The size of tile in the map - Kenney did the original ones at 128px */
export const TILE_SIZE: number = 128;
/** The height of the sky area before the ground starts */
export const SKY_HEIGHT: number = 30;
/** The depth of the map */
export const MAP_DEPTH: number = 230;

// NOTE: The MAP_WIDTH * MAP_DEPTH * 2 can not be greater than 64k since it won't
// fit in a network packet at the moment

/**
 * Definition of a block that can appear in the map
 */
interface Block {
    /** The sprite to draw for the block */
    sprite: HTMLImageElement;
    /** True if this one blocks movement */
    blocks: boolean;
    /** True if this block act as a ladder */
    ladder: boolean;
    /** True if this block needs ground under it to exist - like flowers - automatically destroy if nothing there */
    needsGround: boolean;
    /** True if this one blocks the discovery process - leaves for instance don't */
    blocksDiscovery: boolean;
    /** True if this block leaves a copy of itself in the background layer when removed from the foreground, used for caves discovery */
    leaveBackground: boolean;
}

/**
 * The list of tiles that be used in the map
 */
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

export enum Layer {
    FOREGROUND = 0,
    BACKGROUND = 1
}

// 
// The default map just defined an empty flat world of the
// the right size
//
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

/**
 * The game map consists of two tile layers (foreground and background) and a cached
 * sprite mapping from tile to sprite (to help with rendering). The map also tracks which
 * tiles have been discovered and hence are shown as opposed to fog of war.
 */
export class GameMap {
    /** The foreground tile map */
    foreground: number[] = [];
    /** The background tile map */
    background: number[] = [];
    /** A cache of sprites based on the foreground tiles - used for rendering */
    foregroundSpriteMap: HTMLImageElement[] = [];
    /** A cache of sprites based on the background tiles - used for rendering */
    backgroundSpriteMap: HTMLImageElement[] = [];
    /** Map of which tiles have been discovered on this map */
    discovered: boolean[] = [];
    /** True if we're using discovery to black out areas the player hasn't seen yet - turn it off to check cavern generation */
    discoveryEnabled = true;
    /** The tile used to darken background tiles */
    backingTile?: HTMLImageElement;
    /** The tile used to darken background tiles where they have an overhand and need a shadow */
    backingTopTile?: HTMLImageElement;
    /** The collection of images that can be used to black out undiscovered areas - these vary to make the black not uniform */
    undiscovered: HTMLImageElement[] = [];
    
    /**
     * Reset the map to a newly generated one
     */
    reset() {
        console.log("Reset map");
        this.clear();
        this.generate();
        this.refreshSpriteTileMap();
        this.setDiscovered(0, 0);
        NETWORK.sendMapUpdate(undefined);
    }

    /**
     * Clear the map resetting it to the default state
     */
    clear() {
        this.foreground = [...DEFAULT_MAP];
        this.background = [];
        this.discovered = [];
        for (let i=0;i<this.foreground.length;i++) {
            this.background.push(0);
            this.discovered.push(false);
        }
    }

    /**
     * Load the map data from browser local storage if available
     * 
     * @returns True if we found a map to load
     */
    loadFromStorage(): boolean {
        const existingMap = localStorage.getItem("map");
        const existingBG = localStorage.getItem("mapbg");
        if (existingMap) {
            const savedMap = JSON.parse(existingMap);
            if (savedMap.length >= DEFAULT_MAP.length) {
                this.foreground = savedMap;

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

    /**
     * Generate a new map 
     */
    generate() {
        console.log("Generating map");
    
        // map generation
        let h = 0;
        let offset = 0;
        let sinceLastTree = 0;
        
        // first lets generate some hills, plants and trees. Could have used perlin 
        // noise here but found a simple height adjusting flow was easier. Make it more likely
        // to raise the height of the ground until we reach max hill height (10), then switch
        // to making it more likely to move down until we reach the ground. Get nice flowing
        // hills this way.
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
                this.setTile(x, SKY_HEIGHT-i, 1, Layer.FOREGROUND);
            }
            this.setTile(x, SKY_HEIGHT-h, 2, Layer.FOREGROUND);
        
            // consider adding a plant or grass on top
            if (Math.random() < 0.2) {
                const grass = Math.floor(Math.random() * 4) + 9;
                this.setTile(x, SKY_HEIGHT-h-1, grass, Layer.FOREGROUND);
            } else if (Math.random() < 0.23) {
                const flower = Math.floor(Math.random() * 3) + 13;
                this.setTile(x, SKY_HEIGHT-h-1, flower, Layer.FOREGROUND);
            }
        
            // build a tree now and again
            if (Math.random() > 0.85) {
                if (sinceLastTree > 5) {
                    sinceLastTree = 0;
                    const heightOfTree = Math.floor(Math.random() * 3) + 2;
                    this.setTile(x, SKY_HEIGHT-h-1, 16, Layer.FOREGROUND);
                    for (let i=1;i<heightOfTree;i++) {
                        this.setTile(x, SKY_HEIGHT-h-1-i, 17, Layer.FOREGROUND);
                    }
        
                    for (let tx=-1;tx<2;tx++) {
                        for (let ty=-3;ty<0;ty++) {
                            this.setTile(x+tx, SKY_HEIGHT-h-heightOfTree+ty, 5, Layer.FOREGROUND);
                        }
                    }
                }
            }
        }
    
        // cut some caverns into the ground
        for (let i=0;i<100;i++) {
            this.placeSeam(0, 4, SKY_HEIGHT+5, MAP_DEPTH - 15, 5);
        }

        // now add some stone - quite a lot and across the whole depth
        for (let i=0;i<80;i++) {
            this.placeSeam(18, 3, SKY_HEIGHT+5, MAP_DEPTH - 15, 3);
        }
        // now add some coal - quite a lot and across the whole depth
        for (let i=0;i<60;i++) {
            this.placeSeam(19, 3, SKY_HEIGHT+5, MAP_DEPTH - 15, 3);
        }
        // now add some iron - less and only at 40 depth or deeper
        for (let i=0;i<40;i++) {
            this.placeSeam(20, 3, SKY_HEIGHT+40, MAP_DEPTH - 15, 3);
        }
        // now add some silver - less and only at 60 depth or deeper
        for (let i=0;i<30;i++) {
            this.placeSeam(21, 3, SKY_HEIGHT+60, MAP_DEPTH - 15, 2);
        }
        // now add some gold - less and only at 100 depth or deeper
        for (let i=0;i<30;i++) {
            this. placeSeam(22, 3, SKY_HEIGHT+100, MAP_DEPTH - 15, 2);
        }
        // now add some iron - even less and only at 150 depth or deeper
        for (let i=0;i<20;i++) {
            this.placeSeam(23, 3, SKY_HEIGHT+150, MAP_DEPTH - 15, 2);
        }

        this.save();
    }

    /**
     * Save the map to local storage in the browser
     */
    save(): void {
        // save the map to load storage
        localStorage.setItem("map", JSON.stringify(this.foreground));
        localStorage.setItem("mapbg", JSON.stringify(this.background));
    }
    
    /**
     * Utility to splat areas with tile to either cut out areas or place
     * minerals in organic shapes.
     * 
     * @param tile The tile to place
     * @param size The base size of the brush to use (this is randomized from this point)
     * @param upper The upper height limit
     * @param lower The lower height limit
     * @param cutBase The base number of cuts to make (this is randomized from this point)
     */
    private placeSeam(tile: number, size: number, upper: number, lower: number, cutBase: number): void {
        let x = 10 + Math.floor(Math.random() * (MAP_WIDTH - 20));
        let y = upper + Math.floor(Math.random() * (MAP_DEPTH - upper));
        const cutCount = cutBase + Math.floor(Math.random() * 5);
    
        // for each cut use the brush to apply the tile specified
        for (let cut=0;cut<cutCount;cut++) {
            const brushWidth = size + Math.floor(Math.random() * 2);
            const brushHeight = size + Math.floor(Math.random() * 2);
    
            let edges = [];
    
            // place the brush size tiles
            for (let bx = 0;bx<brushWidth;bx++) {
                for (let by=0;by<brushHeight;by++) {
                    // round the corners - i.e. don't draw them
                    if (bx === 0 && (by === 0 || by === brushHeight-1)) {
                        continue;
                    }
                    if (bx === brushWidth-1 && (by === 0 || by === brushHeight-1)) {
                        continue;
                    }
    
                    let tx = x + bx - Math.floor(brushWidth / 2);
                    let ty = y + by - Math.floor(brushHeight / 2);
    
                    // remember the edges of the brush
                    if ((bx === 0 || by === 0 || bx === brushHeight-1 || by === brushWidth -1)) {
                        if ((ty > SKY_HEIGHT + 5) && (ty < MAP_DEPTH - 15)) {
                            edges.push([tx, ty]);
                        }
                    }
    
                    // place the tiles
                    this.foreground[tx + (ty * MAP_WIDTH)] = tile;
                    this.background[tx + (ty * MAP_WIDTH)] = 1;
                }
            }
    
            if (edges.length === 0) {
                return;
            }
    
            // select an edge from the last cut and use it as a start point for
            // the next cut
            let nextCenter = edges[Math.floor(Math.random() * edges.length)];
            x = nextCenter[0];
            y = nextCenter[1];
        }
    }

    /**
     * Get all the map data for transmission or saving
     * 
     * @returns Foreground and background in a simple structure
     */
    getMapData(): { f: number[], b: number[] } {
        return { f: this.foreground, b: this.background };
    }
    
    /**
     * Set all the map data based on transmission or loading
     * 
     * @param data The foreground and background data
     */
    setMapData(data:  { f: number[], b: number[] }) {
        this.clear();
        this.foreground = data.f;
        this.background = data.b;
        this.refreshSpriteTileMap();
    
        this.setDiscovered(0, 0);
    }
    
    /**
     * Update the sprite cache for a particular cell
     * 
     * @param x The x coordinate of the cell to update
     * @param y The y coordinate of the cell to update
     */
    refreshSpriteTile(x: number, y: number) {
        const i = x + (y * MAP_WIDTH);
        const tile = tiles[this.foreground[i]]?.sprite;
        this.foregroundSpriteMap[i] = tile;
        const bg = tiles[this.background[i]]?.sprite;
        this.backgroundSpriteMap[i] = bg;
    }
    
    /**
     * Refresh all the sprites in the cache based on a new
     * data set
     */
    refreshSpriteTileMap(): void {
        for (let i=0;i<this.foreground.length;i++) {
            const tile = tiles[this.foreground[i]]?.sprite;
            this.foregroundSpriteMap[i] = tile;
            const bg = tiles[this.background[i]]?.sprite;
            this.backgroundSpriteMap[i] = bg;
        }
    }
    
    /**
     * Check if a particular location is discovered by the player
     * 
     * @param x The x coordinate to check
     * @param y The y coordinate to check
     * @returns True if the given location is discovered
     */
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
    
    /**
     * Indicate that a particular location has been discovered by a player. Normally
     * happens when a player clears a particular tile.
     * 
     * @param x The x coordinate to update
     * @param y The y coordinate to update
     * @param force Force the discovery loop even if the location was already discovered 
     */
    setDiscovered(x: number, y: number, force: boolean = false): void {
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return;
        }
    
        this.discoverImpl(x,y,force);
    }
    
    /**
     * Broke this out into a separate function since its unwinding what was a
     * recursive function. Running discovery across the whole map blows the stack
     * so use a local search array instead
     * 
     * @param x The x coordinate to update
     * @param y The y coordinate to update
     * @param force Force the discovery loop even if the location was already discovered 
     */
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
                const tile = tiles[this.getTile(x,y,Layer.FOREGROUND)];
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
    
    /**
     * Set the block/tile at a specific location
     * 
     * @param x The x coordinate to set the tile at
     * @param y The y coordinate to set the tile at 
     * @param tile The tile to set
     * @param layer The layer to set the tile on
     */
    setTile(x: number, y: number, tile: number, layer: Layer): void {
        x = Math.floor(x);
        y = Math.floor(y);
    
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return;
        }
    
        const before = this.foreground[x + (y * MAP_WIDTH)];
    
        if (layer === 0) {
            this.foreground[x + (y * MAP_WIDTH)] = tile;
            const sprite = tiles[tile]?.sprite;
            this.foregroundSpriteMap[x + (y * MAP_WIDTH)] = sprite;
    
            if (GAME.isHostingTheServer) {
                localStorage.setItem("map", JSON.stringify(this.foreground));
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
                const behind = this.getTile(x, y, Layer.BACKGROUND);
                if (behind === 0) {
                    const tile = tiles[before];
                    if (tile && tile.leaveBackground) {
                        this.setTile(x, y, before, Layer.BACKGROUND);
                    }
                }
            }
        }
    }
    
    /**
     * Check if the location specified has a ladder in
     * 
     * @param x The x coordinate to check
     * @param y The y coordinate to check
     * @returns True if the location has a ladder
     */
    isLadder(x: number, y: number): boolean {
        const tile1 = this.getTile(x,y,Layer.FOREGROUND);
        const tile2 = this.getTile(x,y,Layer.BACKGROUND);
        const def1 = tiles[tile1];
        const def2 = tiles[tile2];
        return (def1 && def1.ladder) || (!def1 && def2 && def2.ladder);
    }
    
    /**
     * Check if the location specified is blocked
     * 
     * @param x The x coordinate to check
     * @param y The y coordinate to check
     * @returns True if the location is blocked
     */
    isBlocked(x: number, y: number): boolean {
        const tile = this.getTile(x,y,Layer.FOREGROUND);
        const def = tiles[tile];
        return (def && def.blocks);
    }
    
    /**
     * Get the tile/block at a specified location
     * 
     * @param x The x coordinate to get
     * @param y The y coordinate to get
     * @param layer The layer to read from
     * @returns The tile at the given location and layer
     */
    getTile(x: number, y: number, layer: Layer): number {
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
    
        return this.foreground[x + (y * MAP_WIDTH)];
    }
    
    /**
     * Render the section of the map thats visible on the screen
     * 
     * @param g The graphics context on which to render
     * @param overX The x coordinate of the tile the mouse is over
     * @param overY The y coordinate of the tile the mouse is over
     * @param canAct True if the player can act on the tiles
     * @param screenX The x coordinate of the top left of the screen in world coordinate space
     * @param screenY The y coordinate of the top left of the screen in world coordinate space
     * @param screenWidth The width of the screen in world coordinate space
     * @param screenHeight The height of the screen in world coordinate space
     */
    render(g: CanvasRenderingContext2D, overX: number, overY: number, canAct: boolean, 
                              screenX: number, screenY: number, screenWidth: number, screenHeight: number) {
        const height = this.foreground.length / MAP_WIDTH;
    
        // if we haven't seen the discovery and background tiles yet then
        // look them up so they can be used in rendering
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
        
        const xp = Math.floor(screenX / TILE_SIZE) - 1;
        const yp = Math.floor(screenY / TILE_SIZE) - 1;
        const tilesAcross = Math.floor(screenWidth / TILE_SIZE) + 3;
        const tilesDown = Math.floor(screenHeight / TILE_SIZE) + 3;
        
        // loop through all the tiles on the screen and draw them if needed
        for (let x=xp;x<xp+tilesAcross;x++) {
            for (let y=yp;y<yp+tilesDown;y++) {
                if (this.isDiscovered(x,y)) {
                    const bg = this.backgroundSpriteMap[x + (y * MAP_WIDTH)];
                    if (bg) {
                        g.drawImage(bg, x * TILE_SIZE, y * TILE_SIZE);
                        let overhang = this.getTile(x, y-1, Layer.FOREGROUND);
                        g.drawImage(overhang ? this.backingTopTile : this.backingTile, x * TILE_SIZE, y * TILE_SIZE);
                    }
                    const sprite = this.foregroundSpriteMap[x + (y * MAP_WIDTH)];
                    if (sprite) {
                        g.drawImage(sprite, x * TILE_SIZE, y * TILE_SIZE);
                    }
    
                    // draw the mouse highlight
                    if (x === overX && y === overY && canAct) {
                        g.fillStyle = "rgba(255, 255, 255, 0.3)";
                        g.fillRect(x* TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }
    
        // loop through all the tiles and cover up areas that haven't been discovered yet
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
