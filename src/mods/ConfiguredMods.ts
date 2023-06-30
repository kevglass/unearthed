import { Game } from "src/Game";
import { GameContext, MobContext, ServerMod } from "./Mods";
import { loadImageFromUrl, loadSfxFromUrl } from "src/engine/Resources";
import { Block, BLOCKS } from "src/Block";
import { DEFAULT_INVENTORY } from "src/InventItem";
import { Layer } from "src/Map";

export class GameAsContext implements GameContext {
    game: Game;
    currentMod: ModRecord | undefined;

    constructor(game: Game) {
        this.game = game;
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

    addTool(image: string, place: number): void {
        DEFAULT_INVENTORY.push({
            sprite: image,
            place: place,
            spriteOffsetX: -70, 
            spriteOffsetY: -130, 
            spriteScale: 0.7
        });
    }

    setBlock(x: number, y: number, layer: Layer, blockId: number): void {
        this.game.network.sendNetworkTile(x, y, blockId, layer);
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
        this.playSfx(id, volume);
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
}