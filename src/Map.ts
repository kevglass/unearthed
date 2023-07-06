import { getSprite, playSfx } from "./engine/Resources";
import { Game } from "./Game";
import { addParticle, createDirtParticle } from "./engine/Particles";
import { Graphics, GraphicsImage, GraphicsType, HtmlGraphics } from "./engine/Graphics";
import { Block, Portal, Timer, BLOCKS } from "./Block";

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

for (let i = 0; i < MAP_WIDTH * SKY_HEIGHT; i++) {
    DEFAULT_MAP.push(0);
}
for (let i = 0; i < MAP_WIDTH; i++) {
    DEFAULT_MAP.push(2);
}
const totalSize = (MAP_DEPTH * MAP_WIDTH) - DEFAULT_MAP.length;
for (let i = 0; i < totalSize; i++) {
    DEFAULT_MAP.push(1);
}

export interface GameMapMetaData {
    /** A list of all portals */
    portals: Portal[];
    /** Data that mods have stored */
    modData: Record<string, any>;
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
    /** The light map associated with this map */
    lightMap: number[] = [];
    /** Map of which tiles have been discovered on this map */
    discovered: boolean[] = [];
    /** True if we're using discovery to black out areas the player hasn't seen yet - turn it off to check cavern generation */
    discoveryEnabled = true;
    /** A list of all running timers */
    timers: Timer[] = [];
    /** The tile used to darken background tiles */
    backingTile?: GraphicsImage;
    /** The tile used to darken background tiles where they have an overhand and need a shadow */
    backingTopTile?: GraphicsImage;
    /** The collection of images that can be used to black out undiscovered areas - these vary to make the black not uniform */
    undiscovered: GraphicsImage[] = [];
    /** The central game controller */
    game: Game;
    /** The meta data associated with this map */
    metaData: GameMapMetaData = {
        portals: [],
        modData: {}
    };
    /** The light overall image */
    lightingImage?: HTMLCanvasElement;
    /** The light map rendered pixel per tile */
    lightMapImage?: HTMLCanvasElement;
    /** The last location we have rendered a light map for */
    lastLightMapX = 0;
    /** The last location we have rendered a light map for */
    lastLightMapY = 0;
    /** The temporary light map image for frame by frame updates */
    tempLightImage?: HTMLCanvasElement;
    /** True fi the light map is dirty */
    lightMapDirty: boolean = true;
    /** True if we're currenting generating the map */
    generating: boolean = false;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * Reset the map to a newly generated one
     */
    reset() {
        console.log("Reset map");
        this.clear();
        this.generating = true;
        if (!this.game.mods.generate()) {
            this.defaultGenerate();
        }
        this.generating = false;
        this.resetDiscoveryAndLights();

        this.save();
    }

    resetDiscoveryAndLights(): void {
        this.lightMap = [];
        this.discovered = [];

        for (let i = 0; i < DEFAULT_MAP.length; i++) {
            this.lightMap.push(1);
            this.discovered.push(false);
        }

        this.setDiscovered(0, 0);
        this.refreshFullLightMap();
    }

    /**
     * Check if we're current generating the map. In this case we're allowed
     * to set tiles ignoring other checks
     * 
     * @returns True if we're generating the map at the moment
     */
    isGenerating(): boolean {
        return this.generating;
    }

    /**
     * Clear the map resetting it to the default state
     */
    clear() {
        this.foreground = [];
        this.background = [];
        this.discovered = [];
        this.lightMap = [];
        this.timers = [];
        this.metaData = {
            portals: [],
            modData: {}
        };
        for (let i = 0; i < DEFAULT_MAP.length; i++) {
            this.foreground.push(0);
            this.background.push(0);
            this.lightMap.push(1);
            this.discovered.push(false);
        }
    }

    private clearOnSet() {
        this.lightMap = [];
        this.discovered = [];
        for (let i = 0; i < DEFAULT_MAP.length; i++) {
            this.lightMap.push(1);
            this.discovered.push(false);
        }
    }

    /**
     * Set the lighting at a given tile
     * 
     * @param x The x coordinate of the light to place
     * @param y The y coordinate of the light to place
     * @param light The light
     * @returns 
     */
    setLightMap(x: number, y: number, light: number): void {
        x = Math.floor(x);
        y = Math.floor(y);

        if ((x < 0) || (x >= MAP_WIDTH)) {
            return;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return;
        }

        this.lightMap[x + (y * MAP_WIDTH)] = light;
    }

    getLightMap(x: number, y: number): number {
        x = Math.floor(x);
        y = Math.floor(y);

        if ((x < 0) || (x >= MAP_WIDTH)) {
            return y > SKY_HEIGHT ? 0 : 1;
        }
        if (y < 0) {
            return 1;
        }
        if (y >= MAP_DEPTH) {
            return 0;
        }

        return this.lightMap[x + (y * MAP_WIDTH)];
    }

    private fillLightFrom(x: number, y: number, value: number, force: boolean = false) {
        if ((x < 0) || (x >= MAP_WIDTH)) {
            return;
        }
        if (y < 0 || y >= MAP_DEPTH) {
            return;
        }
        if (value <= 0) {
            return;
        }
        const current = this.getLightMap(x, y);


        if (current < value || force) {
            this.setLightMap(x, y, value);

            const tile = BLOCKS[this.getTile(x, y, Layer.FOREGROUND)];
            if (tile && tile.blocksLight) {
                return;
            }

            const originalValue = value;
            value -= 0.1;
            if (value > 0) {
                this.fillLightFrom(x - 1, y - 1, value);
                this.fillLightFrom(x - 1, y, originalValue - 0.05);
                this.fillLightFrom(x - 1, y + 1, value);

                this.fillLightFrom(x, y - 1, value);
                this.fillLightFrom(x, y + 1, value);

                this.fillLightFrom(x + 1, y - 1, value);
                this.fillLightFrom(x + 1, y, originalValue - 0.05);
                this.fillLightFrom(x + 1, y + 1, value);
            }
        }
    }

    /**
     * Refresh the full light map of the game
     */
    refreshFullLightMap(): void {
        this.lightMapDirty = true;
        this.lightMap = [];
        for (let i = 0; i < this.foreground.length; i++) {
            this.lightMap.push(0);
        }

        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_DEPTH; y++) {
                this.setLightMap(x, y, 1);

                const tile = BLOCKS[this.getTile(x, y, Layer.FOREGROUND)];
                if (tile && tile.blocksLight) {
                    break;
                }
            }
        }
        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_DEPTH; y++) {
                const tile = this.getTile(x, y, Layer.FOREGROUND);
                const block = BLOCKS[tile];
                if (block && block.light) {
                    this.setLightMap(x, y, 1);
                }
            }
        }

        for (let x = 0; x < MAP_WIDTH; x++) {
            for (let y = 0; y < MAP_DEPTH; y++) {
                this.fillLightFrom(x, y, this.getLightMap(x, y), true);
            }
        }
    }

    saveMetaData(): void {
        if (this.game.isHostingTheServer) {
            localStorage.setItem("mapmeta", JSON.stringify(this.metaData));
            if (this.game.network && this.game.network.connected()) {
                this.game.network.sendMetaData(this.metaData);
            }
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
        const existingMeta = localStorage.getItem("mapmeta");
        if (existingMap) {
            const savedMap = JSON.parse(existingMap);
            if (savedMap.length >= DEFAULT_MAP.length) {
                this.foreground = savedMap;

                if (existingBG) {
                    const savedMap = JSON.parse(existingBG);
                    if (savedMap.length >= DEFAULT_MAP.length) {
                        this.background = savedMap;
                    }

                    if (existingMeta) {
                        Object.assign(this.metaData, JSON.parse(existingMeta));
                    }
                }

                return true;
            }
        }

        return false;
    }

    /**
     * Generate a new map 
     */
    defaultGenerate() {
        console.log("Generating map");

        this.foreground = [...DEFAULT_MAP];
        // map generation
        let h = 0;
        let offset = 0;
        let sinceLastTree = 0;

        // first lets generate some hills, plants and trees. Could have used perlin 
        // noise here but found a simple height adjusting flow was easier. Make it more likely
        // to raise the height of the ground until we reach max hill height (10,then switch
        // to making it more likely to move down until we reach the ground. Get nice flowing
        // hills this way.
        for (let x = 5; x < MAP_WIDTH; x++) {
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
            for (let i = 0; i < h; i++) {
                this.setTile(x, SKY_HEIGHT - i, 1, Layer.FOREGROUND);
            }
            this.setTile(x, SKY_HEIGHT - h, 2, Layer.FOREGROUND);

            // consider adding a plant or grass on top
            if (Math.random() < 0.2) {
                const grass = Math.floor(Math.random() * 4) + 9;
                this.setTile(x, SKY_HEIGHT - h - 1, grass, Layer.FOREGROUND);
            } else if (Math.random() < 0.23) {
                const flower = Math.floor(Math.random() * 3) + 13;
                this.setTile(x, SKY_HEIGHT - h - 1, flower, Layer.FOREGROUND);
            }

            // build a tree now and again
            if (Math.random() > 0.85) {
                if (sinceLastTree > 5) {
                    sinceLastTree = 0;
                    const heightOfTree = Math.floor(Math.random() * 3) + 2;
                    this.setTile(x, SKY_HEIGHT - h - 1, 16, Layer.FOREGROUND);
                    for (let i = 1; i < heightOfTree; i++) {
                        this.setTile(x, SKY_HEIGHT - h - 1 - i, 17, Layer.FOREGROUND);
                    }

                    for (let tx = -1; tx < 2; tx++) {
                        for (let ty = -3; ty < 0; ty++) {
                            this.setTile(x + tx, SKY_HEIGHT - h - heightOfTree + ty, 5, Layer.FOREGROUND);
                        }
                    }
                }
            }
        }

        // cut some caverns into the ground
        for (let i = 0; i < 100; i++) {
            this.placeSeam(0, 4, SKY_HEIGHT + 5, MAP_DEPTH - 15, 5);
        }

        // now add some stone - quite a lot and across the whole depth
        for (let i = 0; i < 80; i++) {
            this.placeSeam(18, 3, SKY_HEIGHT + 5, MAP_DEPTH - 15, 3);
        }
        // now add some coal - quite a lot and across the whole depth
        for (let i = 0; i < 60; i++) {
            this.placeSeam(19, 3, SKY_HEIGHT + 5, MAP_DEPTH - 15, 3);
        }
        // now add some iron - less and only at 40 depth or deeper
        for (let i = 0; i < 40; i++) {
            this.placeSeam(20, 3, SKY_HEIGHT + 40, MAP_DEPTH - 15, 3);
        }
        // now add some silver - less and only at 60 depth or deeper
        for (let i = 0; i < 30; i++) {
            this.placeSeam(21, 3, SKY_HEIGHT + 60, MAP_DEPTH - 15, 2);
        }
        // now add some gold - less and only at 100 depth or deeper
        for (let i = 0; i < 30; i++) {
            this.placeSeam(22, 3, SKY_HEIGHT + 100, MAP_DEPTH - 15, 2);
        }
        // now add some iron - even less and only at 150 depth or deeper
        for (let i = 0; i < 20; i++) {
            this.placeSeam(23, 3, SKY_HEIGHT + 150, MAP_DEPTH - 15, 2);
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
        this.saveMetaData();
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
        for (let cut = 0; cut < cutCount; cut++) {
            const brushWidth = size + Math.floor(Math.random() * 2);
            const brushHeight = size + Math.floor(Math.random() * 2);

            let edges = [];

            // place the brush size tiles
            for (let bx = 0; bx < brushWidth; bx++) {
                for (let by = 0; by < brushHeight; by++) {
                    // round the corners - i.e. don't draw them
                    if (bx === 0 && (by === 0 || by === brushHeight - 1)) {
                        continue;
                    }
                    if (bx === brushWidth - 1 && (by === 0 || by === brushHeight - 1)) {
                        continue;
                    }

                    let tx = x + bx - Math.floor(brushWidth / 2);
                    let ty = y + by - Math.floor(brushHeight / 2);

                    // remember the edges of the brush
                    if ((bx === 0 || by === 0 || bx === brushHeight - 1 || by === brushWidth - 1)) {
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
    setMapData(data: { f: number[], b: number[] }) {
        this.clear();
        this.foreground = data.f;
        this.background = data.b;

        this.resetDiscoveryAndLights();
    }

    /**
     * Set the foreground tiles from the network
     * 
     * @param f The array of data from the network
     */
    setForegroundMapData(f: number[]) {
        this.clearOnSet();
        this.foreground = f;

        this.resetDiscoveryAndLights();
    }

    /**
     * Set the background tiles from the network
     * 
     * @param b The array of data from the network
     */
    setBackgroundMapData(b: number[]) {
        this.clearOnSet();
        this.background = b;
        
        this.resetDiscoveryAndLights();
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

        this.discoverImpl(x, y, force);
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
        toCheck.push({ x: xp, y: yp });

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
                const tile = BLOCKS[this.getTile(x, y, Layer.FOREGROUND)];
                if (!tile || !tile.blocks || !tile.blocksDiscovery) {
                    toCheck.push({ x: x - 1, y: y });
                    toCheck.push({ x: x - 1, y: y - 1 });
                    toCheck.push({ x: x - 1, y: y + 1 });

                    toCheck.push({ x: x + 1, y: y - 1 });
                    toCheck.push({ x: x + 1, y: y });
                    toCheck.push({ x: x + 1, y: y + 1 });

                    toCheck.push({ x: x, y: y - 1 });
                    toCheck.push({ x: x, y: y + 1 });
                }
            }

            force = false;
        }
    }

    private saveMap(): void {
        if (!this.generating) {
            if (this.game.isHostingTheServer) {
                localStorage.setItem("map", JSON.stringify(this.foreground));
            }
            if (this.game.isHostingTheServer) {
                localStorage.setItem("mapbg", JSON.stringify(this.background));
            }
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
    setTile(x: number, y: number, tile: number, layer: Layer, applyLeaveBackground: boolean = true): void {
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

            this.saveMap();
            if (tile === 0 && !this.generating) {
                this.setDiscovered(x, y, true);
            }
        } else if (layer === 1) {
            this.background[x + (y * MAP_WIDTH)] = tile;
            this.saveMap();
        }

        // Remove any timers on this tile
        this.timers = this.timers.filter(timer => timer.layer !== layer || timer.tileIndex !== x + (y * MAP_WIDTH));

        // Remove any portals on this tile
        this.metaData.portals = this.metaData.portals.filter(portal => portal.tileIndex !== x + (y * MAP_WIDTH));
        if (this.game.isHostingTheServer) {
            this.saveMetaData();
        }

        // Add metadata for the placed block
        const tileDef = BLOCKS[tile];
        if (tileDef) {
            if (tileDef.timer) {
                this.timers.push({
                    tileIndex: x + (y * MAP_WIDTH),
                    layer,
                    timer: tileDef.timer.timer,
                    callback: tileDef.timer.callback,
                });
            }

            if (tileDef.portal) {
                this.metaData.portals.push({
                    tileIndex: x + (y * MAP_WIDTH),
                    code: null,
                });
                if (this.game.isHostingTheServer) {
                    this.saveMetaData();
                }
            }
        }

        if (tile === 0) {
            const above = this.getTile(x, y - 1, layer);
            const tile = BLOCKS[above];
            if (tile && tile.needsGround) {
                this.setTile(x, y - 1, 0, layer);
            }

            if (layer === 0) {
                const behind = this.getTile(x, y, Layer.BACKGROUND);
                if (behind === 0) {
                    const tile = BLOCKS[before];
                    if (tile && tile.leaveBackground && applyLeaveBackground) {
                        this.setTile(x, y, before, Layer.BACKGROUND);
                    }
                }
            }
        }

        if (!this.generating) {
            this.refreshFullLightMap();
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
        const tile1 = this.getTile(x, y, Layer.FOREGROUND);
        const tile2 = this.getTile(x, y, Layer.BACKGROUND);
        const def1 = BLOCKS[tile1];
        const def2 = BLOCKS[tile2];
        return (def1 && def1.ladder) || (!def1 && def2 && def2.ladder);
    }

    /**
     * Check if the location specified has a platform in
     * 
     * @param x The x coordinate to check
     * @param y The y coordinate to check
     * @returns True if the location has a platform
     */
    isPlatform(x: number, y: number): boolean {
        const tile = BLOCKS[this.getTile(x, y, Layer.FOREGROUND)];
        return (tile && !tile.blocks && tile.blocksDown);
    }

    /**
     * Check if the location specified is blocked
     * 
     * @param x The x coordinate to check
     * @param y The y coordinate to check
     * @returns True if the location is blocked
     */
    isBlocked(x: number, y: number, down?: boolean): boolean {
        const tile = this.getTile(x, y, Layer.FOREGROUND);
        const def = BLOCKS[tile];
        return def && (def.blocks || (down === true && def.blocksDown));
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
            return this.background[x + (y * MAP_WIDTH)];
        }

        return this.foreground[x + (y * MAP_WIDTH)];
    }

    updateTimers(): void {
        this.timers.forEach(timer => {
            timer.timer--;
            if (timer.timer <= 0) {
                timer.callback(this, timer);
            }
        });
        this.timers = this.timers.filter(timer => timer.timer > 0);
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
    render(g: Graphics, overX: number, overY: number, canAct: boolean,
        screenX: number, screenY: number, screenWidth: number, screenHeight: number) {
        const height = this.foreground.length / MAP_WIDTH;

        // if we haven't seen the discovery and background tiles yet then
        // look them up so they can be used in rendering
        if (!this.backingTile) {
            this.backingTile = getSprite("tiles/backing");
        }
        if (!this.backingTopTile) {
            this.backingTopTile = getSprite("tiles/backingtop");
        }
        if (this.undiscovered.length === 0) {
            this.undiscovered.push(getSprite("tiles/undiscovered1"));
            this.undiscovered.push(getSprite("tiles/undiscovered2"));
            this.undiscovered.push(getSprite("tiles/undiscovered3"));
            this.undiscovered.push(getSprite("tiles/undiscovered4"));
        }

        const xp = Math.floor(screenX / TILE_SIZE) - 1;
        const yp = Math.floor(screenY / TILE_SIZE) - 1;
        const tilesAcross = Math.floor(screenWidth / TILE_SIZE) + 3;
        const tilesDown = Math.floor(screenHeight / TILE_SIZE) + 3;


        // loop through all the tiles on the screen and draw them if needed
        for (let x = xp; x < xp + tilesAcross; x++) {
            for (let y = yp; y < yp + tilesDown; y++) {
                if (this.isDiscovered(x, y)) {
                    const bg = BLOCKS[this.getTile(x, y, Layer.BACKGROUND)]?.sprite;
                    if (bg) {
                        g.drawImage(getSprite(bg), x * TILE_SIZE, y * TILE_SIZE);
                        if (this.isPlatform(x, y)) {
                            g.drawImage(this.backingTopTile, x * TILE_SIZE, y * TILE_SIZE);
                        } else {
                            let overhang = this.getTile(x, y - 1, Layer.FOREGROUND);
                            const tileAbove = BLOCKS[overhang];
                            if (tileAbove && !tileAbove.blocksDown) {
                                overhang = 0;
                            }
                            g.drawImage(overhang && !this.isPlatform(x, y - 1) ? this.backingTopTile : this.backingTile, x * TILE_SIZE, y * TILE_SIZE);
                        }
                    }
                    const sprite = BLOCKS[this.getTile(x, y, Layer.FOREGROUND)]?.sprite;
                    if (sprite) {
                        g.drawImage(getSprite(sprite), x * TILE_SIZE, y * TILE_SIZE);
                    }

                    // draw the mouse highlight
                    if (x === overX && y === overY && canAct) {
                        g.setFillColor(255, 255, 255, .3);
                        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        g.setFillColor(255, 255, 255, 1);
                    }
                }
            }
        }

        // loop through all the tiles and cover up areas that haven't been discovered yet
        for (let x = xp; x < xp + tilesAcross; x++) {
            for (let y = yp; y < yp + tilesDown; y++) {
                if (!this.isDiscovered(x, y)) {
                    g.drawImage(this.undiscovered[(x + y) % this.undiscovered.length], (x * TILE_SIZE) - (TILE_SIZE / 2), (y * TILE_SIZE) - (TILE_SIZE / 2));
                }
            }
        }

        // render portal codes
        this.metaData.portals.forEach(portal => {
            g.setTextAlign("center");
            g.setFillColor(0, 0, 0, 1);
            g.setFont("40px KenneyFont");
            g.fillText(portal?.code ?? '', portal.tileIndex % MAP_WIDTH * TILE_SIZE + TILE_SIZE / 2, Math.floor(portal.tileIndex / MAP_WIDTH) * TILE_SIZE - 16);
        });
    }
	
	getDarkValue(x: number, y: number): number {
        // light all the mobs
        const lightDistance = TILE_SIZE * 3.75;
        let closestMobDistance = lightDistance * 2;
        for (const mob of this.game.mobs) {
            const dx = mob.x - ((x + 0.5) * TILE_SIZE);
            const dy = mob.y - ((y + 0.5) * TILE_SIZE);

            const dis = Math.sqrt((dx * dx) + (dy * dy));
            if (dis < closestMobDistance) {
                closestMobDistance = dis;
            }
        }

        let mobLight = 255;
        if (closestMobDistance < lightDistance) {
            mobLight = Math.floor((closestMobDistance / lightDistance) * 255);
        }

		return Math.floor(Math.min(mobLight, 255 - (this.getLightMap(x, y) * 255)));
	}

    drawLightMap(g: Graphics, overX: number, overY: number, canAct: boolean,
        screenX: number, screenY: number, screenWidth: number, screenHeight: number) {
        let lightScale = 1;
        const xp = Math.floor(screenX / TILE_SIZE) - 1;
        const yp = Math.floor(screenY / TILE_SIZE) - 1;
        const tilesAcross = Math.floor(screenWidth / TILE_SIZE) + 3
        const tilesDown = Math.floor(screenHeight / TILE_SIZE) + 3;
        const offsetx = screenX - (xp * TILE_SIZE);
        const offsety = screenY - (yp * TILE_SIZE);

        if (g.getType() === GraphicsType.WEBGL) {
            const px = Math.floor(this.game.player.x / TILE_SIZE);
            const py = Math.floor(this.game.player.y / TILE_SIZE);
			g.setFillColor(0, 0, 0, 1);
            for (let x = xp; x < xp + tilesAcross; x++) {
                for (let y = yp; y < yp + tilesDown; y++) {
                    g.fillRectWithCornerAlphas(
                        Math.floor(Math.floor(screenX - offsetx) + ((x - xp) + 0.5) * TILE_SIZE),
                        Math.floor(Math.floor(screenY - offsety) + ((y - yp) + 0.5) * TILE_SIZE),
                        TILE_SIZE,
                        TILE_SIZE,
                        this.getDarkValue(x, y), this.getDarkValue(x + 1, y),
                        this.getDarkValue(x, y + 1), this.getDarkValue(x + 1, y + 1)
                    );
                }
            }
            return;
        }

        if (g.getType() === GraphicsType.CANVAS) {
            // initialise any temporary storage for the light maps
            if (!this.lightingImage || this.lightingImage.width != tilesAcross * TILE_SIZE || this.lightingImage.height !== tilesDown * TILE_SIZE) {
                this.lightingImage = document.createElement("canvas");
                this.lightingImage.width = tilesAcross * TILE_SIZE;
                this.lightingImage.height = tilesDown * TILE_SIZE;
                this.tempLightImage = document.createElement("canvas");
                this.tempLightImage.width = tilesAcross * TILE_SIZE;
                this.tempLightImage.height = tilesDown * TILE_SIZE;
                this.lightMapDirty = true;
            }
            if (!this.lightMapImage || this.lightMapImage.width != tilesAcross || this.lightMapImage.height !== tilesDown) {
                this.lightMapImage = document.createElement("canvas");
                this.lightMapImage.width = tilesAcross;
                this.lightMapImage.height = tilesDown;
                this.lightMapDirty = true;
            }

            // only regenerate the whole light map if we've moved
            if (this.lastLightMapX !== xp || this.lastLightMapY !== yp) {
                this.lightMapDirty = true;
            }
            this.lastLightMapX = xp;
            this.lastLightMapY = yp;

            const context = new HtmlGraphics(this.lightingImage);

            if (this.lightMapDirty) {
                this.lightMapDirty = false;

                // render the light onto a pixel by pixel canvas, then scale it 
                // up to get soft transitions. In GL we would have done this with 
                // vertex colours but no such thing in pure Canvas
                const lightMapContext = new HtmlGraphics(this.lightMapImage);

                lightMapContext.clearRect(0, 0, this.lightMapImage.width, this.lightMapImage.height);
                lightMapContext.setCompositeOperation("source-over");
                lightMapContext.setFillColor(0, 0, 0, 1);
                for (let x = xp; x < xp + tilesAcross; x++) {
                    for (let y = yp; y < yp + tilesDown; y++) {
                        const tile = BLOCKS[this.getTile(x, y, Layer.FOREGROUND)];
                        const light = this.getLightMap(x, y);
                        lightMapContext.setGlobalAlpha(1 - light);
                        if (!this.isDiscovered(x, y)) {
                            lightMapContext.setGlobalAlpha(1);
                        }

                        lightMapContext.fillRect((x - xp) * lightScale, (y - yp) * lightScale, lightScale, lightScale);
                    }
                }

                // scale the light up
                context.clearRect(0, 0, this.lightingImage.width, this.lightingImage.height);
                context.save();
                context.scale(TILE_SIZE / lightScale, TILE_SIZE / lightScale);
                context.drawCanvasImage(lightMapContext, 0, 0);
                context.restore();

                context.save();

                // debug for light map
                // const debugSize = 20;
                // g.setFillColor(255, 255, 255, 1);
                // g.fillRect(screenX + 200, screenY + 200, tilesAcross * debugSize, tilesDown * debugSize);
                // g.drawScaledImage({get:()=>this.lightingImage} as unknown as GraphicsImage, screenX + 200, screenY + 200, tilesAcross * debugSize, tilesDown * debugSize);
            }


            if (this.tempLightImage) {
                // update anything that needs to be changed every frame and not only when we move from tile tile
                const context2 = new HtmlGraphics(this.tempLightImage);
                context2.clearRect(0, 0, this.tempLightImage.width, this.tempLightImage.height);

                context2.drawCanvasImage(context, 0, 0);
                const gradient = context2.createRadialGradient(0, 0, 0, 0, 0, 256);
                gradient.addColorStop(0, "rgba(0,0,0,255)");
                gradient.addColorStop(1, "rgba(0,0,0,0)");
                context2.save();
                context2.setCompositeOperation("destination-out");
                context2.setGradientFillStyle(gradient);
                context2.translate(this.game.player.x - (screenX - offsetx), this.game.player.y - (screenY - offsety));
                context2.beginPath();
                context2.arc(0, 0, 256, 0, Math.PI * 2);
                context2.fill();
                context2.restore();

                g.drawCanvasImage(context2, Math.floor(screenX - offsetx), Math.floor(screenY - offsety));
            }
        }
    }
}
