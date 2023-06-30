
export interface GameContext {
    displayChat(message: string): void;
}

export interface ServerMod {
    name: string;
    chatName: string;
    version: number;

    onWorldStart?(game: GameContext): void;
}