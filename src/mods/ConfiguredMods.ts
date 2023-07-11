import { Game } from "src/Game";
import { GameContext, GameProperty, MobContext, ServerMod, SkinDefinition } from "./Mods";
import { loadImageFromUrl, loadSfxFromUrl, playSfx } from "src/engine/Resources";
import { Block, BLOCKS } from "src/Block";
import { ALL_ITEMS, ItemDefinition } from "src/InventItem";
import { Layer, MAP_DEPTH, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE } from "src/Map";
import { Mob } from "src/Mob";
import { v4 as uuidv4 } from 'uuid';
import { SKINS, Skin, skinFromJson } from "src/Skins";
import { ALL_ANIM, animsFromJson } from "src/Animations";
import { Recipe } from "src/Recipe";

// define constants for mods to access
const global = window as any;

global.GameProperty = {
    ...GameProperty
}

global.Layer = {
    ...Layer
}

global.BLOCK_SIZE = TILE_SIZE;
global.MAP_WIDTH = MAP_WIDTH;
global.MAP_HEIGHT = MAP_DEPTH;
global.SKY_HEIGHT = SKY_HEIGHT;

/**
 * A wrapper around the main Game that can then be exposed to mods.
 */
export class GameAsContext implements GameContext {
    /** The game being wrapped */
    game: Game;
    /** The mod currently being processed */
    currentMod: ModRecord | undefined;
    /** The number of entries to this context */
    currentCount: number = 0;
    /** True if logging is enabled */
    logging: boolean = false;

    constructor(game: Game) {
        this.game = game;
    }

    /**
     * @see GameContext.takeItem
     */
    takeItem(mob: MobContext, count: number, typeId: string): void {
        (mob as Mob).removeItem(typeId, count);
    }

    /**
     * @see GameContext.giveItem
     */
    giveItem(mob: MobContext, count: number, typeId: string): void {
        (mob as Mob).addItem(typeId, count);
    }

    /**
     * @see GameContext.countItems
     */
    countItems(mob: MobContext, typeId: string): number {
        return (mob as Mob).getItemCount(typeId);
    }

    /**
     * @see GameContext.removeMob
     */
    createMob(name: string, skin: string, x: number, y: number, thinkFunction?: ((game: GameContext, mob: MobContext) => void) | undefined): MobContext {
        const mob = new Mob(this.game.network, this.game.gameMap, uuidv4(), name, false, skin, x, y, true);
        if (this.game.isHostingTheServer) {
            mob.thinkFunction = thinkFunction;
            this.game.mobs.push(mob);
        }

        return mob;
    }

    /**
     * @see GameContext.removeMob
     */
    removeMob(mob: MobContext) {
        if (this.game.isHostingTheServer) {
            this.game.mobs.splice(this.game.mobs.indexOf(mob as Mob), 1);
        }
    }

    /**
     * @see GameContext.setGameProperty
     */
    setGameProperty(prop: GameProperty, value: string | number | boolean): void {
        this.game.globalProperties[prop] = value;
    }

    /**
     * @see GameContext.getGameProperty
     */
    getGameProperty(prop: GameProperty): string | number | boolean {
        return this.game.globalProperties[prop];
    }

    enableLogging(l: boolean): void {
        this.logging = l;
    }

    /**
     * @see GameContext.getMetaDataBlob
     */
    getMetaDataBlob(): any {
        if (this.currentMod) {
            return this.game.gameMap.metaData.modData[this.currentMod.mod.id];
        }
    }

    /**
     * @see GameContext.log
     */
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
        if (!this.logging) {
            return;
        }

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
        if (this.isHost() || !name.endsWith(".bin")) {
            this.log("Getting resources: " + name);
            if (!this.currentMod?.resources[name]) {
                this.log(" === RESOURCE NOT FOUND ");
            }
        }
        return this.currentMod?.resources[name] ?? "unknown resource: " + name;
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
     * @see GameContext.addSkinFromFile
     */
    addSkinFromFile(name: string, skinDef: string): void {
        try {
            const data = JSON.parse(skinDef);
            this.addSkin(name, data);
        } catch (e) {
            this.error("Invalid skin file specified - invalid JSON?");
            this.error(e);
        }
    }

    /**
     * @see GameContext.addSkinFromData
     */
    addSkin(name: string, skinDef: SkinDefinition): void {
        try {
            const skin = skinFromJson(skinDef);
            const anims = animsFromJson(skinDef);

            // parsed everything so now we can assign
            SKINS[name] = skin;
            ALL_ANIM[name] = anims;

            if (this.currentMod) {
                this.currentMod.skinsAdded.push(SKINS[name]);
            }
        } catch (e) {
            this.error("Invalid skin file specified - invalid JSON?");
            this.error(e);
        }
    }

    /**
     * @see GameContext.addRecipe
     */
    addRecipe(id: string, recipeDef: Recipe): void {
        if (this.currentMod) {
            this.currentMod.recipesAdded.push(recipeDef);
        }
        // remove any existing recipe by this name
        this.removeRecipe(id);

        recipeDef.id = id;
        this.game.recipes.push(recipeDef);
    }

    /**
     * @see GameContext.removeRecipe
     */
    removeRecipe(id: string): void {
        const existing = this.game.recipes.find(r => r.id === id);
        if (existing) {
            this.game.recipes.splice(this.game.recipes.indexOf(existing), 1);
        }
    }

    /**
     * @see GameContext.addBlock
     */
    addBlock(value: number, tileDef: Block): void {
        if (value > 255 * 255) {
            throw "Can't use block numbers greater than 64k";
        }
        if (this.currentMod) {
            this.currentMod.blocksAdded.push(tileDef);
        }

        if (BLOCKS[value]) {
            this.log("Replacing block definition for block ID = " + value);
        }

        BLOCKS[value] = tileDef;
    }

    /**
     * @see GameContext.removeBlock
     */
    removeBlock(blockId: number): void {
        delete BLOCKS[blockId];
    }

    /**
     * @see GameContext.removeToolByToolId
     */
    removeToolByToolId(toolId: string): void {
        const existing = ALL_ITEMS.find(t => t.toolId == toolId);
        if (existing) {
            ALL_ITEMS.splice(ALL_ITEMS.indexOf(existing), 1);
            this.game.mobs.forEach(m => m.initInventory());
        }
    }

    /**
     * @see GameContext.removeToolByBlock
     */
    removeToolByBlock(blockId: number): void {
        const existing = ALL_ITEMS.find(t => t.place == blockId);
        if (existing) {
            ALL_ITEMS.splice(ALL_ITEMS.indexOf(existing), 1);
            this.game.mobs.forEach(m => m.initInventory());
        }
    }

    /**
     * @see GameContext.removeToolByImage
     */
    removeToolByImage(image: string): void {
        const existing = ALL_ITEMS.find(t => t.sprite == image);
        if (existing) {
            ALL_ITEMS.splice(ALL_ITEMS.indexOf(existing), 1);
            this.game.mobs.forEach(m => m.initInventory());
        }
    }

    /**
     * @see GameContext.addTool
     */
    addTool(image: string, place: number, toolId: string, targetEmpty: boolean, targetFull: boolean, delayOnOperation?: number, breakable?: boolean, amountUsed?: number): string {
        this.log("Adding tool: " + toolId + " (targetEmpty=" + targetEmpty + ", targetFull=" + targetFull + ")");

        // backwards compatible
        if (targetFull === undefined) {
            targetFull = !targetEmpty;
        }

        if (delayOnOperation === undefined) {
            delayOnOperation = 0;
        }

        const tool: ItemDefinition = {
            type: "itemId/"+(toolId ?? "") +"/" + (image ?? "") + "/" + (""+place),
            sprite: image,
            place: place,
            spriteOffsetX: -70,
            spriteOffsetY: -130,
            spriteScale: 0.7,
            toolId: toolId,
            targetEmpty,
            targetFull,
            delay: delayOnOperation,
            breakable,
            amountUsed
        };

        if (this.currentMod) {
            this.currentMod.toolsAdded.push(tool);
        }

        ALL_ITEMS.push(tool);

        this.game.mobs.forEach(m => m.initInventory());

        return tool.type;
    }

    /**
     * @see GameContext.inCreativeMode
     */
    inCreativeMode(): boolean {
        return this.game.serverSettings.isCreativeMode();
    }

    /**
     * @see GameContext.createItem
     */
    createItem(x: number, y: number, count: number, itemId: string): string {
        const rx = (Math.random() * 0.4) - 0.2;
        const ry = (Math.random() * 0.4) - 0.2;

        return this.game.network.sendItemCreate((x + 0.5 + rx) * TILE_SIZE, (y + 0.5 + ry) * TILE_SIZE, count, itemId) ?? "";
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
     * @see GameContext.replaceAllBlocks
     */
    replaceAllBlocks(originalBlock: number, newBlock: number): void {
        if (this.isHost()) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                for (let y = 0; y < MAP_DEPTH; y++) {
                    if (this.game.gameMap.getTile(x, y, Layer.FOREGROUND) === originalBlock) {
                        this.setBlock(x, y, Layer.FOREGROUND, newBlock);
                    }
                    if (this.game.gameMap.getTile(x, y, Layer.BACKGROUND) === originalBlock) {
                        this.setBlock(x, y, Layer.BACKGROUND, newBlock);
                    }
                }
            }
        }
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
    playSfx(id: string, volume: number, variations?: number): void {
        playSfx(id, volume, variations ?? null);
    }

    /**
     * @see GameContext.setTimeout
     */
    setTimeout(callback: () => void, timeout: number): void {
        // wrap any calls to setTimeout in a context aware
        // callback
        const mod = this.currentMod;

        if (mod) {
            setTimeout(() => {
                this.startContext(mod);
                callback();
                this.endContext();
            }, timeout);
        }
    }

    /**
     * Start using this context for the mod specified. 
     * 
     * @param mod The mod we're taking actions for
     */
    startContext(mod: ModRecord) {
        if (mod === this.currentMod) {
            this.currentCount++;
        } else {
            this.currentCount = 1;
            this.currentMod = mod;
        }
    }

    /**
     * End the use of this context with the current mod
     */
    endContext() {
        this.currentCount--;
        if (this.currentCount === 0) {
            this.currentMod = undefined;
        }
    }

    /**
     * @see GameContext.displayChat
     */
    displayChat(message: string): void {
        if (this.currentMod && this.isHost()) {
            this.game.network.sendChatMessage(this.currentMod.mod.chatName ?? this.currentMod.mod.name, message);
        }
    }

    /**
     * @see GameContext.addParticlesAtTile
     */
    addParticlesAtTile(image: string, x: number, y: number, count: number): void {
        this.addParticlesAtPos(image, (x + 0.5) * TILE_SIZE, (y + 0.5) * TILE_SIZE, count);
    }

    /**
     * @see GameContext.addParticlesAtPos
     */
    addParticlesAtPos(image: string, x: number, y: number, count: number): void {
        this.game.network.sendParticles(image, x, y, count);
    }

    /**
     * @see GameContext.loadMap
     */
    loadMap(resource: string): void {
        if (this.isHost()) {
            const buffer = Uint8Array.from(atob(resource), c => c.charCodeAt(0))
            this.game.ui.loadMapFromBuffer(buffer);
            this.game.network.sendMapUpdate(undefined);
        }
    }

    /**
     * @see GameContext.isHost
     */
    isHost(): boolean {
        return this.game.isHostingTheServer;
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
    /** Tools that this mod added so they can be removed on uninstall */
    toolsAdded: ItemDefinition[];
    /** Blocks that his mod added so they can be removed on uninstall */
    blocksAdded: Block[];
    /** Skins that his mod added so they can be removed on uninstall */
    skinsAdded: Skin[];
    /** Recipes that were added by this mod so they can be removed on uninstall */
    recipesAdded: Recipe[];
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
                try {
                    record.inited = true;
                    this.context.startContext(record);
                    this.context.log("Init");
                    record.mod.onGameStart(this.context);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            } else if (!record.mod.onGameStart) {
                record.inited = true;
            }
        }

        // we may have added things that effect lights and discovery
        this.game.gameMap.resetDiscoveryAndLights();
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

        // we may have added things that effect lights and discovery
        this.game.gameMap.resetDiscoveryAndLights();
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
     * Notify all interested mods that a tool is in progress on a location
     * 
     * @param mob The mob using the tool.
     * @param x The x coordinate of the tool's target (in tiles)
     * @param y The y coordinate of the tool's target (in tiles)
     * @param layer The layer in which tool's targeted (0=foreground, 1=background)
     * @param tool The ID of the tool being used
     */
    toolProgress(mob: Mob | undefined, x: number, y: number, layer: number, tool: string): void {
        for (const record of this.mods) {
            if (record.mod.onProgressTool) {
                try {
                    this.context.startContext(record);
                    record.mod.onProgressTool(this.context, mob, x, y, layer, tool);
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


    /**
     * Notify all interested mods that a mob was added to the world
     * 
     * @param mob The mob added to the world
     */
    mobAdded(mob: Mob): void {
        for (const record of this.mods) {
            if (record.mod.onMobAdded) {
                try {
                    this.context.startContext(record);
                    record.mod.onMobAdded(this.context, mob);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }
}