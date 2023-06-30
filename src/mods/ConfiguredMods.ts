import { Game } from "src/Game";
import { GameContext, ServerMod } from "./Mods";

export class GameAsContext implements GameContext {
    game: Game;
    currentMod: ServerMod | undefined;

    constructor(game: Game) {
        this.game = game;
    }

    startContext(mod: ServerMod) {
        this.currentMod = mod;
    }

    endContext() {
        this.currentMod = undefined;
    }

    displayChat(message: string): void {
        if (this.currentMod) {
            this.game.network.sendChatMessage(this.currentMod.chatName ?? this.currentMod.name, message);
        }
    }

}
export class ConfiguredMods {
    mods: ServerMod[] = [];
    game: Game;
    context: GameAsContext;

    constructor(game: Game) {
        this.game = game;
        this.context = new GameAsContext(game);
    }

    worldStarted(): void {
        console.log("World Started");
        for (const mod of this.mods) {
            if (mod.onWorldStart) {
                try {
                    this.context.startContext(mod);
                    mod.onWorldStart(this.context);
                    this.context.endContext();
                } catch (e) {
                    console.error("Error in Game Mod: " + mod.name);
                    console.error(e);
                }
            }
        }
    }
}