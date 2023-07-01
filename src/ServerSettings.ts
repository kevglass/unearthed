
import { Game } from "./Game";
import { ConfiguredMods, ModRecord } from "./mods/ConfiguredMods";
import { ServerMod } from "./mods/Mods";

export interface ServerConfig {
    editable: boolean;
    modScripts: (Record<string, string>)[];
}

export class ServerSettings {
    private config: ServerConfig = {
        editable: true,
        modScripts: []
    }

    game: Game;
    serverMods: ConfiguredMods;

    constructor(game: Game) {
        this.game = game;
        this.serverMods = new ConfiguredMods(game);
    }

    getConfiguredMods(): ConfiguredMods {
        return this.serverMods;
    }

    addMod(modData: Record<string, string>, updateUiAndConfig: boolean): void {
        try {
            const script = modData["mod.js"];
            if (script) {
                const potentialMod = eval(script) as ServerMod;

                if (potentialMod.name && potentialMod.id) {
                    const modRecord = { mod: potentialMod, inited: false, resources:modData };
                    this.serverMods.mods.push(modRecord);

                    if (updateUiAndConfig) {
                        this.config.modScripts.push(modData);
                        this.save();
                        this.game.ui.addMod(modRecord);
                    }
                } else {
                    console.error("Modification either didn't have a name or an ID!");
                }
            } else {
                console.error("No mod.js file found in zip");   
                console.log(modData);
            }
        } catch (e) {
            console.log("Error loading mod: ");
            console.error(e);
        }
    }

    removeMod(mod: ModRecord): void {
        const index = this.serverMods.mods.indexOf(mod);
        if (index >= 0) {
            this.config.modScripts.splice(index, 1);
            this.serverMods.mods.splice(index, 1);
            this.save();
        }
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

        if (this.game.network) {
            this.game.network.sendServerSettings(this.config);
        }
    }

    loadModsFrom(config: ServerConfig): void {
        const modsToLoad = config.modScripts;

        for (const mod of modsToLoad) {
            this.addMod(mod, false);
        }
    }

    load(): void {
        const existing = localStorage.getItem("serverSettings");
        if (existing) {
            Object.assign(this.config, JSON.parse(existing));

            const modsToLoad = this.config.modScripts;
            this.config.modScripts = [];

            for (const mod of modsToLoad) {
                this.addMod(mod, true);
            }
        }
    }
}