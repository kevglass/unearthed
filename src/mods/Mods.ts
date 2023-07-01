import { Block } from "src/Block";
import { Layer } from "src/Map";

export interface MobContext {
    id: string;
    name: string;
    x: number;
    y: number;
}

export interface GameContext {
    log(message: string): void;

    error(e: any): void;

    displayChat(message: string): void;

    getModResource(name: string): string;

    addImage(id: string, data: string): void;

    addAudio(id: string, data: string): void;

    addBlock(blockId: number, tileDef: Block): void;

    addTool(image: string, place: number, toolId: string, emptyTarget: boolean): void;

    setBlock(x: number, y: number, layer: Layer, blockId: number): void;

    getBlock(x: number, y: number, layer: Layer): number;

    getLocalPlayer(): MobContext;

    getMobs(): MobContext[];

    playSfx(id: string, volume: number): void;

    addParticlesAtTile(image: string, x: number, y: number, count: number): void;

    addParticlesAtPos(image: string, x: number, y: number, count: number): void;
}

export interface ServerMod {
    name: string;
    chatName: string;
    version: number;

    generateWorld?(game: GameContext, width: number, height: number): void;

    onGameStart?(game: GameContext): void;

    onWorldStart?(game: GameContext): void;

    onTick?(game: GameContext): void;

    onSetTile?(game: GameContext, player: MobContext | undefined, x: number, y: number, layer: Layer, block: number): void;

    onUseTool?(game: GameContext, player: MobContext | undefined, x: number, y: number, layer: Layer, toolId: string): void;

    onTrigger?(game: GameContext, player: MobContext, x: number, y: number): void;
}