import { Game } from "src/Game";
import { GameContext, ServerMod } from "./Mods";
import { loadImageFromUrl } from "src/engine/Resources";

export class GameAsContext implements GameContext {
    game: Game;
    currentMod: ModRecord | undefined;

    constructor(game: Game) {
        this.game = game;
    }

    getModResource(name: string): string {
        return this.currentMod?.resources[name] ?? "unknown image " + name;
    }

    replaceImage(id: string, url: string): void {
        loadImageFromUrl(id, "data:image/jpeg;base64," + url);
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
                    console.log("Initialising: " + record.mod.name);
                    this.context.startContext(record);
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
}