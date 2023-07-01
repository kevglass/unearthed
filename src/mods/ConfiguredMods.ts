import { Game } from "src/Game";
import { GameContext, MobContext, ServerMod } from "./Mods";
import { loadImageFromUrl, loadSfxFromUrl, playSfx } from "src/engine/Resources";
import { Block, BLOCKS } from "src/Block";
import { DEFAULT_INVENTORY } from "src/InventItem";
import { Layer, MAP_DEPTH, MAP_WIDTH, TILE_SIZE } from "src/Map";
import { Mob } from "src/Mob";

/**
 * A wrapper around the main Game that can then be exposed to mods.
 */
export class GameAsContext implements GameContext {
    /** The game being wrapped */
    game: Game;
    /** The mod currently being processed */
    currentMod: ModRecord | undefined;

    constructor(game: Game) {
        this.game = game;
    }

    getMetaDataBlob(): any {
        if (this.currentMod) {
            return this.game.gameMap.metaData.modData[this.currentMod.mod.id];
        }
    }

    setMetaDataBlob(blob: any): void {
        if (this.currentMod) {
            this.game.gameMap.metaData.modData[this.currentMod.mod.id];
            this.game.network.sendMetaData(this.game.gameMap.metaData);
        }
    }

    /**
     * @see GameContext.error
     */
    error(e: any): void {
        if (this.currentMod) {
            console.error("[" + this.currentMod.mod.name + "] Error!!!");
        } else {
            console.error("[UNKNOWN MOD] Error!!!");
        }
        console.error(e);
    }

    /**
     * @see GameContext.log
     */
    log(message: string) {
        if (this.currentMod) {
            console.info("[" + this.currentMod.mod.name + "] " + message);
        } else {
            console.info("[UNKNOWN MOD] " + message);
        }
    }

    /**
     * @see GameContext.getModResource
     */
    getModResource(name: string): string {
        this.log("Getting resources: " + name);
        if (!this.currentMod?.resources[name]) {
            this.log(" === RESOURCE NOT FOUND ");
        }
        return this.currentMod?.resources[name] ?? "unknown image " + name;
    }

    /**
     * @see GameContext.addImage
     */
    addImage(id: string, data: string): void {
        this.log("Replacing image: " + id);
        loadImageFromUrl(id, "data:image/jpeg;base64," + data);
    }

    /**
     * @see GameContext.addAudio
     */
    addAudio(id: string, data: string): void {
        this.log("Replacing sound effect: " + id);
        loadSfxFromUrl(id, "data:audio/mpeg;base64," + data);
    }

    /**
     * @see GameContext.addBlock
     */
    addBlock(value: number, tileDef: Block): void {
        BLOCKS[value] = tileDef;
    }

    /**
     * @see GameContext.addTool
     */
    addTool(image: string, place: number, toolId: string, emptySpace: boolean): void {
        this.log("Adding tool: " + toolId + " (targetEmpty=" + emptySpace + ")");

        DEFAULT_INVENTORY.push({
            sprite: image,
            place: place,
            spriteOffsetX: -70,
            spriteOffsetY: -130,
            spriteScale: 0.7,
            toolId: toolId,
            targetEmpty: emptySpace
        });

        this.game.mobs.forEach(m => m.initInventory());
    }

    /**
     * @see GameContext.setBlock
     */
    setBlock(x: number, y: number, layer: Layer, blockId: number): void {
        this.game.network.sendNetworkTile(undefined, x, y, blockId, layer);
    }

    /**
     * @see GameContext.getBlock
     */
    getBlock(x: number, y: number, layer: Layer): number {
        return this.game.gameMap.getTile(x, y, layer);
    }

    /**
     * @see GameContext.getLocalPlayer
     */
    getLocalPlayer(): MobContext {
        return this.game.player;
    }

    /**
     * @see GameContext.getMobs
     */
    getMobs(): MobContext[] {
        return this.game.mobs;
    }

    /**
     * @see GameContext.playSfx
     */
    playSfx(id: string, volume: number): void {
        playSfx(id, volume);
    }

    /**
     * Start using this context for the mod specified. 
     * 
     * @param mod The mod we're taking actions for
     */
    startContext(mod: ModRecord) {
        this.currentMod = mod;
    }

    /**
     * End the use of this context with the current mod
     */
    endContext() {
        this.currentMod = undefined;
    }

    /**
     * @see GameContext.displayChat
     */
    displayChat(message: string): void {
        if (this.currentMod) {
            this.game.network.sendChatMessage(this.currentMod.mod.chatName ?? this.currentMod.mod.name, message);
        }
    }

    /**
     * @see GameContext.addParticlesAtTile
     */
    addParticlesAtTile(image: string, x: number, y: number, count: number): void {
        this.addParticlesAtPos(image, (x + 0.5) * TILE_SIZE, (y+0.5) * TILE_SIZE, count);
    }

    /**
     * @see GameContext.addParticlesAtPos
     */
    addParticlesAtPos(image: string, x: number, y: number, count: number): void {
        this.game.network.sendParticles(image, x, y, count);
    }
}

/**
 * A local holder for the mod. This lets us store the resource cache that they've
 * added and the whether a mod has been initialized yet.
 */
export interface ModRecord {
    /** The modification implementation configured */
    mod: ServerMod;
    /** The resources map from filename to either string (for JS and JSON) or base64 encoding (for binary resources) */
    resources: Record<string, string>;
    /** True if this mod has been intialized */
    inited: boolean;
}

/**
 * A composite class that contains all the mods that have been uploaded and configured. It's responsible
 * for taking game events and forwarding them safely into mods.
 */
export class ConfiguredMods {
    /** The list of mods configured */
    mods: ModRecord[] = [];
    /** The game thats being modified  */
    game: Game;
    /** A context that can be passed to mods to allow them to modify the game */
    context: GameAsContext;

    constructor(game: Game) {
        this.game = game;
        this.context = new GameAsContext(game);
    }

    /**
     * Check the current thread is in the context of a mod at the moment. Some cross
     * checks are disabled when a mod is taking actions.
     * 
     * @returns True if we're in the context of a mod at the moment
     */
    inModContext(): boolean {
        return this.context.currentMod !== undefined;
    }

    /**
     * Initialize and mods that haven't yet had their start called.
     */
    init(): void {
        for (const record of this.mods) {
            if (record.mod.onGameStart && !record.inited) {
                record.inited = true;
                try {
                    this.context.startContext(record);
                    this.context.log("Init");
                    record.mod.onGameStart(this.context);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Notify all mods that are interested that the world has started
     */
    worldStarted(): void {
        for (const record of this.mods) {
            if (record.mod.onWorldStart) {
                try {
                    this.context.startContext(record);
                    record.mod.onWorldStart(this.context);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Called once per frame to give all mods a chance to run
     */
    tick(): void {
        for (const record of this.mods) {
            if (record.mod.onTick) {
                try {
                    this.context.startContext(record);
                    record.mod.onTick(this.context);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Notify all interested mods that a mob has pressed their trigger
     * 
     * @param mob The mob pressing the trigger
     * @param x The x coordinate of the tile that is triggered
     * @param y The y coordinate of the tile that is triggered
     */
    trigger(mob: Mob, x: number, y: number): void {
        for (const record of this.mods) {
            if (record.mod.onTrigger) {
                try {
                    this.context.startContext(record);
                    record.mod.onTrigger(this.context, mob, x, y);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Notify all interested mods that a tile has been changed int he world
     * 
     * @param mob The mob making the change if any. (if a mod was making the change, there is no mob)
     * @param x The x coordinate of the location thats changed (in tiles)
     * @param y The y coordinate of the location thats changed (in tiles)
     * @param layer The layer in which the change occurred (0=foreground, 1=background)
     * @param block The block thats been placed in the world (or zero for removal)
     * @param oldBlock The block that was in the world before (or zero for none)
     */
    tile(mob: Mob | undefined, x: number, y: number, layer: number, block: number, oldBlock: number): void {
        for (const record of this.mods) {
            if (record.mod.onSetTile) {
                try {
                    this.context.startContext(record);
                    record.mod.onSetTile(this.context, mob, x, y, layer, block, oldBlock);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Notify all interested mods that a tool has been used on a location
     * 
     * @param mob The mob using the tool.
     * @param x The x coordinate of the tool's target (in tiles)
     * @param y The y coordinate of the tool's target (in tiles)
     * @param layer The layer in which tool's targeted (0=foreground, 1=background)
     * @param tool The ID of the tool being used
     */
    tool(mob: Mob | undefined, x: number, y: number, layer: number, tool: string): void {
        console.log("using tool: " + tool);
        for (const record of this.mods) {
            if (record.mod.onUseTool) {
                try {
                    this.context.startContext(record);
                    record.mod.onUseTool(this.context, mob, x, y, layer, tool);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Look for any mod that can generate worlds. If we find one let it generate the world
     * then return. i.e. the first world generating mod wins.
     * 
     * @returns True if a mod was found or false to use default generation
     */
    generate(): boolean {
        for (const record of this.mods) {
            if (record.mod.generateWorld) {
                try {
                    this.context.startContext(record);
                    this.context.log("Generating World...");
                    record.mod.generateWorld(this.context, MAP_WIDTH, MAP_DEPTH);
                    this.context.endContext();

                    return true;
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }

        return false;
    }

    /**
     * Notify all interested mods that a mob has been blocked moving horizontally
     * 
     * @param mob The mob being blocked
     * @param x The x coordinate of the tile blocking
     * @param y The y coordinate of the tile blocking
     */
    blocked(mob: Mob, x: number, y: number): void {
        for (const record of this.mods) {
            if (record.mod.onBlockedBy) {
                try {
                    this.context.startContext(record);
                    record.mod.onBlockedBy(this.context, mob, x, y);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Notify all interested mods that a mob has been blocked moving up
     * 
     * @param mob The mob being blocked
     * @param x The x coordinate of the tile blocking
     * @param y The y coordinate of the tile blocking
     */
    hitHead(mob: Mob, x: number, y: number): void {
        for (const record of this.mods) {
            if (record.mod.onHitHead) {
                try {
                    this.context.startContext(record);
                    record.mod.onHitHead(this.context, mob, x, y);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

    /**
     * Notify all interested mods that a mob has been blocked moving down
     * 
     * @param mob The mob being blocked
     * @param x The x coordinate of the tile blocking
     * @param y The y coordinate of the tile blocking
     */
    standing(mob: Mob, x: number, y: number): void {
        for (const record of this.mods) {
            if (record.mod.onStandOn) {
                try {
                    this.context.startContext(record);
                    record.mod.onStandOn(this.context, mob, x, y);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }
}