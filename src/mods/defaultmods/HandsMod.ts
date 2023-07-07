import { Layer } from "src/Map";
import { GameContext, GameProperty, MobContext, ServerMod, SkinDefinition } from "../Mods";

export class HandsMod implements ServerMod {
    id: string = "default-hands";
    name: string = "Hands-Default";
    chatName: string = "hands";
    version: number = 1;
    apiVersion: number = 1;
    pickId: string = "";

    onGameStart(game: GameContext): void {
        this.pickId = game.addTool("holding/pick_iron", 0, "iron-pick", false, true, 60, true, 0.01);
    }

    onUseTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "hands") {
            game.setBlock(x, y, layer, 0);

            game.playSfx('mining_break', 0.6, 5);
        }
    }

    onProgressTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "hands") {
            game.playSfx('mining', 0.5, 5);
        }
    }
}