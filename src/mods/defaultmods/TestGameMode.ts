import { SKY_HEIGHT, TILE_SIZE } from "src/Map";
import { GameContext, Layer, MobContext, ModDependency, ServerMod } from "../ModApi";

export class TestGameMod implements ServerMod {
    id: string = "default-Test";
    name: string = "Test-Default";
    chatName: string = "test";
    version: number = 1;
    apiVersion: number = 1;

    onWorldStart(game: GameContext): void {
        game.addBlock(500, {
            sprite: "tiles/switch-on",
            blocks: false,
            ladder: false,
            needsGround: false,
            blocksDiscovery: false,
            leaveBackground: false,
            blocksDown: false,
            blocksLight: false,
            wireInputs: 0,
            wireOutputs: 1
        });

        game.addBlock(501, {
            sprite: "tiles/switch-off",
            blocks: false,
            ladder: false,
            needsGround: false,
            blocksDiscovery: false,
            leaveBackground: false,
            blocksDown: false,
            blocksLight: false,
            wireInputs: 0,
            wireOutputs: 1
        });
        game.addTool("tiles/switch-off", 501, undefined, true, false, 0, false, 1);

        game.addBlock(502, {
            sprite: "tiles/light-on",
            blocks: false,
            ladder: false,
            needsGround: false,
            blocksDiscovery: false,
            leaveBackground: false,
            blocksDown: false,
            blocksLight: false,
            light: true,
            wireInputs: 1,
            wireOutputs: 0
        });

        game.addBlock(503, {
            sprite: "tiles/light-off",
            blocks: false,
            ladder: false,
            needsGround: false,
            blocksDiscovery: false,
            leaveBackground: false,
            blocksDown: false,
            blocksLight: false,
            wireInputs: 1,
            wireOutputs: 0
        });
        game.addTool("tiles/light-off", 503, undefined, true, false, 0, false, 1);

        game.addTool("holding/wiring", 0, "wiring-tool", false, true, 0, false, 1);
    }

    onSelectTool(game: GameContext, mob: MobContext, toolId: string): void {
        if (toolId === "wiring-tool") {
            game.setShowWiring(true);
        } else {
            game.setShowWiring(false);
        }
    }

    considerTrigger(game: GameContext, x: number, y: number, layer: Layer, b: number) {
        // toggle a switch that is on
        if (b === 500) {
            game.setBlock(x, y, layer, 501);
            game.setOutputValue(x, y, layer, 0, 0);
        } else if (b === 501) {
            game.setBlock(x, y, layer, 500);
            game.setOutputValue(x, y, layer, 0, 1);
        }
    }

    onInputChanged(game: GameContext, tileX: number, tileY: number, layer: number, index: number, oldValue: number, newValue: number): void {
        const block = game.getBlock(tileX, tileY, layer);
        if (block === 502 && newValue === 0) {
            game.setBlock(tileX, tileY, layer, 503);
        }  
        if (block === 503 && newValue === 1) {
            game.setBlock(tileX, tileY, layer, 502);
        }  
        console.log("Input changed: " + oldValue + " -> " + newValue);
    }

    onTrigger(game: GameContext, mob: MobContext, x: number, y: number): void {
        this.considerTrigger(game, x, y, Layer.FOREGROUND, game.getBlock(x, y, Layer.FOREGROUND));
        this.considerTrigger(game, x, y, Layer.BACKGROUND, game.getBlock(x, y, Layer.BACKGROUND));
        
    }
}