
import { Graphics, HtmlGraphics, WebglGraphics } from "./engine/Graphics";
import { HtmlUi } from "./HtmlUi";
import { GameMap, MAP_DEPTH, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE } from "./Map";
import { Mob } from "./Mob";
import { isMobile, isTablet } from "./util/MobileDetect";
import { Network } from "./Network";
import { renderAndUpdateParticles } from "./engine/Particles";
import { confirmAudioContext, getSprite, loadAllResources, playSfx, resourcesLoaded, SPRITES } from "./engine/Resources";
import { v4 as uuidv4 } from 'uuid';
import { createServerId } from "./util/createServerId";
import { Controller, ControllerListener } from "./engine/Controller";
import { ControllerButtons, CONTROLLER_SETUP_STEPS, KeyControls, KEYS_SETUP_STEPS, ControllerSetupStep } from "./ControllerSetup";
import { ServerSettings } from "./ServerSettings";
import { ConfiguredMods } from "./mods/ConfiguredMods";
import { initTiles, BLOCKS } from "./Blocks";
import { Item, initInventory } from "./InventItem";
import { hideCodeEditor } from "./mods/Editor";
import JSZip from "jszip";
import { InventPanel } from "./InventPanel";
import { DefaultBlockMod } from "./mods/defaultmods/DefaultGameMod";
import { GameProperty, Layer, Recipe } from "./mods/ModApi";
import { RecipePanel } from "./RecipePanel";
import { TestGameMod } from "./mods/defaultmods/TestGameMode";

//
// The main game controller and state. This is catch-all for anything that didn't
// fit anywhere else
//

/** True if we should be showing bounds when rendering mobs */
const SHOW_BOUNDS: boolean = false;
/** The ZOOM level - higher = less zoomed - I know, I know. */
export const ZOOM: number = isMobile() && !isTablet() ? 3 : 2;
/** Some default names if the player can't be bothered to set one */
const DEFAULT_NAMES = ["Beep", "Boop", "Pop", "Whizz", "Bang", "Snap", "Wooga", "Pow", "Zowie", "Smash", "Grab", "Kaboom", "Ziggy", "Zaggy"];

const USE_WEBGL: boolean = false;

function toColorComponents(col: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(col);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseInt(result[4], 16)
    } : null;
}

/**
 * The main game controller. This needs breaking up a bit more yet.
 */
export class Game implements ControllerListener {
    /** The HTML div we display the tooltip in */
    tooltipDiv: HTMLDivElement;
    /** The last time the tool tip was shown, used to time it out */
    timeTooltipShown: number = 0;
    /** The animation timer */
    animTime: number = 0;
    /** The HTML Canvas element we're rendering to - fullscreen */
    canvas: HTMLCanvasElement;
    /** The graphics context used to render to the canvas */
    g: Graphics;
    /** True if this browser is acting as game host */
    isHostingTheServer: boolean = true;
    /** True if we're attempting to connect to game network */
    connecting: boolean = false;
    /** True if we're waiting for a host to connect and provide a map */
    waitingForHost: boolean = false;
    /** The username the player has given (or has been defaulted) */
    username: string;
    /** The local player's mob */
    player: Mob;
    /** The server ID if hosted here or the ID of the server we're connecting to */
    serverId: string;
    /** The password to secure your local server */
    serverPassword: string;
    /** The list of mobs in the game world */
    mobs: Mob[] = [];
    /** The keyboard state - maintained through HTML/JS event listeners - keyed on the key itself, e.g. "a" */
    keyDown: Record<string, boolean> = {};
    /** The mouse/touch state - maintained through HTML/JS event listeners - keyed on the mouse button index */
    mouseButtonDown: Record<number, boolean> = {};
    /** The last record mouse position's x coordinate */
    mouseX = 0;
    /** The last record mouse position's y coordinate */
    mouseY = 0;
    /** The x coordinate of the location the player last worked/mined at */
    lastWorkX = 0;
    /** The y coordinate of the location the player last worked/mined at */
    lastWorkY = 0;
    /** The touch ID thats being used to dig/place blocks - used in mobile touch controls */
    mainAreaTouchId = 0;
    /** The touch ID thats being used to move left/right - used in mobile touch controls */
    controllerTouchId = 0;
    /** The touch ID thats being used to jump- used in mobile touch controls */
    jumpTouchId = 0;
    /** The gamepad controller wrapper */
    gamepad: Controller;
    /** True if we're currently configured to place tiles on the foreground layer */
    placingTilesOnFrontLayer: boolean = true;
    /** The time of the last rendered frame */
    lastFrame = Date.now();
    /** True if we're on a limited size portrait screen - adjusts UI */
    limitedPortraitScreen: boolean = false;
    /** True if we're on a limited size landscape screen - adjusts UI */
    limitedLandscapeScreen: boolean = false;
    /** the time at which the splash screen should be removed - 1 second of Coke and Code */
    finishStartup = Date.now() + 1000;
    /** The message of the day */
    motd = "Totally not Minecraft";
    /** The game map being maintained */
    gameMap: GameMap;
    /** The network being used */
    network: Network;
    /** The HTML UI overlaying the game */
    ui: HtmlUi;
    /** The time of the last update */
    lastUpdate: number = Date.now();
    /** True if we used the gamepad to dig - allows us to reset state when its released */
    gamepadUsedToDig: boolean = false;
    /** The controller setup step */
    controllerSetupStep: number = -1;
    /** The controller setup steps we're going through */
    controllerSetupSteps: ControllerSetupStep[] = [];
    /** Server settings */
    serverSettings: ServerSettings;
    /** The inventory panel */
    inventPanel: InventPanel;
    /** The recipe panel */
    recipePanel: RecipePanel;
    /** The quick slot that currently selected */
    quickSlotSelected: number = 0;

    /** If we're running headless mode */
    headless: boolean = false;
    /** The unique player ID other servers can use to determine the same user */
    uniquePlayerId: string = "";

    /** True if we're showing wiring */
    showWiring: boolean = false;
    /** The view location */
    viewX: number = 0;
    /** The view location */
    viewY: number = 0;

    /** The collection of global properties configurable from mods */
    globalProperties: Record<GameProperty, string | number | boolean> = {
        [GameProperty.BACKGROUND_COLOR]: "#445253FF",
        [GameProperty.SKY_COLOR]: "#CFEFFCFF",
        [GameProperty.SPAWN_X]: 2,
        [GameProperty.SPAWN_Y]: (SKY_HEIGHT - 6),
        [GameProperty.RECIPES_ENABLED]: true,
    };

    /**
     * The configuration of the controller buttons to actions
     */
    controllerButtons: ControllerButtons = {
        jump: 0,
        next: 1,
        prev: 2,
        layer: 3,
        trigger: 4,
        invent: 5
    };

    /**
     * The configuration of the key controls buttons to actions
     */
    keyControls: KeyControls = {
        up: "KeyW",
        down: "KeyS",
        left: "KeyA",
        right: "KeyD",
        next: "KeyE",
        prev: "KeyQ",
        layer: "KeyX",
        trigger: "KeyR",
        invent: "KeyI",
    };

    /**
     * The list of recipes configured by mods
     */
    recipes: Recipe[] = [];

    constructor() {
        const params = new URLSearchParams(location.search);
        this.headless = params.get("headless") === "true";

        loadAllResources(this);
        initTiles();
        initInventory();

        this.inventPanel = new InventPanel(this);
        this.recipePanel = new RecipePanel(this);
        this.serverSettings = new ServerSettings(this);

        this.gamepad = new Controller();
        this.gamepad.addListener(this);

        this.tooltipDiv = document.getElementById("tooltip") as HTMLDivElement;
        this.canvas = document.getElementById("game") as HTMLCanvasElement;

        if (USE_WEBGL) {
            this.g = new WebglGraphics(this.canvas);
        } else {
            this.g = new HtmlGraphics(this.canvas);
        }

        // check if we have a server ID stored locally, if not then generated one
        // and store it
        this.serverId = localStorage.getItem("server") ?? "";
        const isLegacyServerId = this.serverId.length > 5;
        if (this.serverId === "" || isLegacyServerId) {
            this.serverId = createServerId();
            localStorage.setItem("server", this.serverId);
        }

        this.serverPassword = localStorage.getItem("serverPassword") ?? "";
        if (this.serverPassword === "") {
            this.serverPassword = uuidv4();
            localStorage.setItem("serverPassword", this.serverPassword);
        }
        this.uniquePlayerId = localStorage.getItem("playerId") ?? "";
        if (this.uniquePlayerId === "") {
            this.uniquePlayerId = uuidv4();
            localStorage.setItem("playerId", this.uniquePlayerId);
        }

        this.loadControllerSetup();

        // check if we have a username stored locally, if not then generated one
        // and store it
        this.username = localStorage.getItem("username") ?? "";
        if (this.username === "") {
            this.username = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
            localStorage.setItem("username", this.username);
        }
        (document.getElementById("playerName") as HTMLInputElement).value = this.username;


        this.gameMap = new GameMap(this);
        if (!this.gameMap.loadFromStorage()) {
            this.gameMap.reset();
        } else {
            this.gameMap.resetDiscoveryAndLights();
        }

        this.network = new Network(this, this.gameMap);
        this.ui = new HtmlUi(this, this.network, this.gameMap);

        // bootstrap the default mods if enabled
        this.serverSettings.addDefaultMod(new DefaultBlockMod());
        // this.serverSettings.addDefaultMod(new TestGameMod());
        this.serverSettings.load();

        // update UI state based on loaded config
        this.ui.renderChangeWorldButton();
        this.ui.renderDefaultModsButton();
        this.ui.renderChangeCreativeButton();
        this.ui.renderChangePublishButton();
        this.ui.renderAccessAndName();

        this.gameMap.resetDiscoveryAndLights();

        // create the local player and configure and skin settings
        this.player = new Mob(this.network, this.gameMap, this.uniquePlayerId, this.username, true, "human", 200, (SKY_HEIGHT - 6) * TILE_SIZE, true);

        const skinsForValidation = ["a", "b", "c", "d"];
        if (localStorage.getItem("head")) {
            this.player.bodyParts.head = localStorage.getItem("head")!;

            if (!skinsForValidation.includes(this.player.bodyParts.head)) {
                this.player.bodyParts.head = "a";
            }
        }
        if (localStorage.getItem("body")) {
            this.player.bodyParts.body = localStorage.getItem("body")!;

            if (!skinsForValidation.includes(this.player.bodyParts.body)) {
                this.player.bodyParts.body = "a";
            }
        }
        if (localStorage.getItem("legs")) {
            this.player.bodyParts.legs = localStorage.getItem("legs")!;

            if (!skinsForValidation.includes(this.player.bodyParts.legs)) {
                this.player.bodyParts.legs = "a";
            }
        }
        if (localStorage.getItem("arms")) {
            this.player.bodyParts.arms = localStorage.getItem("arms")!;

            if (!skinsForValidation.includes(this.player.bodyParts.arms)) {
                this.player.bodyParts.arms = "a";
            }
        }

        const bodySelect = document.getElementById("bodySelect") as HTMLSelectElement;
        const headSelect = document.getElementById("headSelect") as HTMLSelectElement;
        const armsSelect = document.getElementById("armsSelect") as HTMLSelectElement;
        const legsSelect = document.getElementById("legsSelect") as HTMLSelectElement;
        bodySelect.value = this.player.bodyParts.body;
        headSelect.value = this.player.bodyParts.head;

        // configure the listeners on the setup dialog to configure the main player
        bodySelect.addEventListener("change", (event) => {
            this.player.bodyParts.body = bodySelect.value;
            localStorage.setItem("body", this.player.bodyParts.body);
        });
        headSelect.addEventListener("change", (event) => {
            this.player.bodyParts.head = headSelect.value;
            localStorage.setItem("head", this.player.bodyParts.head);
        });
        armsSelect.addEventListener("change", (event) => {
            this.player.bodyParts.arms = armsSelect.value;
            localStorage.setItem("arms", this.player.bodyParts.arms);
        });
        legsSelect.addEventListener("change", (event) => {
            this.player.bodyParts.legs = legsSelect.value;
            localStorage.setItem("legs", this.player.bodyParts.legs);
        });

        // set up the mobs list ready to kick off
        if (!this.headless) {
            this.mobs.push(this.player);
        }
        this.network.updatePlayerList(this.mobs);
        this.holdItem(this.player.quickSlots[0]);

        // honour a server parameter if its there so we can pass links
        // to each other

        if (params.get("server") && params.get("server") !== this.serverId) {
            this.isHostingTheServer = false;
            this.ui.serverIdInput.value = params.get("server")!;
        }

        const installLocation = params.get("install");
        if (installLocation) {
            setTimeout(() => {
                if (window.confirm("Do you want to install mod from " + params.get("install") + "?")) {
                    this.loadModFromUrl(installLocation);
                }
            }, 1000);
        }

        console.log("Connect to this server on: " + this.serverId)
        document.getElementById("serverLink")!.innerHTML = this.serverId;

        this.configureEventHandlers();
    }

    private async loadHeadlessMods(): Promise<void> {
        console.log("Install Mods");
        const params = new URLSearchParams(location.search);
        const headlessMods = JSON.parse(params.get("mods") ?? "[]");
        for (const mod of headlessMods) {
            await this.loadModFromUrl(mod, false);
        }
    }

    private async loadModFromUrl(url: string, logging: boolean = true): Promise<void> {
        console.log("Loading mod from: " + url);
        let targetUrl = url;
        if (!targetUrl.startsWith("https://modserver/")) {
            targetUrl = "https://unearthedgame.net/getmod.php?p=" + Date.now() + "&url=" + encodeURIComponent(url);
        }
        fetch(targetUrl).then(async (response: Response) => {
            if (url.endsWith(".js")) {
                const modData: any = {};
                modData["mod.js"] = await response.text();
                this.serverSettings.addMod(modData, true, logging);
            } else {
                // ZIP with resources
                new JSZip().loadAsync(await response.blob()).then((zip: JSZip) => {
                    const modData: any = {};
                    let count = 0;
                    zip.forEach((path, file) => {
                        count++;
                        file.async(path.endsWith(".js") || path.endsWith(".json") ? "string" : "base64").then((value: string) => {
                            modData[path] = value;
                            count--;
                            if (count === 0) {
                                this.serverSettings.addMod(modData, true, logging);
                            }
                        });
                    });
                });
            }
        });
    }

    /**
     * Notification that a controller button was pressed
     * 
     * @param button The index of hte button pressed
     */
    buttonPressed(button: number): void {
        if (this.connecting && this.network.connectionFailed) {
            this.connecting = false;
            this.backToMainMenu();
            return;
        }

        if (this.network.connected() && this.controllerSetupStep === -1) {
            if (button === this.controllerButtons.next) {
                this.nextQuickSlot();
            }
            if (button === this.controllerButtons.prev) {
                this.prevQuickSlot();
            }
            if (button === this.controllerButtons.layer) {
                this.togglePlacementLayer();
            }
            if (button === this.controllerButtons.trigger) {
                this.trigger();
            }
        }
    }

    backToMainMenu(): void {
        document.getElementById("connect")!.style.display = "block";
    }

    /**
     * Retrieve any mods that have been installed 
     */
    get mods(): ConfiguredMods {
        return this.serverSettings.getConfiguredMods();
    }

    /**
     * Notification that a controller button was released
     * 
     * @param button The index of hte button released
     */
    buttonReleased(button: number): void {
        if ((button > 0) && (button < 4)) {
            this.mouseButtonDown[0] = false;
        }
    }

    startControllerSetup(): void {
        document.getElementById("connect")!.style.display = "none";
        document.getElementById("settingsPanel")!.style.display = "none";
        this.controllerSetupSteps = CONTROLLER_SETUP_STEPS;
        this.controllerSetupStep = 0;
    }

    startKeyboardSetup(): void {
        document.getElementById("connect")!.style.display = "none";
        document.getElementById("settingsPanel")!.style.display = "none";
        this.controllerSetupSteps = KEYS_SETUP_STEPS;
        this.controllerSetupStep = 0;
    }

    /**
     * Show a tool tip for a few seconds
     * 
     * @param tip The message to show
     */
    showTip(tip: string) {
        this.tooltipDiv.style.display = "block";
        this.tooltipDiv.innerHTML = tip;
        this.timeTooltipShown = Date.now();
    }

    togglePlacementLayer(): void {
        this.placingTilesOnFrontLayer = !this.placingTilesOnFrontLayer;

        if (this.placingTilesOnFrontLayer) {
            playSfx("foreground", 0.3);
        } else {
            playSfx("background", 0.3);
        }
    }

    /**
     * Configure the event handlers that manage keyboard, mouse and touch state.
     */
    configureEventHandlers() {
        // keydown handler
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if (this.connecting && this.network.connectionFailed) {
                this.connecting = false;
                this.backToMainMenu();
                return;
            }

            if (this.controllerSetupStep >= 0 && event.code === "Escape") {
                this.controllerSetupStep = -1;
                document.getElementById("settingsPanel")!.style.display = "block";
                return;
            }

            if (event.code === "Escape") {
                hideCodeEditor();
                this.inventPanel.hide();
                this.recipePanel.hide();
            }

            // if we're focused on the chat input that takes precedence
            if (document.activeElement === this.ui.chatInput || document.activeElement === this.ui.playernameInput ||
                document.activeElement === this.ui.portalInput || document.activeElement === this.ui.serverIdInput) {
                return;
            }
            if (document.activeElement !== this.canvas && document.activeElement !== document.body && document.activeElement) {
                return;
            }

            if (event.code === this.keyControls.invent) {
                this.inventPanel.showing() ? this.inventPanel.hide() : this.inventPanel.show();
                event.preventDefault();
                event.stopPropagation();
            }

            if (this.ui.codeEditorShowing()) {
                return;
            }

            // record the keyboard state
            this.keyDown[event.code] = true;

            for (let i = 1; i < 10; i++) {
                if (this.keyDown["Digit" + i]) {
                    if (this.player.itemHeld !== this.player.quickSlots[i - 1]) {
                        this.holdItem(this.player.quickSlots[i - 1]);
                        this.quickSlotSelected = i - 1;
                        playSfx('click', 1);
                    } else {
                        this.holdItem(null);
                        this.quickSlotSelected = -1;
                        playSfx('click', 1);
                    }
                }
            }

            // if the user hits enter and we're connected to the game
            // then show the chat box
            if (this.network.connected()) {
                if (event.code === "Enter" && this.ui.portalInput!.style.display !== 'block') {
                    this.ui.showChat();
                }
            }

            // Pressing Q/E cycles through cycles through the inventory
            if (event.code === this.keyControls.prev) {
                if (this.inventPanel.showing()) {
                    this.inventPanel.prevItem();
                } else if (this.recipePanel.showing()) {
                    this.recipePanel.prevItem();
                } else {
                    this.prevQuickSlot();
                }
            }
            if (event.code === this.keyControls.next) {
                if (this.inventPanel.showing()) {
                    this.inventPanel.nextItem();
                } else if (this.recipePanel.showing()) {
                    this.recipePanel.nextItem();
                } else {
                    this.nextQuickSlot();
                }
            }

            // Pressing X changes the layer we're targeting
            if (event.code === this.keyControls.layer) {
                if (this.inventPanel.showing()) {
                    this.inventPanel.layer();
                } else if (this.recipePanel.showing()) {
                    this.recipePanel.layer();
                } else {
                    this.togglePlacementLayer();
                }
            }

            if (event.code === this.keyControls.trigger) {
                if (this.inventPanel.showing()) {
                    this.inventPanel.trigger();
                } else if (this.recipePanel.showing()) {
                    this.recipePanel.trigger();
                } else {
                    this.trigger();
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        });

        // mouse up, just maintain state
        document.addEventListener("keyup", (event: KeyboardEvent) => {
            this.keyDown[event.code] = false;
        });

        // get rid of the right click menu in the browser
        this.canvas.addEventListener('contextmenu', event => event.preventDefault());

        // on mobile we need to use touch events, they still forward to the
        // same handlers as mouse
        if (isMobile()) {
            this.canvas.addEventListener("touchmove", (event: TouchEvent) => {
                for (let i = 0; i < event.changedTouches.length; i++) {
                    const touch = event.changedTouches.item(i);
                    if (touch) {
                        this.mouseMove(touch.clientX * ZOOM, touch.clientY * ZOOM, touch.identifier);
                    }
                }
                event.preventDefault();
            });

            this.canvas.addEventListener("touchstart", (event: TouchEvent) => {
                for (let i = 0; i < event.changedTouches.length; i++) {
                    const touch = event.changedTouches.item(i);
                    if (touch) {
                        this.mouseDown(touch.clientX * ZOOM, touch.clientY * ZOOM, touch.identifier);
                        this.mouseMove(touch.clientX * ZOOM, touch.clientY * ZOOM, touch.identifier);
                    }
                }
                event.preventDefault();
            });

            this.canvas.addEventListener("touchend", (event: TouchEvent) => {
                for (let i = 0; i < event.changedTouches.length; i++) {
                    const touch = event.changedTouches.item(i);
                    if (touch) {
                        this.mouseUp(touch.clientX * ZOOM, touch.clientY * ZOOM, touch.identifier);
                    }
                }
                event.preventDefault();
            });
        } else {
            // on desktop we just use mouse events
            this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
                this.mouseMove(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });
            this.canvas.addEventListener("mousedown", (event: MouseEvent) => {
                this.mouseDown(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });
            this.canvas.addEventListener("wheel", (event: WheelEvent) => {
                if (this.inventPanel.showing()) {
                    this.inventPanel.wheel(event.deltaY);
                } else if (this.recipePanel.showing()) {
                    this.recipePanel.wheel(event.deltaY);
                }
            });

            this.canvas.addEventListener("mouseup", (event: MouseEvent) => {
                this.mouseUp(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });
        }
    }

    /**
     * Move the previous quick slot
     */
    prevQuickSlot() {
        const rows = (isMobile()) ? 1 : 2;
        this.quickSlotSelected--;
        if (this.quickSlotSelected < -1) {
            this.quickSlotSelected = (rows * 4) - 1;
        }
        this.holdItem(this.player.quickSlots[this.quickSlotSelected]);
        playSfx('click', 1);
    }

    /**
     * Move the next quick slot
     */
    nextQuickSlot() {
        const rows = (isMobile()) ? 1 : 2;
        this.quickSlotSelected++;
        if (this.quickSlotSelected >= (rows * 4)) {
            this.quickSlotSelected = 0;
        }
        this.holdItem(this.player.quickSlots[this.quickSlotSelected]);
        playSfx('click', 1);
    }

    /**
     * Mouse or Touch has been pressed
     * 
     * @param x The x coordinate of the location in canvas coordinates that the press happened at
     * @param y The y coordinate of the location in canvas coordinates that the press happened at
     * @param touchId The ID of the touch (or 1 for mouse) the occurred. This is used to manage
     * multi-touch controls on mobile.
     */
    mouseDown(x: number, y: number, touchId: number) {
        confirmAudioContext();

        if (this.connecting && this.network.connectionFailed) {
            this.connecting = false;
            this.backToMainMenu();
            return;
        }

        if (this.inventPanel.showing()) {
            this.inventPanel.mouseDown(x, y);
            return;
        }
        if (this.recipePanel.showing()) {
            this.recipePanel.mouseDown(x, y);
            return;
        }

        let foundInventButton = false;
        let foundControlButton = false;

        // if we're in limited screen mode then the controls have moved
        // a bit so adjust the coordinates 
        if (this.limitedPortraitScreen) {
            y += 160;
        }
        if (this.limitedLandscapeScreen) {
            x -= (-(this.canvas.width / 2) + 370);
        }

        // if we've touched in the inventory area work out which item
        // we hit and apply it
        const rows = (isMobile()) ? 1 : 2;
        const xp = Math.floor((x - (this.canvas.width - (4 * 130) - 10)) / 130);
        const yp = Math.floor((y - (this.canvas.height - (rows * 130) - 10)) / 130);
        let index = (xp + (yp * 4));
        if (yp >= 0 && yp < rows) {
            if (xp < 4 && xp >= 0) {
                if (index >= 0 && index < this.player.quickSlots.length) {
                    foundInventButton = true;
                    if (this.player.itemHeld !== this.player.quickSlots[index]) {
                        this.quickSlotSelected = index;
                        this.holdItem(this.player.quickSlots[this.quickSlotSelected]);
                        playSfx('click', 1);
                    } else {
                        this.holdItem(null);
                        this.quickSlotSelected = -1;
                        playSfx('click', 1);
                    }
                }
            }
        }

        // if we've hit the layer toggle button then apply it
        if (x > this.canvas.width - 680 && y > this.canvas.height - 140 && x < this.canvas.width - 680 + 126 && y < this.canvas.height - 140 + 125) {
            this.placingTilesOnFrontLayer = !this.placingTilesOnFrontLayer;
            foundInventButton = true;
            this.showTip("Placing Tiles on " + (this.placingTilesOnFrontLayer ? "Foreground" : "Background"));
        } else if (x > this.canvas.width - 810 && y > this.canvas.height - 140 && x < this.canvas.width - 680 + 126 && y < this.canvas.height - 140 + 125) {
            this.inventPanel.show();
        }
        if (this.limitedPortraitScreen) {
            y -= 160;
        }
        if (this.limitedLandscapeScreen) {
            x += (-(this.canvas.width / 2) + 370);
        }

        // now consider mobile controls 
        foundControlButton = this.evalControlArea(x, y, touchId);

        // finally if we haven't hit any UI (either inventory or controls) then
        // treat this mousedown as a main area click/press/touch
        if (!foundInventButton && !foundControlButton && this.mainAreaTouchId === 0) {
            // consider wiring blocks
            if (this.showWiring) {
                const tx = ((this.mouseX + Math.floor(this.viewX)) / TILE_SIZE);
                const ty = ((this.mouseY + Math.floor(this.viewY)) / TILE_SIZE);

                const sx = Math.floor((tx - Math.floor(tx)) * 4);
                const sy = Math.floor((ty - Math.floor(ty)) * 4);
                const index = sx + (sy * 4);

                if ((index >= 0) && (index < 8)) {
                    // input socket
                    this.gameMap.inputSocketSelected(Math.floor(tx), Math.floor(ty), this.placingTilesOnFrontLayer ? Layer.FOREGROUND : Layer.BACKGROUND, index);
                } else if (index < 16) {
                    this.gameMap.outputSocketSelected(Math.floor(tx), Math.floor(ty), this.placingTilesOnFrontLayer ? Layer.FOREGROUND : Layer.BACKGROUND, index -8);
                }
            }


            this.mainAreaTouchId = touchId;
            this.mouseButtonDown[0] = true;
        }
    }

    /**
     * Evaluate the mouse button in regard to the mobile controls
     * 
     * @param x The x coordinate of the mouse press/touch
     * @param y The y coordinate of the mouse press/touch
     * @param touchId The ID of the touch used to track multi-touch on mobile devices
     * @returns True if the mobile controls were being interacted with
     */
    private evalControlArea(x: number, y: number, touchId: number): boolean {
        if (!isMobile()) {
            return false;
        }

        // check we're in the right area
        if ((y * 2 > this.canvas.height - 300)) {
            let xp = Math.floor((x - 20) / 160);
            let yp = Math.floor((y - (this.canvas.height - 300)) / 160);

            // if we're pressing on the jump control 
            // pretend W was pressed
            if (x > this.canvas.width - 180 && yp === 1) {
                // up
                this.keyDown[this.keyControls.up] = true;
                this.keyDown[this.keyControls.down] = false;
                this.keyDown[this.keyControls.trigger] = false;
                this.jumpTouchId = touchId;
                return true;
            }
            // if we're pressing on the jump control 
            // pretend S was pressed
            if (x > this.canvas.width - 360 && yp === 1) {
                // down
                this.keyDown[this.keyControls.down] = true;
                this.keyDown[this.keyControls.up] = false;
                this.keyDown[this.keyControls.trigger] = false;
                this.jumpTouchId = touchId;
                return true;
            }
            // if we're pressing on the trigger control 
            // pretend R was pressed
            if (x > this.canvas.width - 520 && yp === 1) {
                // trigger
                this.keyDown[this.keyControls.down] = false;
                this.keyDown[this.keyControls.up] = false;
                if (this.keyDown[this.keyControls.trigger] === false) {
                    this.keyDown[this.keyControls.trigger] = true;
                    this.trigger();
                }

                this.jumpTouchId = touchId;
                return true;
            }

            // if we're pressing on the left control 
            // pretend A was pressed
            if (xp == 0 && yp === 1) {
                // left
                this.keyDown[this.keyControls.left] = true;
                this.keyDown[this.keyControls.right] = false;
                this.controllerTouchId = touchId;
                return true;
            }
            // if we're pressing on the right control 
            // pretend D was pressed
            if (xp == 1 && yp === 1) {
                // right
                this.keyDown[this.keyControls.right] = true;
                this.keyDown[this.keyControls.left] = false;
                this.controllerTouchId = touchId;
                return true;
            }
        }

        return false;
    }

    /**
     * Mouse or Touch has been released
     * 
     * @param x The x coordinate of the location in canvas coordinates that the release happened at
     * @param y The y coordinate of the location in canvas coordinates that the release happened at
     * @param touchId The ID of the touch (or 1 for mouse) the occurred. This is used to manage
     * multi-touch controls on mobile.
     */
    private mouseUp(x: number, y: number, touchId: number) {
        confirmAudioContext();

        if (this.inventPanel.showing()) {
            this.inventPanel.mouseUp(x, y);
            return;
        }
        if (this.recipePanel.showing()) {
            this.recipePanel.mouseUp(x, y);
            return;
        }

        if (touchId === this.mainAreaTouchId) {
            this.mainAreaTouchId = 0;
            this.mouseButtonDown[0] = false;
        }
        if (touchId === this.jumpTouchId) {
            this.keyDown[this.keyControls.up] = false;
            this.keyDown[this.keyControls.down] = false;
            this.keyDown[this.keyControls.trigger] = false;
            this.jumpTouchId = 0;
        }
        if (touchId === this.controllerTouchId) {
            this.keyDown[this.keyControls.left] = false;
            this.keyDown[this.keyControls.right] = false;
            this.controllerTouchId = 0;
        }
    }

    /**
     * Mouse or Touch has been moved
     * 
     * @param x The x coordinate of the location in canvas coordinates that the move happened at
     * @param y The y coordinate of the location in canvas coordinates that the move happened at
     * @param touchId The ID of the touch (or 1 for mouse) the occurred. This is used to manage
     * multi-touch controls on mobile.
     */
    private mouseMove(x: number, y: number, touchId: number) {
        if (this.inventPanel.showing()) {
            this.inventPanel.mouseMove(x, y);
            return;
        }
        if (this.recipePanel.showing()) {
            this.recipePanel.mouseMove(x, y);
            return;
        }

        if (touchId === this.mainAreaTouchId || !isMobile()) {
            this.mouseX = x;
            this.mouseY = y;
        }
        if (touchId === this.controllerTouchId || touchId === this.jumpTouchId) {
            this.evalControlArea(x, y, touchId);
        }
    }

    /**
     * Trigger whatever block we're on
     */
    private trigger() {
        const x = Math.floor(this.player.x / TILE_SIZE);
        const y = Math.floor(this.player.y / TILE_SIZE);

        this.playerTriggeredLocation(this.player, x, y, true);
    }

    /**
     * Utility for firing when a trigger is fired
     * 
     * @param player The player that pressed the trigger
     * @param x The x coordinate of the location of the triggered tile
     * @param y The y coordinate of the location of the triggered tile
     * @param local True if if this was a local player (as opposed to a remote one from the network)
     */
    playerTriggeredLocation(player: Mob, x: number, y: number, local: boolean) {
        if (local) {
            this.triggerPortal(x, y);
            this.network.sendTrigger(x, y);
        }

        this.mods.trigger(player, x, y);
    }

    /**
     * Triggers the portal to assign it a code
     */
    private triggerPortal(x: number, y: number) {
        const tileIndex = x + y * MAP_WIDTH;
        const portal = this.gameMap.metaData.portals.find(portal => portal.tileIndex === tileIndex);
        if (portal) {
            if (portal.code === null) {
                this.ui.showPortal();
            } else {
                const portalTile = BLOCKS[this.gameMap.getTile(x, y, Layer.FOREGROUND)];
                if (portalTile.portal) {
                    portalTile.portal(portal);
                }
            }
        }
    }

    /**
     * Start the game loop 
     */
    startLoop() {
        requestAnimationFrame(() => { this.loop() });
        setInterval(() => { this.update(); }, Math.floor(1000 / 60));
    }

    private update() {
        const delta = Date.now() - this.lastUpdate;

        this.gamepad.update();

        if (this.network.connected() && this.controllerSetupStep === -1) {
            this.holdItem(this.player.quickSlots[this.quickSlotSelected]);

            for (let loop = 0; loop < delta / Math.floor(1000 / 60); loop++) {
                if (this.isHostingTheServer) {
                    this.mods.tick();
                }

                this.lastUpdate += Math.floor(1000 / 60);
                let ox = this.player.x - (this.canvas.width / 2);
                const oy = this.player.y - (this.canvas.height / 2);
                ox = Math.min(Math.max(0, ox), (MAP_WIDTH * TILE_SIZE) - this.canvas.width);

                // update the mouse over indicator
                this.viewX = ox;
                this.viewY = oy;

                this.player.overX = Math.floor((this.mouseX + Math.floor(ox)) / TILE_SIZE);
                this.player.overY = Math.floor((this.mouseY + Math.floor(oy)) / TILE_SIZE);

                // the second dpad can be used to dig
                const gpx = (this.gamepad.altRight ? 1 : 0) + (this.gamepad.altLeft ? -1 : 0);
                const gpy = (this.gamepad.altDown ? 1 : 0) + (this.gamepad.altUp ? -1 : 0);
                if (gpx !== 0 || gpy !== 0) {
                    this.player.overX = Math.floor(this.player.x / TILE_SIZE) + gpx;
                    this.player.overY = Math.floor(this.player.y / TILE_SIZE) + gpy;
                    this.mouseButtonDown[0] = true;
                    this.gamepadUsedToDig = true;
                } else if (this.gamepadUsedToDig) {
                    this.mouseButtonDown[0] = false;
                    this.gamepadUsedToDig = false;
                }

                // check if the mouse over location is somewhere our player can act on
                const px = Math.floor(this.player.x / TILE_SIZE);
                const py = Math.floor(this.player.y / TILE_SIZE);
                const dx = this.player.overX - px;
                const dy = this.player.overY - py;

                let canAct = (Math.abs(dx) < 2) && (dy > -3) && (dy < 2) && (dx !== 0 || dy !== 0);

                // local player specifics - set the initial state to doing nothing
                this.player.still();

                // if we were mining but we stopped pressing the button 
                // then clear the block damage indicator to reset it
                if ((this.lastWorkY !== this.player.overY) || (this.lastWorkX !== this.player.overX) || (!this.mouseButtonDown[0])) {
                    this.player.blockDamage = 0;
                }

                // if we're pressing down and the we can act on the location and theres
                // a tile to dig there, then mark us as working
                if (this.mouseButtonDown[0] && canAct && this.gameMap.getTile(this.player.overX, this.player.overY,
                    this.placingTilesOnFrontLayer ? Layer.FOREGROUND : Layer.BACKGROUND) !== 0) {
                    this.lastWorkX = this.player.overX;
                    this.lastWorkY = this.player.overY;
                }
                // tell the player its got the mouse down for network state update
                if (this.mouseButtonDown[0] && canAct) {
                    this.player.controls.mouse = true;
                }

                this.player.localUpdate();

                // update controls for the the player so network state can be sent
                if (this.keyDown[this.keyControls.right] || this.gamepad.right) {
                    this.player.controls.right = true;
                }
                if (this.keyDown[this.keyControls.left] || this.gamepad.left) {
                    this.player.controls.left = true;
                }
                if (this.keyDown[this.keyControls.down] || this.gamepad.down) {
                    this.player.controls.down = true;
                }
                if (this.keyDown[this.keyControls.up] || this.gamepad.up || this.gamepad.buttons[this.controllerButtons.jump]) {
                    this.player.controls.up = true;
                }

                this.gameMap.update();

                // finally draw update and draw the mobs
                for (const mob of [...this.mobs]) {
                    mob.update(this.animTime, !this.placingTilesOnFrontLayer);
                    mob.standingOverride = false;
                }
                for (const mob of [...this.mobs]) {
                    if (mob.blocksMovement) {
                        continue;
                    }

                    // check if we're now intersecting with another mob
                    const collisionMob = this.gameMap.collideMobs(mob);
                    if (collisionMob) {
                        // move out of the collision 
                        const dy = Math.min(TILE_SIZE / 2, (collisionMob.height + mob.height) - Math.abs(collisionMob.y - mob.y));
                        const dx = Math.min(TILE_SIZE / 2, (collisionMob.width + mob.width) - Math.abs(collisionMob.x - mob.x));

                        // move the smallest amount to get out of the collision
                        // or use the direction movement
                        if (dx < dy && collisionMob.vy === 0) {
                            let pushedLeft = collisionMob.x > mob.x;
                            mob.y += collisionMob.vy;

                            if (pushedLeft) {
                                if (mob.evalBlockedLeft(-dx)) {
                                    collisionMob.state.blockedLeft = true;
                                }
                            } else {
                                if (mob.evalBlockedRight(dx)) {
                                    collisionMob.state.blockedRight = true;
                                }
                            }
                        } else {
                            let pushedUp = collisionMob.y > mob.y;
                            if (pushedUp) {
                                mob.x += collisionMob.vx;
                            }

                            if (pushedUp) {
                                mob.standingOverride = true;
                                mob.y -= dy;
                                if (mob.evalBlockedUp()) {
                                    collisionMob.state.blockedAbove = true;
                                }
                                // when we're falling we want to jump a frame since the block
                                // will have moved away from us
                                mob.y += collisionMob.vy + mob.gravity;
                                mob.vy = 0;
                            } else {
                                mob.y += dy;
                                if (mob.evalBlockedDown()) {
                                    collisionMob.state.blockedBelow = true;
                                }
                                mob.y += collisionMob.vy;
                                mob.vy = 0;
                            }
                        }
                    }
                }
                for (const mob of [...this.mobs]) {
                    mob.think();
                }
            }
        } else {
            this.lastUpdate = Date.now();
        }
    }

    /**
     * Load any controller configuration stored in local storage
     */
    private loadControllerSetup(): void {
        const config = localStorage.getItem("controller");
        if (config) {
            try {
                const setup = JSON.parse(config);
                this.gamepad.axesConfigured = setup.axes;
                // cope with missing controls
                Object.assign(this.controllerButtons, setup.buttons);
            } catch (e) {
                // do nothing, invalid JSON
            }
        }

        const keysetup = localStorage.getItem("keysetup-v2");
        if (keysetup) {
            try {
                const setup = JSON.parse(keysetup);
                Object.assign(this.keyControls, setup);
            } catch (e) {
                // do nothing, invalid JSON
            }
        } else {
            console.log("Using default keys so map through keyboard");
            // we're using the default configuration so lets map that through 
            // the keyboard layout setup if we have one
            const keyboard = (navigator as any).keyboard;
            if (keyboard && keyboard.getLayoutMap) {
                keyboard.getLayoutMap().then((keyboardLayoutMap: { get(key: string): string }) => {
                    for (const key of Object.keys(this.keyControls)) {
                        const kc = (this.keyControls as any);
                        kc[key] = "Key" + keyboardLayoutMap.get(kc[key]).toUpperCase();
                    }
                });
            }
        }
    }

    /**
     * Save the current controller configuration to local storage
     */
    private saveControllerSetup(): void {
        const setup = {
            axes: this.gamepad.axesConfigured,
            buttons: this.controllerButtons,
        };

        localStorage.setItem("controller", JSON.stringify(setup));

        localStorage.setItem("keysetup-v2", JSON.stringify(this.keyControls));
    }

    /**
     * The main game loop
     */
    private loop() {
        // if we've finished the splash screen hide it
        if (Date.now() > this.finishStartup) {
            document.getElementById("splash")!.style.display = "none";
        }
        // if the tooltip has expired clear that 
        if (Date.now() - this.timeTooltipShown > 5000) {
            this.tooltipDiv.style.display = "none";
        }

        // work out the delta to the last frame. If we've got a 120hz 
        // monitor our loop is going to get hit too often
        // so skip a frame
        const delta = Date.now() - this.lastFrame;
        if (delta < 10) {
            requestAnimationFrame(() => { this.loop() });
            return;
        }
        this.lastFrame = Date.now();

        // move the animation forward
        this.animTime += 0.03;
        this.animTime = this.animTime % 1;

        if (resourcesLoaded()) {
            this.g.doneLoadingImages(SPRITES)
        }

        // determine the scale of the screen and any limitation
        // on the viewing area
        this.canvas.width = document.body.clientWidth * ZOOM;
        this.canvas.height = document.body.clientHeight * ZOOM;
        const isLandscape = this.canvas.width > this.canvas.height;
        this.limitedLandscapeScreen = isMobile() && isLandscape;
        this.limitedPortraitScreen = isMobile() && !isLandscape;

        this.canvas.focus();

        this.g.save();

        let ox = this.player.x - (this.canvas.width / 2);
        const oy = this.player.y - (this.canvas.height / 2);
        ox = Math.min(Math.max(0, ox), (MAP_WIDTH * TILE_SIZE) - this.canvas.width);

        const skyColor = toColorComponents(this.globalProperties[GameProperty.SKY_COLOR] as string);
        if (skyColor) {
            this.g.clearScreen(skyColor.r, skyColor.g, skyColor.b);
        }

        const backgrounds = [{
            sprite: "bg/clouds",
            parallax: 6,
            scale: 2,
            offset: 0
        }, {
            sprite: "bg/hills",
            parallax: 3,
            scale: 2,
            offset: 400
        }];

        for (const bg of backgrounds) {
            const background = getSprite(bg.sprite);
            if (background.getWidth()) {
                this.g.save();
                this.g.translate(-((ox / bg.parallax) % (background.getWidth() * bg.scale)), bg.offset);
                for (let x = 0; x < this.canvas.width * 2; x += (background.getWidth() * bg.scale) - bg.scale) {
                    // draw the background clouds
                    this.g.drawScaledImage(background, x, 0, background.getWidth() * bg.scale, background.getHeight() * bg.scale);
                }
                this.g.restore();
            }
        }

        if (this.controllerSetupStep >= 0) {
            requestAnimationFrame(() => { this.loop() });

            this.g.setFillColor(0, 0, 0, 0.2);
            this.g.fillRect(0, 270, this.canvas.width, 400);
            this.g.setTextAlign("center");
            this.g.setFillColor(0, 0, 0, 1);
            this.g.save();
            this.g.translate(5, 5);
            this.g.setFont("120px KenneyFont");
            this.g.fillText(this.controllerSetupSteps[this.controllerSetupStep].getLabel(), this.canvas.width / 2, 400);
            this.g.setFont("60px KenneyFont");
            this.g.fillText("(or press escape to cancel)", this.canvas.width / 2, 600);
            this.g.restore();
            this.g.setFillColor(255, 255, 255, 1);
            this.g.setFont("120px KenneyFont");
            this.g.fillText(this.controllerSetupSteps[this.controllerSetupStep].getLabel(), (this.canvas.width / 2), 400);
            this.g.setFont("60px KenneyFont");
            this.g.fillText("(or press escape to cancel)", this.canvas.width / 2, 600);

            if (this.controllerSetupSteps[this.controllerSetupStep].check(this)) {
                this.controllerSetupStep++;
                if (this.controllerSetupStep >= (this.controllerSetupSteps.length)) {
                    this.controllerSetupStep = -1;
                    this.saveControllerSetup();
                    document.getElementById("settingsPanel")!.style.display = "block";
                }
            }
            return;
        }

        // if the network hasn't been started we're at the main menu
        if (!this.network.connected() || !this.network.hadMap || !this.network.readyToRender) {
            // update the sample player
            this.network.update(this.player, this.mobs);
            requestAnimationFrame(() => { this.loop() });

            this.g.setFillColor(0, 0, 0, 1);

            // draw the logo and version number
            const logo = getSprite("logo");
            if (this.limitedLandscapeScreen) {
                this.g.drawImage(logo, (this.canvas.width - logo.getWidth()) / 2, 5);
                this.g.setFont("30px KenneyFont");
                this.g.setTextAlign("center");
                this.g.fillText("Version _VERSION_", this.canvas.width / 2, logo.getHeight() + 30);

            } else if (this.limitedPortraitScreen) {
                this.g.drawImage(logo, (this.canvas.width - logo.getWidth()) / 2, 300);
                this.g.setFont("30px KenneyFont");
                this.g.setTextAlign("center");
                this.g.fillText("Version _VERSION_", this.canvas.width / 2, logo.getHeight() + 330);
            } else {
                this.g.drawScaledImage(logo, (this.canvas.width - (logo.getWidth() * 2)) / 2, 200, logo.getWidth() * 2, logo.getHeight() * 2);
                this.g.setFont("50px KenneyFont");
                this.g.setTextAlign("center");
                this.g.fillText("Version _VERSION_", this.canvas.width / 2, 250 + (logo.getHeight() * 2));

                this.g.setTextAlign("center");
                this.g.setFont("60px KenneyFont");
                this.g.save();
                this.g.translate((this.canvas.width / 2) + (logo.getWidth() / 2) + 150, 150 + (logo.getHeight() * 2));
                this.g.rotate(-(Math.PI / 8) - (Math.PI / 32) + (Math.sin(Math.PI * this.animTime) * (Math.PI / 32)));
                this.g.setFillColor(0, 0, 0, 1);
                this.g.fillText(this.motd, 1, 1);
                this.g.setFillColor(0, 255, 0, 1);
                this.g.fillText(this.motd, 0, 0);
                this.g.restore();
            }

            // draw the sample player 
            if (resourcesLoaded() && !this.connecting) {
                if (this.limitedPortraitScreen) {
                    this.g.translate((this.canvas.width / 2), (this.canvas.height / 2) + 740);
                } else if (this.limitedLandscapeScreen) {
                    this.g.translate((this.canvas.width / 2) + 700, (this.canvas.height / 2) + 40);
                } else {
                    this.g.translate((this.canvas.width / 2) + 500, (this.canvas.height / 2) + 40);
                }
                this.g.scale(1.5, 1.5);
                this.player.still();
                this.player.controls.right = true;
                this.player.update(this.animTime, false)
                this.player.x = 0;
                this.player.flip = true;
                this.player.y = 0;
                this.player.draw(this.g, false);
                this.player.x = 200;
                this.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
            } else {
                this.g.setFont("80px KenneyFont");
                this.g.setTextAlign("center");
                if (this.network.connectionFailed) {
                    this.g.fillText("Connection Failed", this.canvas.width / 2, this.canvas.height / 2);
                    this.g.setFont("60px KenneyFont");
                    this.g.setTextAlign("center");
                    this.g.fillText(this.network.connectionFailedReason, this.canvas.width / 2, (this.canvas.height / 2) + 80);
                } else {
                    this.g.fillText("Connecting", this.canvas.width / 2, this.canvas.height / 2);
                }
            }
            this.g.restore();
            this.g.render();

            if (this.headless) {
                this.loadHeadlessMods().then(() => {
                    this.ui.startGame();;
                })
            }
            return;
        }

        // so now we know the network is started (or the pretend network is) and 
        // all the resources are loaded so we can render the real game
        if (resourcesLoaded()) {
            this.network.update(this.player, this.mobs);
            // scroll the view based on bounds and player position
            this.g.translate(-Math.floor(ox), -Math.floor(oy));

            // draw the underground background
            const bgColor = toColorComponents(this.globalProperties[GameProperty.BACKGROUND_COLOR] as string);
            if (bgColor) {
                this.g.setFillColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a / 255);
                this.g.fillRect(0, SKY_HEIGHT * 128, MAP_WIDTH * 128, MAP_DEPTH * 128);
            }

            // update the mouse over indicator
            if (!this.gamepadUsedToDig) {
                this.player.overX = Math.floor((this.mouseX + Math.floor(ox)) / TILE_SIZE);
                this.player.overY = Math.floor((this.mouseY + Math.floor(oy)) / TILE_SIZE);
            }

            // check if the mouse over location is somewhere our player can act on
            const px = Math.floor(this.player.x / TILE_SIZE);
            const py = Math.floor(this.player.y / TILE_SIZE);
            const dx = this.player.overX - px;
            const dy = this.player.overY - py;

            let canAct = (Math.abs(dx) < 2) && (dy > -3) && (dy < 2) && (dx !== 0 || dy !== 0);

            // render the whole game map
            this.gameMap.render(this.g, this.player.overX, this.player.overY, canAct, ox, oy, this.canvas.width, this.canvas.height);

            // finally draw update and draw the mobs
            for (const mob of [...this.mobs]) {
                this.g.setGlobalAlpha(1.1 + Math.sin(Date.now() / 55) * .1)
                mob.draw(this.g, SHOW_BOUNDS);
                this.g.setGlobalAlpha(1)

                if (Date.now() - mob.lastUpdate > 10000 && !mob.local) {
                    this.mobs.splice(this.mobs.indexOf(mob), 1);
                }
            }

            this.gameMap.drawLightMap(this.g, this.player.overX, this.player.overY, canAct, ox, oy, this.canvas.width, this.canvas.height);
        }

        renderAndUpdateParticles(this.g);

        this.g.restore();


        // Draw the UI components

        // if we have limited screen real estate adjust the positions of the UI
        if (this.limitedPortraitScreen) {
            this.g.save();
            this.g.translate(0, -160);
        }
        if (this.limitedLandscapeScreen) {
            this.g.save();
            this.g.translate(-(this.canvas.width / 2) + 370, 0);
        }

        // draw the quick slot tiles 
        let index = 0;
        const rows = (isMobile()) ? 1 : 2;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < 4; x++) {
                const xp = this.canvas.width - (4 * 130) + (x * 130) - 10;
                const yp = this.canvas.height - (rows * 130) + (y * 130) - 10;

                const item = this.player.quickSlots[index];

                InventPanel.drawItem(this, this.g, item, xp, yp, index === this.quickSlotSelected);
                index++;
            }
        }

        // draw the tile layer selector
        this.g.drawScaledImage(getSprite(this.placingTilesOnFrontLayer ? "ui/front" : "ui/back"), this.canvas.width - 680, this.canvas.height - 140, 125, 125);
        this.g.drawScaledImage(getSprite("ui/invent"), this.canvas.width - 810, this.canvas.height - 140, 125, 125);

        if (this.limitedPortraitScreen || this.limitedLandscapeScreen) {
            this.g.restore();
        }

        // draw the mobile controls
        if (isMobile()) {
            this.g.drawScaledImage(getSprite("ui/left"), 20, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/right"), 180, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/up"), this.canvas.width - 200, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/down"), this.canvas.width - 360, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/trigger"), this.canvas.width - 520, this.canvas.height - 160, 140, 140);
        }

        if (this.inventPanel.showing()) {
            this.inventPanel.draw(this.g);
        }
        if (this.recipePanel.showing()) {
            this.recipePanel.draw(this.g);
        }

        this.g.render();

        // schedule our next frame
        requestAnimationFrame(() => { this.loop() });
    }

    showRecipePanel(): void {
        this.inventPanel.hide();
        this.recipePanel.show();
    }

    showInventPanel(): void {
        this.inventPanel.show();
        this.recipePanel.hide();
    }

    /**
     * Notification that an item was dropped (as in dragged and dropped) from some
     * other UI element onto the main screen
     * 
     * @param item The item it was dropped at 
     * @param x The x coordinate of the location of the drop
     * @param y The y coordinate of the location of the drop
     */
    itemDropped(item: Item, x: number, y: number): void {
        if (this.limitedPortraitScreen) {
            y += 160;
        }
        if (this.limitedLandscapeScreen) {
            x += -(this.canvas.width / 2) + 370;
        }

        const rows = (isMobile()) ? 1 : 2;
        const xp = Math.floor((x - (this.canvas.width - (4 * 130) - 10)) / 130);
        const yp = Math.floor((y - (this.canvas.height - (rows * 130) - 10)) / 130);

        if ((xp >= 0) && (xp < 4) && (yp >= 0) && (yp < rows)) {
            const index = xp + (yp * 4);
            if ((index >= 0) && (index <= this.player.quickSlots.length)) {
                this.player.quickSlots[index] = item;
                this.holdItem(item);
                this.quickSlotSelected = index;
                this.player.saveQuickSlots();
            }
        }
    }

    /**
     * Replace the item currently held
     * 
     * @param item The item currently held 
     */
    replaceItem(item: Item): void {
        let index = this.player.quickSlots.findIndex(slot => slot === null || slot.def.type === item.def.type);
        if (index < 0) {
            index = this.quickSlotSelected;
        }
        if (index >= 0) {
            this.player.quickSlots[index] = item;
            this.holdItem(item);
            this.quickSlotSelected = index;
            this.player.saveQuickSlots();
        }
    }

    holdItem(item: Item | null): void {
        if (this.player.itemHeld !== item) {
            this.player.itemHeld = item;

            if (item) {
                if (item.def.toolId) {
                    this.mods.toolSelected(this.player, item.def.toolId);
                }
                if (item.def.place > 0) {
                    this.mods.toolSelected(this.player, "place-" + item.def.place);
                }
            } else {
                this.mods.toolSelected(this.player, null);
            }
        }
    }
}
