
import { ALL_ANIM } from "./Animations";
import { BLOCKS } from "./Block";
import { Game } from "./Game";
import { DEFAULT_INVENTORY } from "./InventItem";
import { SKINS } from "./Skins";
import { ConfiguredMods, ModRecord } from "./mods/ConfiguredMods";
import { ServerMod } from "./mods/Mods";

const MINIMUM_MOD_VERSION_ALLOWED: number = 0;

/**
 * The configuration that gets stored into local storage
 */
export interface ServerConfig {
    /** True if the server is configured to allow remote players to editr */
    editable: boolean;
    /** True if we should use the default mods */
    useDefaultMods: boolean;
    /** The collection of resources made available through mods */
    modScripts: (Record<string, string>)[];
}

/**
 * Server level settings - mods, configuration, passwords?
 */
export class ServerSettings {
    /**
     * The data put into local storage to store the server settings
     */
    private config: ServerConfig = {
        editable: true,
        modScripts: [],
        useDefaultMods: true
    }

    /** The game these settings will apply to */
    game: Game;
    /** A manager for server mods - handles life cycle and events */
    serverMods: ConfiguredMods;
    /** The list of default mods */
    defaultMods: ModRecord[] = [];

    constructor(game: Game) {
        this.game = game;
        this.serverMods = new ConfiguredMods(game);
    }

    addDefaultMod(mod: ServerMod) {
        const modRecord = { mod: mod, inited: false, resources: {}, toolsAdded: [], blocksAdded: [], skinsAdded: []};
        this.defaultMods.push(modRecord);

        if (this.useDefaultMods()) {
            this.addModRecord(modRecord);
        }
    }

    private addModRecord(modRecord: ModRecord) {
        console.log("[" + modRecord.mod.name + "] Installing");
        this.serverMods.mods.push(modRecord);

        if (modRecord.mod.onLoaded) {
            modRecord.mod.onLoaded(this.serverMods.context);
        }

        if (this.game.network.started) {
            this.serverMods.context.enableLogging(false);
            this.serverMods.init();
            this.serverMods.worldStarted();
            this.serverMods.context.enableLogging(true);
        }
    }

    /**
     * Get the mod manager that controls the lifecycle of the configured mods
     * 
     * @returns The manager for the configured mods
     */
    getConfiguredMods(): ConfiguredMods {
        return this.serverMods;
    }

    /**
     * Clean up any content this mod added on removal or update
     * 
     * @param mod The mod to clean up
     */
    cleanUpMod(mod: ModRecord): void {
        console.log("[" + mod.mod.name + "] Uninstalling");
        for (const tool of mod.toolsAdded) {
            const index = DEFAULT_INVENTORY.indexOf(tool);

            if (index >= 0) {
                console.log("[" + mod.mod.name + "] Removing tool: " + tool.toolId + " on refresh");
                DEFAULT_INVENTORY.splice(index, 1);
            }
        }

        for (const skinName of Object.keys(SKINS)) {
            const skin = SKINS[skinName];
            if (mod.skinsAdded.includes(skin)) {
                for (const removeMe of this.game.mobs.filter(m => m.type === skinName)) {
                    this.game.mobs.splice(this.game.mobs.indexOf(removeMe), 1);
                }

                console.log("[" + mod.mod.name + "] Removing skin: " + skinName + " on refresh");
                delete SKINS[skinName];
                delete ALL_ANIM[skinName];
            }
        }

        const blockIds: number[] = [];
        for (const block of mod.blocksAdded) {
            for (let key = 0; key < 256; key++) {
                if (BLOCKS[key] === block) {
                    console.log("[" + mod.mod.name + "] Removing block: " + key + " on refresh");
                    delete BLOCKS[key];
                    blockIds.push(key);
                }
            }
        }

        console.log("[" + mod.mod.name + "] Removing mod blocks from map: ", blockIds);
        for (const blockId of blockIds) {
            this.serverMods.context.startContext(mod);
            this.serverMods.context.replaceAllBlocks(blockId, 0);
            this.serverMods.context.endContext();
        }

        mod.toolsAdded = [];
        mod.blocksAdded = [];
        this.game.mobs.forEach(m => m.initInventory());
    }

    /**
     * Update a mod in situ with a new mod.js file
     * 
     * @param mod The mod to be updated
     * @param content The content to apply 
     * @returns True if the content successfully applied
     */
    updateMod(mod: ModRecord, content: string): boolean {
        try {
            const potentialMod = eval(content) as ServerMod;
            if (potentialMod.name && potentialMod.id) {
                const apiVersion = potentialMod.apiVersion ?? 1;
                if (apiVersion < MINIMUM_MOD_VERSION_ALLOWED) {
                    console.error("Modification version is too old (" + apiVersion + " < " + MINIMUM_MOD_VERSION_ALLOWED);
                    return false;
                }
                mod.resources["mod.js"] = content;
                mod.mod = potentialMod;
                this.cleanUpMod(mod);

                if (mod.mod.onLoaded) {
                    mod.mod.onLoaded(this.serverMods.context);
                }

                // if the mod had already been inited we'll want to 
                // reinitalise and start again
                if (mod.inited) {
                    mod.inited = false;
                    this.serverMods.init();
                    this.serverMods.worldStarted();
                }

                this.game.gameMap.resetDiscoveryAndLights();
                this.save();
                return true;
            } else {
                console.error("Modification either didn't have a name or an ID!");
                return false;
            }
        } catch (e) {
            console.log("Error loading mod: ");
            console.error(e);
            return false;
        }
    }

    /**
     * Add a new mod to the server. A mod consists of a set of resources keyed by 
     * name.
     * 
     * @param modData The resources provided by the mod, keyed by name
     * @param updateUiAndConfig True if we should update the UI (false on startup)
     */
    addMod(modData: Record<string, string>, updateUiAndConfig: boolean, logging: boolean = true): void {
        try {
            const script = modData["mod.js"];
            if (script) {
                const potentialMod = eval(script) as ServerMod;

                if (potentialMod.name && potentialMod.id) {
                    const apiVersion = potentialMod.apiVersion ?? 1;
                    if (apiVersion < MINIMUM_MOD_VERSION_ALLOWED) {
                        console.error("Modification version is too old (" + apiVersion + " < " + MINIMUM_MOD_VERSION_ALLOWED);
                        return;
                    }

                    const existing = this.serverMods.mods.find(m => m.mod.id === potentialMod.id);
                    if (existing) {
                        this.removeMod(existing);
                    }

                    const modRecord = { mod: potentialMod, inited: false, resources: modData, toolsAdded: [], blocksAdded: [], skinsAdded: [] };
                    console.log("[" + potentialMod.name + "] Installing");
                    this.serverMods.mods.push(modRecord);

                    if (updateUiAndConfig) {
                        this.config.modScripts.push(modData);
                        this.save();
                        this.game.ui.addMod(modRecord);
                    }

                    if (modRecord.mod.onLoaded) {
                        modRecord.mod.onLoaded(this.serverMods.context);
                    }
                    
                    if (this.game.network.started) {
                        this.serverMods.context.enableLogging(logging);
                        this.serverMods.init();
                        this.serverMods.worldStarted();
                        this.serverMods.context.enableLogging(true);
                    }

                    this.game.gameMap.resetDiscoveryAndLights();
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

    /**
     * Uninstall a mod from the game
     * 
     * @param mod The mod to uninstall
     */
    removeMod(mod: ModRecord): void {
        this.cleanUpMod(mod);

        const index = this.serverMods.mods.indexOf(mod);
        if (index >= 0) {
            this.config.modScripts.splice(this.config.modScripts.indexOf(mod.resources), 1);
            this.serverMods.mods.splice(index, 1);
            this.save();
        }

        this.game.gameMap.resetDiscoveryAndLights();
    }

    /**
     * Get the server config that needs to be stored
     * 
     * @returns The server config blob that is stored for this set of settings.
     */
    getConfig(): ServerConfig {
        return this.config;
    }

    /**
     * True if the server is configured to let remote players edit the world
     * 
     * @returns True if the server is configured to allow remote players to make changes
     */
    isEditable(): boolean {
        return this.config.editable;
    }

    /**
     * Set whether the server can be edited by remote players
     * 
     * @param e True if the server should be editable
     */
    setEditable(e: boolean): void {
        this.config.editable = e;
        this.save();
    }

    useDefaultMods(): boolean {
        return this.config.useDefaultMods;
    }

    setUseDefaultMods(m: boolean): void {
        this.config.useDefaultMods = m;
    
        if (m) {
            for (const mod of this.defaultMods) {
                if (!this.serverMods.mods.includes(mod)) {
                    this.addModRecord(mod);
                }
            }
        } else {
            for (const mod of this.defaultMods) {
                if (this.serverMods.mods.includes(mod)) {
                    this.removeMod(mod);
                }
            }
        }
        this.save();
    }

    /**
     * Persist the settings to local storage
     */
    save(): void {
        localStorage.setItem("serverSettings", JSON.stringify(this.config));

        if (this.game.network) {
            this.game.network.sendServerSettings(this.config);
        }
    }

    /**
     * Load all the mods from the configuration object. Used on startup to apply
     * stored mods.
     * 
     * @param config The configuration thats been loaded
     */
    loadModsFrom(config: ServerConfig): void {
        const modsToLoad = config.modScripts;

        for (const mod of modsToLoad) {
            this.addMod(mod, false);
        }
    }

    /**
     * Load the settings from local storage
     */
    load(): void {
        const existing = localStorage.getItem("serverSettings");
        if (!this.game.headless && existing) {
            if (!this.game.headless) {
                Object.assign(this.config, JSON.parse(existing));
                const modsToLoad = this.config.modScripts;
                this.config.modScripts = [];

                for (const mod of modsToLoad) {
                    this.addMod(mod, true);
                }
            }
        } else if (this.game.headless) {
            const targetUrl = "https://settings.json";
            console.log("Loading settings from: " + targetUrl);
            const request = new XMLHttpRequest();
            request.open("GET", targetUrl, false);
            request.send();

            const config = JSON.parse(request.responseText);
            Object.assign(this.config, config);
            console.log("Applying configuration from settings.json");

            console.log("  - Editable World: " + this.config.editable);
            console.log("  - Use Default Mods: " + this.config.useDefaultMods);
        }
    }
}