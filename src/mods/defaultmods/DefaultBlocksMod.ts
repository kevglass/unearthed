import { GameContext, ServerMod } from "../Mods";

export class DefaultBlockMod implements ServerMod {
    id: string = "default-blockTools";
    name: string = "BlockTools-Default";
    chatName: string = "blockTools";
    version: number = 1;
    apiVersion: number = 1;

    onGameStart(game: GameContext): void {
        game.addTool("tiles/dirt", 1, undefined, true, false);
        game.addTool("tiles/brick_grey", 3, undefined, true, false);
        game.addTool("tiles/brick_red", 4, undefined, true, false);
        game.addTool("tiles/sand", 6, undefined, true, false);
        game.addTool("tiles/wood", 7, undefined, true, false);
        game.addTool("tiles/ladder", 8, undefined, true, false);
        game.addTool("tiles/platform", 24, undefined, true, false);
        game.addTool("holding/torch", 26, undefined, true, false);
        game.addTool("tiles/tnt", 25, undefined, true, false);
        game.addTool("tiles/portal", 27, undefined, true, false);
    }
}