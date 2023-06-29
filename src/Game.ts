
import { Graphics, HtmlGraphics } from "./Graphics";
import { HtmlUi } from "./HtmlUi";
import { GameMap, Layer, MAP_DEPTH, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE, initTiles } from "./Map";
import { Mob } from "./Mob";
import { isMobile, isTablet } from "./MobileDetect";
import { Network } from "./Network";
import { renderAndUpdateParticles } from "./Particles";
import { getSprite, loadAllResources, playSfx, resourcesLoaded, startAudioOnFirstInput } from "./Resources";
import { HUMAN_SKELETON } from "./Skeletons";
import { v4 as uuidv4 } from 'uuid';
import { createServerId } from "./createServerId";

//
// The main game controller and state. This is catch-all for anything that didn't
// fit anywhere else
//f

/** True if we should be showing bounds when rendering mobs */
const SHOW_BOUNDS: boolean = false;
/** The ZOOM level - higher = less zoomed - I know, I know. */
const ZOOM: number = isMobile() && !isTablet() ? 3 : 2;
/** Some default names if the player can't be bothered to set one */
const DEFAULT_NAMES = ["Beep", "Boop", "Pop", "Whizz", "Bang", "Snap", "Wooga", "Pow", "Zowie", "Smash", "Grab", "Kaboom"];

/**
 * The main game controller. This needs breaking up a bit more yet.
 */
export class Game {
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
    /** True if we're currently configured to place tiles on the foreground layer */
    placingTilesOnFrontLayer: boolean = true;
    /** The time of the last rendered frame */
    lastFrame = Date.now();
    /** True if we're on a limited size portrait screen - adjusts UI */
    limitedPortraitScreen: boolean = false;
    /** True if we're on a limited size landscape screen - adjusts UI */
    limitedLandscapeScreen: boolean = false;
    /** The page of the inventory we're showing - only for mobile */
    inventPage = 0;
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

    constructor() {
        loadAllResources();
        initTiles();
        
        this.tooltipDiv = document.getElementById("tooltip") as HTMLDivElement;
        this.canvas = document.getElementById("game") as HTMLCanvasElement;
        this.g = new HtmlGraphics(this.canvas);

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

        // check if we have a username stored locally, if not then generated one
        // and store it
        this.username = localStorage.getItem("username") ?? "";
        if (this.username === "") {
            this.username = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
            localStorage.setItem("username", this.username);
        }
        (document.getElementById("playerName") as HTMLInputElement).value = this.username;


        this.gameMap = new GameMap(this);
        this.gameMap.clear();
        if (!this.gameMap.loadFromStorage()) {
            this.gameMap.generate();
        }
        this.gameMap.setDiscovered(0, 0);
        this.gameMap.refreshFullLightMap();

        this.network = new Network(this, this.gameMap);
        this.ui = new HtmlUi(this, this.network, this.gameMap);

        // create the local player and configure and skin settings
        this.player = new Mob(this.network, this.gameMap, uuidv4(), this.username, HUMAN_SKELETON, 200, (SKY_HEIGHT - 6) * TILE_SIZE);
        
        const skinsForValidation = ["a","b","c","d"];
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
        this.mobs.push(this.player);
        this.network.updatePlayerList(this.mobs);
        this.player.itemHeld = this.player.inventory[0];

        // honour a server parameter if its there so we can pass links
        // to each other
        const params = new URLSearchParams(location.search);
        if (params.get("server") && params.get("server") !== this.serverId) {
            this.isHostingTheServer = false;
            (document.getElementById("serverId") as HTMLInputElement).value = params.get("server")!;
        } else {
            console.log("Connect on: " + location.href + "?server=" + this.serverId)
            document.getElementById("serverLink")!.innerHTML = location.href + "?server=" + this.serverId;
        }

        this.configureEventHandlers();
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

    /**
     * Configure the event handlers that manage keyboard, mouse and touch state.
     */
    configureEventHandlers() {
        // keydown handler
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            startAudioOnFirstInput();

            // if we're focused on the chat input that takes precedence
            if (document.activeElement === this.ui.chatInput) {
                return;
            }

            // record the keyboard state
            this.keyDown[event.key] = true;

            // if the user hits enter and we're connected to the game
            // then show the chat box
            if (this.network.connected()) {
                if (event.key === "Enter") {
                    this.ui.showChat();
                }
            }

            // Pressing Q/E cycles through cycles through the inventory
            if (event.key === 'q') {
                let index = 0;
                if (this.player.itemHeld) {
                    index = this.player.inventory.indexOf(this.player.itemHeld) + 1;
                    if (index >= this.player.inventory.length) {
                        index = 0;
                    }
                }
                this.player.itemHeld = this.player.inventory[index];
                playSfx('click', 1);
            }
            if (event.key === 'e') {
                let index = 0;
                if (this.player.itemHeld) {
                    index = this.player.inventory.indexOf(this.player.itemHeld) - 1;
                    if (index < 0) {
                        index = this.player.inventory.length - 1;
                    }
                }
                this.player.itemHeld = this.player.inventory[index];
                playSfx('click', 1);
            }

            // Pressing X changes the layer we're targeting
            if (event.key === 'x') {
                this.placingTilesOnFrontLayer = !this.placingTilesOnFrontLayer;
            }

        });

        // mouse up, just maintain state
        document.addEventListener("keyup", (event: KeyboardEvent) => {
            this.keyDown[event.key] = false;
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
                startAudioOnFirstInput();

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
                startAudioOnFirstInput();

                this.mouseDown(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });

            this.canvas.addEventListener("mouseup", (event: MouseEvent) => {
                this.mouseUp(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });
        }
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
        if ((x > this.canvas.width - (130 * 4)) && (y > this.canvas.height - (130 * 4))) {
            let xp = Math.floor((this.canvas.width - x) / 130);
            let yp = Math.floor((this.canvas.height - y) / 130);
            let index = (xp + (yp * 4)) + (this.inventPage * 4);
            if (!isMobile() || (yp === 0 && xp < 4 && xp >= 0)) {
                if (index >= 0 && index < this.player.inventory.length) {
                    foundInventButton = true;
                    this.player.itemHeld = this.player.inventory[index];
                    playSfx('click', 1);
                }
            } else {
                if ((xp === 0 && yp === 1)) {
                    this.inventPage++;
                    if (this.inventPage > Math.floor((this.player.inventory.length - 1) / 4)) {
                        this.inventPage = 0;
                    }
                }
            }
        }
        // if we've hit the layer toggle button then apply it
        if (x > this.canvas.width - 680 && y > this.canvas.height - 140 && x < this.canvas.width - 680 + 126 && y < this.canvas.height - 140 + 125) {
            this.placingTilesOnFrontLayer = !this.placingTilesOnFrontLayer;
            foundInventButton = true;
            this.showTip("Placing Tiles on " + (this.placingTilesOnFrontLayer ? "Foreground" : "Background"));
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
                this.keyDown['w'] = true;
                this.keyDown['s'] = false;
                this.jumpTouchId = touchId;
                return true;
            }
            // if we're pressing on the jump control 
            // pretend S was pressed
            if (x > this.canvas.width - 360 && yp === 1) {
                // up
                this.keyDown['s'] = true;
                this.keyDown['w'] = false;
                this.jumpTouchId = touchId;
                return true;
            }

            // if we're pressing on the left control 
            // pretend A was pressed
            if (xp == 0 && yp === 1) {
                // left
                this.keyDown['a'] = true;
                this.keyDown['d'] = false;
                this.controllerTouchId = touchId;
                return true;
            }
            // if we're pressing on the right control 
            // pretend D was pressed
            if (xp == 1 && yp === 1) {
                // right
                this.keyDown['d'] = true;
                this.keyDown['a'] = false;
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
        if (touchId === this.mainAreaTouchId) {
            this.mainAreaTouchId = 0;
            this.mouseButtonDown[0] = false;
        }
        if (touchId === this.jumpTouchId) {
            this.keyDown['w'] = false;
            this.keyDown['s'] = false;
            this.jumpTouchId = 0;
        }
        if (touchId === this.controllerTouchId) {
            this.keyDown['a'] = false;
            this.keyDown['d'] = false;
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
        if (touchId === this.mainAreaTouchId || !isMobile()) {
            this.mouseX = x;
            this.mouseY = y;
        }
        if (touchId === this.controllerTouchId || touchId === this.jumpTouchId) {
            this.evalControlArea(x, y, touchId);
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

        for (let loop=0;loop<delta / Math.floor(1000 / 60);loop++) {
            this.lastUpdate += Math.floor(1000 / 60);
        let ox = this.player.x - (this.canvas.width / 2);
        const oy = this.player.y - (this.canvas.height / 2);
        ox = Math.min(Math.max(0, ox), (MAP_WIDTH * TILE_SIZE) - this.canvas.width);

        // update the mouse over indicator
        this.player.overX = Math.floor((this.mouseX + Math.floor(ox)) / TILE_SIZE);
        this.player.overY = Math.floor((this.mouseY + Math.floor(oy)) / TILE_SIZE);

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
        if (this.keyDown["d"]) {
            this.player.controls.right = true;
        }
        if (this.keyDown["a"]) {
            this.player.controls.left = true;
        }
        if (this.keyDown["s"]) {
            this.player.controls.down = true;
        }
        if (this.keyDown[" "] || this.keyDown["w"]) {
            this.player.controls.up = true;
        }

        this.gameMap.updateTimers();

        // finally draw update and draw the mobs
        for (const mob of [...this.mobs]) {
            mob.update(this.animTime, !this.placingTilesOnFrontLayer);
        }
    }
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

        // move the animation forward
        this.animTime += 0.03;
        this.animTime = this.animTime % 1;

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

        this.g.setFillStyle("#b7e7fa");
        this.g.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
            this.g.save();
            this.g.translate(-((ox / bg.parallax) % (background.getWidth() * bg.scale)), bg.offset);
            for (let x = 0; x < this.canvas.width * 2; x += (background.getWidth() * bg.scale) - bg.scale) {
                // draw the background clouds
                this.g.drawScaledImage(background, x, 0, background.getWidth() * bg.scale, background.getHeight() * bg.scale);
            }
            this.g.restore();

        }


        // if the network hasn't been started we're at the main menu
        if (!this.network.connected()) {
            // update the sample player
            this.network.update(this.player, this.mobs);
            document.getElementById("serverLink")!.innerHTML = this.waitingForHost ? "Waiting for Host" : "Disconnected";
            requestAnimationFrame(() => { this.loop() });

            this.g.setFillStyle("black");

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
                this.g.setFillStyle("black");
                this.g.fillText(this.motd, 1, 1);
                this.g.setFillStyle("#0f0");
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
                this.g.fillText("Connecting", this.canvas.width / 2, this.canvas.height / 2);
            }
            return;
        }

        if (!this.isHostingTheServer) {
            document.getElementById("serverLink")!.innerHTML = "Connected";
        }

        // so now we know the network is started (or the pretend network is) and 
        // all the resources are loaded so we can render the real game
        if (resourcesLoaded()) {
            this.network.update(this.player, this.mobs);

            // scroll the view based on bounds and player position
            this.g.translate(-Math.floor(ox), -Math.floor(oy));

            // draw the underground background
            this.g.setFillStyle("#445253");
            this.g.fillRect(0, SKY_HEIGHT * 128, MAP_WIDTH * 128, MAP_DEPTH * 128);

            // update the mouse over indicator
            this.player.overX = Math.floor((this.mouseX + Math.floor(ox)) / TILE_SIZE);
            this.player.overY = Math.floor((this.mouseY + Math.floor(oy)) / TILE_SIZE);

            // check if the mouse over location is somewhere our player can act on
            const px = Math.floor(this.player.x / TILE_SIZE);
            const py = Math.floor(this.player.y / TILE_SIZE);
            const dx = this.player.overX - px;
            const dy = this.player.overY - py;

            let canAct = (Math.abs(dx) < 2) && (dy > -3) && (dy < 2) && (dx !== 0 || dy !== 0);

            // render the whole game map
            this.gameMap.render(this.g, this.player.overX, this.player.overY, canAct, ox, oy, this.canvas.width, this.canvas.height);

            for (let i = 1; i < 10; i++) {
                if (this.keyDown["" + i]) {
                    if (this.player.itemHeld !== this.player.inventory[i - 1]) {
                        this.player.itemHeld = this.player.inventory[i - 1];
                        playSfx('click', 1);
                    }
                }
            }

            // finally draw update and draw the mobs
            for (const mob of [...this.mobs]) {
                mob.draw(this.g, SHOW_BOUNDS);

                if (Date.now() - mob.lastUpdate > 10000) {
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

        // draw the inventory tiles 
        let index = 0;
        const rows = (isMobile()) ? 1 : 4;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < 4; x++) {
                const xp = this.canvas.width - ((x + 1) * 130) - 10;
                const yp = this.canvas.height - ((y + 1) * 130) - 10;
                const item = this.player.inventory[index + (this.inventPage * 4)];
                if (item) {
                    if (item === this.player.itemHeld) {
                        this.g.drawScaledImage(getSprite("ui/sloton"), xp, yp, 125, 125);
                    } else {
                        this.g.drawScaledImage(getSprite("ui/slotoff"), xp, yp, 125, 125);
                    }
                    this.g.drawScaledImage(getSprite(item.sprite), xp + 20 + (item.place === 0 ? 7 : 0), yp + 15, 85, 85);

                }
                index++;
            }
        }

        // draw the tile layer selector
        this.g.drawScaledImage(getSprite(this.placingTilesOnFrontLayer ? "ui/front" : "ui/back"), this.canvas.width - 680, this.canvas.height - 140, 125, 125);
        if (isMobile()) {
            const xp = this.canvas.width - ((0 + 1) * 130) - 10;
            const yp = this.canvas.height - ((1 + 1) * 130) - 10;
            this.g.drawScaledImage(getSprite("ui/arrowup"), xp + 20, yp + 50, 80, 80);
        }

        if (this.limitedPortraitScreen || this.limitedLandscapeScreen) {
            this.g.restore();
        }

        // draw the mobile controls
        if (isMobile()) {
            this.g.drawScaledImage(getSprite("ui/left"), 20, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/right"), 180, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/up"), this.canvas.width - 200, this.canvas.height - 160, 140, 140);
            this.g.drawScaledImage(getSprite("ui/down"), this.canvas.width - 360, this.canvas.height - 160, 140, 140);
        }

        // schedule our next frame
        this.lastFrame = Date.now();
        requestAnimationFrame(() => { this.loop() });
    }
}
