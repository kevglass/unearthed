import { Block } from "src/Block";
import { Layer } from "src/Map";

export interface MobContext {
    id: string;
    name: string;
    x: number;
    y: number;
}

export interface GameContext {
    displayChat(message: string): void;

    getModResource(name: string): string;

    addImage(id: string, data: string): void;

    addAudio(id: string, data: string): void;

    addBlock(blockId: number, tileDef: Block): void;

    addTool(image: string, place: number, toolId: string): void;

    setBlock(x: number, y: number, layer: Layer, blockId: number): void;

    getBlock(x: number, y: number, layer: Layer): number;

    getLocalPlayer(): MobContext;

    getMobs(): MobContext[];

    playSfx(id: string, volume: number): void;
}

export interface ServerMod {
    name: string;
    chatName: string;
    version: number;

    onGameStart?(game: GameContext): void;

    onWorldStart?(game: GameContext): void;

    onTick?(game: GameContext): void;

    onSetTile?(game: GameContext, player: MobContext, x: number, y: number, layer: Layer, block: number): void;

    onUseTool?(game: GameContext, player: MobContext, x: number, y: number, layer: Layer, toolId: string): void;
}