import { Game } from "./Game";

export interface ServerConfig {
    editable: boolean;
}

export class ServerSettings {
    private config: ServerConfig = {
        editable: true
    }
    game: Game;
    
    constructor(game: Game) {
        this.game = game;
    }

    getConfig(): ServerConfig {
        return this.config;
    }

    isEditable(): boolean {
        return this.config.editable;
    }

    setEditable(e: boolean): void {
        this.config.editable = e;
        this.save();
    }

    save(): void {
        localStorage.setItem("serverSettings",  JSON.stringify(this.config));

        this.game.network.sendServerSettings(this.config);
    }

    load(): void {
        const existing = localStorage.getItem("serverSettings");
        if (existing) {
            Object.assign(this.config, JSON.parse(existing));
        }
    }
}