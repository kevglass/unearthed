import { Game } from "src/Game";
import { GameContext, MobContext, ServerMod } from "./Mods";
import { getSprite, loadImageFromUrl, loadSfxFromUrl, playSfx } from "src/engine/Resources";
import { Block, BLOCKS } from "src/Block";
import { DEFAULT_INVENTORY } from "src/InventItem";
import { Layer, MAP_DEPTH, MAP_WIDTH, TILE_SIZE } from "src/Map";
import { Mob } from "src/Mob";
import { Particle, addParticle } from "src/engine/Particles";

export class GameAsContext implements GameContext {
    game: Game;
    currentMod: ModRecord | undefined;

    constructor(game: Game) {
        this.game = game;
    }

    error(e: any): void {
        if (this.currentMod) {
            console.error("[" + this.currentMod.mod.name + "] Error!!!");
        } else {
            console.error("[UNKNOWN MOD] Error!!!");
        }
        console.error(e);
    }

    log(message: string) {
        if (this.currentMod) {
            console.info("[" + this.currentMod.mod.name + "] " + message);
        } else {
            console.info("[UNKNOWN MOD] " + message);
        }
    }

    getModResource(name: string): string {
        this.log("Getting resources: " + name);
        if (!this.currentMod?.resources[name]) {
            this.log(" === RESOURCE NOT FOUND ");
        }
        return this.currentMod?.resources[name] ?? "unknown image " + name;
    }

    addImage(id: string, data: string): void {
        this.log("Replacing image: " + id);
        loadImageFromUrl(id, "data:image/jpeg;base64," + data);
    }

    addAudio(id: string, data: string): void {
        this.log("Replacing sound effect: " + id);
        loadSfxFromUrl(id, "data:audio/mpeg;base64," + data);
    }

    addBlock(value: number, tileDef: Block): void {
        BLOCKS[value] = tileDef;
    }

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

    setBlock(x: number, y: number, layer: Layer, blockId: number): void {
        this.game.network.sendNetworkTile(undefined, x, y, blockId, layer);
    }

    getBlock(x: number, y: number, layer: Layer): number {
        return this.game.gameMap.getTile(x, y, layer);
    }

    getLocalPlayer(): MobContext {
        return this.game.player;
    }

    getMobs(): MobContext[] {
        return this.game.mobs;
    }

    playSfx(id: string, volume: number): void {
        playSfx(id, volume);
    }

    startContext(mod: ModRecord) {
        this.currentMod = mod;
    }

    endContext() {
        this.currentMod = undefined;
    }

    displayChat(message: string): void {
        if (this.currentMod) {
            this.game.network.sendChatMessage(this.currentMod.mod.chatName ?? this.currentMod.mod.name, message);
        }
    }

    addParticlesAtTile(image: string, x: number, y: number, count: number): void {
        this.addParticlesAtPos(image, (x + 0.5) * TILE_SIZE, (y+0.5) * TILE_SIZE, count);
    }

    addParticlesAtPos(image: string, x: number, y: number, count: number): void {
        this.game.network.sendParticles(image, x, y, count);
    }
}

export interface ModRecord {
    mod: ServerMod;
    resources: Record<string, string>;
    inited: boolean;
}

export class ConfiguredMods {
    mods: ModRecord[] = [];
    game: Game;
    context: GameAsContext;

    constructor(game: Game) {
        this.game = game;
        this.context = new GameAsContext(game);
    }

    inModContext(): boolean {
        return this.context.currentMod !== undefined;
    }

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

    tile(mob: Mob | undefined, x: number, y: number, layer: number, block: number): void {
        for (const record of this.mods) {
            if (record.mod.onSetTile) {
                try {
                    this.context.startContext(record);
                    record.mod.onSetTile(this.context, mob, x, y, layer, block);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + record.mod.name);
                    console.error(e);
                }
            }
        }
    }

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
}