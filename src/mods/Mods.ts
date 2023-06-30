
export interface GameContext {
    displayChat(message: string): void;
}

export interface ServerMod {
    name: string;
    chatName: string;
    version: number;

    onGameStart?(game: GameContext): void;

    onWorldStart?(game: GameContext): void;

}