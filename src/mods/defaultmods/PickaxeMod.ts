import { Layer } from "src/Map";
import { GameContext, GameProperty, MobContext, ServerMod, SkinDefinition } from "../Mods";
import { Game } from "src/Game";

export class PickaxeMod implements ServerMod {
    id: string = "default-pickaxe";
    name: string = "PickAxe-Default";
    chatName: string = "pickaxe";
    version: number = 1;
    apiVersion: number = 1;
    ironPickAxeType: string = "";
    stonePickAxeType: string = "";

    onGameStart(game: GameContext): void {
        this.ironPickAxeType = game.addTool("holding/pick_iron", 0, "iron-pick", false, true, 60, true, 0.01);
        this.stonePickAxeType = game.addTool("holding/pick_stone", 0, "stone-pick", false, true, 75, true, 0.01);
    }
    
    onMobAdded(game: GameContext, mob: MobContext): void {
        // nothing for free
        // if (mob.isPlayer()) {
        //     if (game.countItems(mob, this.ironPickAxeType) === 0) {
        //         game.giveItem(mob, 1, this.ironPickAxeType);
        //     }
        // }
    }

    onUseTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "iron-pick" || toolId === "stone-pick") {
            game.setBlock(x, y, layer, 0);
            game.playSfx('mining_break', 0.6, 5);
        }
    }

    onProgressTool(game: GameContext, mob: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void {
        if (toolId === "iron-pick" || toolId === "stone-pick") {
            game.playSfx('mining', 0.5, 5);
        }
    }
}