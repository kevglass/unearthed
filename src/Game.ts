import { HTML_UI } from "./HtmlUi";
import { GAME_MAP, Layer, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE } from "./Map";
import { Mob } from "./Mob";
import { isMobile } from "./MobileDetect";
import { NETWORK } from "./Network";
import { renderAndUpdateParticles } from "./Particles";
import { getSprite, resourcesLoaded } from "./Resources";
import { HUMAN_SKELETON } from "./Skeletons";
import { v4 as uuidv4 } from 'uuid';

const SHOW_BOUNDS: boolean = false;
const ZOOM: number = isMobile() ? 3 : 2;
const DEFAULT_NAMES = ["Beep", "Boop", "Pop", "Whizz", "Bang", "Snap", "Wooga", "Pow", "Zowie", "Smash", "Grab", "Kaboom"];

export class Game {
    tooltipDiv: HTMLDivElement;
    timeTooltipShown: number = 0;
    animTime: number = 0;
    canvas: HTMLCanvasElement;
    g: CanvasRenderingContext2D;
    isHostingTheServer: boolean = true;
    connecting: boolean = false;
    waitingForHost: boolean = false;
    username: string;
    player: Mob;
    serverId: string;
    mobs: Mob[] = [];
    keyDown: Record<string, boolean> = {};
    mouseButtonDown: Record<number, boolean> = {};
    mouseX = 0;
    mouseY = 0;
    lastWorkX = 0;
    lastWorkY = 0;
    mainAreaTouchId = 0;
    controllerTouchId = 0;
    jumpTouchId = 0;
    placingTilesOnFrontLayer: boolean = true;
    lastFrame = Date.now();
    limitedPortraitScreen: boolean = false;
    limitedLandscapeScreen: boolean = false;
    inventPage = 0;
    finishStartup = Date.now() + 1000;

    constructor() {
        this.tooltipDiv = document.getElementById("tooltip") as HTMLDivElement;
        this.canvas = document.getElementById("game") as HTMLCanvasElement;
        this.g = this.canvas.getContext("2d")!;

        this.serverId = localStorage.getItem("server") ?? "";

        if (this.serverId === "") {
            this.serverId = uuidv4();
            localStorage.setItem("server", this.serverId);
        }

        this.username = localStorage.getItem("username") ?? "";
        if (this.username === "") {
            this.username = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
            localStorage.setItem("username", this.username);
        }
        (document.getElementById("playerName") as HTMLInputElement).value = this.username;

        this.player = new Mob(uuidv4(), this.username, HUMAN_SKELETON, 200, (SKY_HEIGHT - 6) * TILE_SIZE);

        if (localStorage.getItem("head")) {
            this.player.head = localStorage.getItem("head")!;
        }
        if (localStorage.getItem("body")) {
            this.player.body = localStorage.getItem("body")!;
        }

        const bodySelect = document.getElementById("bodySelect") as HTMLSelectElement;
        const headSelect = document.getElementById("headSelect") as HTMLSelectElement;
        bodySelect.value = this.player.body;
        headSelect.value = this.player.head;

        bodySelect.addEventListener("change", (event) => {
            this.player.body = bodySelect.value;
            localStorage.setItem("body", this.player.body);
        });
        headSelect.addEventListener("change", (event) => {
            this.player.head = headSelect.value;
            localStorage.setItem("head", this.player.head);
        });

        this.mobs.push(this.player);
        NETWORK.updatePlayerList(this.mobs);
        this.player.itemHeld = this.player.inventory[0];


        const params = new URLSearchParams(location.search);
        if (params.get("server") && params.get("server") !== this.serverId) {
            GAME.isHostingTheServer = false;
            (document.getElementById("serverId") as HTMLInputElement).value = params.get("server")!;
        } else {
            console.log("Connect on: " + location.href + "?server=" + this.serverId)
            document.getElementById("serverLink")!.innerHTML = location.href + "?server=" + this.serverId;
        }
    }

    showTip(tip: string) {
        this.tooltipDiv.style.display = "block";
        this.tooltipDiv.innerHTML = tip;
        this.timeTooltipShown = Date.now();
    }

    configureEventHandlers() {
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            if (document.activeElement === HTML_UI.chatInput) {
                return;
            }

            this.keyDown[event.key] = true;

            if (NETWORK.connected()) {
                if (event.key === "Enter") {
                    HTML_UI.showChat();
                }
            }

            if (event.key === 'q') {
                let index = 0;
                if (this.player.itemHeld) {
                    index = this.player.inventory.indexOf(this.player.itemHeld) + 1;
                    if (index >= this.player.inventory.length) {
                        index = 0;
                    }
                }
                this.player.itemHeld = this.player.inventory[index];
            }
            if (event.key === 'x') {
                this.placingTilesOnFrontLayer = !this.placingTilesOnFrontLayer;
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
            }
        });

        document.addEventListener("keyup", (event: KeyboardEvent) => {
            this.keyDown[event.key] = false;
        });
        this.canvas.addEventListener('contextmenu', event => event.preventDefault());

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
            this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
                this.mouseMove(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });
            this.canvas.addEventListener("mousedown", (event: MouseEvent) => {
                this.mouseDown(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });

            this.canvas.addEventListener("mouseup", (event: MouseEvent) => {
                this.mouseUp(event.x * ZOOM, event.y * ZOOM, 1);
                event.preventDefault();
            });
        }
    }

    mouseDown(x: number, y: number, touchId: number) {
        let foundInventButton = false;
        let foundControlButton = false;

        // tools
        if (this.limitedPortraitScreen) {
            y += 160;
        }
        if (this.limitedLandscapeScreen) {
            x -= (-(this.canvas.width / 2) + 370);
        }
        if ((x > this.canvas.width - (130 * 4)) && (y > this.canvas.height - (130 * 4))) {
            let xp = Math.floor((this.canvas.width - x) / 130);
            let yp = Math.floor((this.canvas.height - y) / 130);
            let index = (xp + (yp * 4)) + (this.inventPage * 4);
            if (!isMobile() || (yp === 0 && xp < 4 && xp >= 0)) {
                if (index >= 0 && index < this.player.inventory.length) {
                    foundInventButton = true;
                    this.player.itemHeld = this.player.inventory[index];
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


        foundControlButton = this.evalControlArea(x, y, touchId);

        if (!foundInventButton && !foundControlButton && this.mainAreaTouchId === 0) {
            this.mainAreaTouchId = touchId;
            this.mouseButtonDown[0] = true;
        }
    }

    private evalControlArea(x: number, y: number, touchId: number): boolean {
        if (!isMobile()) {
            return false;
        }

        if ((y * 2 > this.canvas.height - 300)) {
            let xp = Math.floor((x - 20) / 160);
            let yp = Math.floor((y - (this.canvas.height - 300)) / 160);

            if (x > this.canvas.width - 180 && yp === 1) {
                // up
                this.keyDown['w'] = true;
                this.jumpTouchId = touchId;
                return true;
            }

            if (xp == 0 && yp === 1) {
                // left
                this.keyDown['a'] = true;
                this.keyDown['d'] = false;
                this.controllerTouchId = touchId;
                return true;
            }
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

    private mouseUp(x: number, y: number, touchId: number) {
        if (touchId === this.mainAreaTouchId) {
            this.mainAreaTouchId = 0;
            this.mouseButtonDown[0] = false;
        }
        if (touchId === this.jumpTouchId) {
            this.keyDown['w'] = false;
            this.jumpTouchId = 0;
        }
        if (touchId === this.controllerTouchId) {
            this.keyDown['a'] = false;
            this.keyDown['d'] = false;
            this.controllerTouchId = 0;
        }
    }

    private mouseMove(x: number, y: number, touchId: number) {
        if (touchId === this.mainAreaTouchId || !isMobile()) {
            this.mouseX = x;
            this.mouseY = y;
        }
        if (touchId === this.controllerTouchId || touchId === this.jumpTouchId) {
            this.evalControlArea(x, y, touchId);
        }
    }

    startLoop() {
        requestAnimationFrame(() => { this.loop() });
    }

    private loop() {
    if (Date.now() > this.finishStartup) {
        document.getElementById("splash")!.style.display = "none";
    }
    if (Date.now() - this.timeTooltipShown > 5000) {
        this.tooltipDiv.style.display = "none";
    }

    const delta = Date.now() - this.lastFrame;
    if (delta < 10) {
        requestAnimationFrame(() => { this.loop() });
        return;
    }

    this.animTime += 0.03;
    this.animTime = this.animTime % 1;

    this.canvas.width = document.body.clientWidth * ZOOM;
    this.canvas.height = document.body.clientHeight * ZOOM;
    const isLandscape = this.canvas.width > this.canvas.height;
    this.limitedLandscapeScreen = isMobile() && isLandscape;
    this.limitedPortraitScreen = isMobile() && !isLandscape;

    this.canvas.focus();

    this.g.save();

    // draw the background clouds
    this.g.drawImage(getSprite('clouds'), 0, 0, this.canvas.width, this.canvas.height);
    this.g.fillStyle = "#445253";

    if (!NETWORK.connected()) {
        NETWORK.update(this.player, this.mobs);
        document.getElementById("serverLink")!.innerHTML = this.waitingForHost ? "Waiting for Host" : "Disconnected";
        requestAnimationFrame(() => { this.loop() });
        const logo = getSprite("logo");

        if (this.limitedLandscapeScreen) {
            this.g.drawImage(logo, (this.canvas.width - logo.width) / 2, 5);
            this.g.font = "30px Helvetica";
            this.g.textAlign = "center";
            this.g.fillText("Version _VERSION_", this.canvas.width / 2, logo.height + 30);
        } else if (this.limitedPortraitScreen) {
            this.g.drawImage(logo, (this.canvas.width - logo.width) / 2, 300);
            this.g.font = "30px Helvetica";
            this.g.textAlign = "center";
            this.g.fillText("Version _VERSION_", this.canvas.width / 2, logo.height + 330);
        } else {
            this.g.drawImage(logo, (this.canvas.width - (logo.width * 2)) / 2, 200, logo.width * 2, logo.height * 2);
            this.g.font = "50px Helvetica";
            this.g.textAlign = "center";
            this.g.fillText("Version _VERSION_", this.canvas.width / 2, 250 + (logo.height * 2));
        }

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
            this.player.update(0, false)
            this.player.x = 0;
            this.player.flip = true;
            this.player.y = 0;
            this.player.draw(this.g, false);
            this.player.x = 200;
            this.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
        } else {
            this.g.font = "80px Helvetica";
            this.g.textAlign = "center";
            this.g.fillText("Connecting", this.canvas.width / 2, this.canvas.height / 2);
        }
        return;
    }

    if (!this.isHostingTheServer) {
        document.getElementById("serverLink")!.innerHTML = "Connected";
    }

    if (resourcesLoaded()) {
        NETWORK.update(this.player, this.mobs);

        // scroll the view based on bounds and player position
        let ox = this.player.x - (this.canvas.width / 2);
        const oy = this.player.y - (this.canvas.height / 2);
        ox = Math.min(Math.max(0, ox), (MAP_WIDTH * TILE_SIZE) - this.canvas.width);
        this.g.translate(-Math.floor(ox), -Math.floor(oy));

        // draw the underground background
        this.g.fillRect(0, SKY_HEIGHT * 128, this.canvas.width * 5, this.canvas.height * 5);

        this.player.overX = Math.floor((this.mouseX + Math.floor(ox)) / TILE_SIZE);
        this.player.overY = Math.floor((this.mouseY + Math.floor(oy)) / TILE_SIZE);

        const px = Math.floor(this.player.x / TILE_SIZE);
        const py = Math.floor(this.player.y / TILE_SIZE);
        const dx = this.player.overX - px;
        const dy = this.player.overY - py;

        let canAct = (Math.abs(dx) < 2) && (dy > -3) && (dy < 2) && (dx !== 0 || dy !== 0);

        GAME_MAP.render(this.g, this.player.overX, this.player.overY, canAct, ox, oy, this.canvas.width, this.canvas.height);

        // local player specifics
        this.player.still();

        // mining
        if ((this.lastWorkY !== this.player.overY) || (this.lastWorkX !== this.player.overX) || (!this.mouseButtonDown[0])) {
            this.player.blockDamage = 0;
        }
        if (this.mouseButtonDown[0] && canAct && GAME_MAP.getTile(this.player.overX, this.player.overY, 
            this.placingTilesOnFrontLayer ? Layer.FOREGROUND : Layer.BACKGROUND) !== 0) {
            this.lastWorkX = this.player.overX;
            this.lastWorkY = this.player.overY;
        }

        if (this.mouseButtonDown[0] && canAct) {
            this.player.controls.mouse = true;
        }
        this.player.localUpdate();
        if (this.keyDown["d"]) {
            this.player.controls.right = true;
        }
        if (this.keyDown["a"]) {
            this.player.controls.left = true;
        }
        if (this.keyDown[" "] || this.keyDown["w"]) {
            this.player.controls.up = true;
        }
        for (let i = 1; i < 10; i++) {
            if (this.keyDown["" + i]) {
                this.player.itemHeld = this.player.inventory[i - 1];
            }
        }

        for (const mob of [...this.mobs]) {
            mob.update(this.animTime, !this.placingTilesOnFrontLayer);
            mob.draw(this.g, SHOW_BOUNDS);

            if (Date.now() - mob.lastUpdate > 10000) {
                this.mobs.splice(this.mobs.indexOf(mob), 1);
            }
        }
    }

    renderAndUpdateParticles(this.g);

    this.g.restore();
    if (this.limitedPortraitScreen) {
        this.g.save();
        this.g.translate(0, -160);
    }
    if (this.limitedLandscapeScreen) {
        this.g.save();
        this.g.translate(-(this.canvas.width / 2) + 370, 0);
    }
    let index = 0;
    const rows = (isMobile()) ? 1 : 4;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < 4; x++) {
            const xp = this.canvas.width - ((x + 1) * 130) - 10;
            const yp = this.canvas.height - ((y + 1) * 130) - 10;
            const item = this.player.inventory[index + (this.inventPage * 4)];
            if (item) {
                if (item === this.player.itemHeld) {
                    this.g.drawImage(getSprite("ui.sloton"), xp, yp, 125, 125);
                } else {
                    this.g.drawImage(getSprite("ui.slotoff"), xp, yp, 125, 125);
                }
                this.g.drawImage(getSprite(item.sprite), xp + 20 + (item.place === 0 ? 7 : 0), yp + 15, 85, 85);

            }
            index++;
        }
    }
    this.g.drawImage(getSprite(this.placingTilesOnFrontLayer ? "ui.front" : "ui.back"), this.canvas.width - 680, this.canvas.height - 140, 125, 125);
    if (isMobile()) {
        const xp = this.canvas.width - ((0 + 1) * 130) - 10;
        const yp = this.canvas.height - ((1 + 1) * 130) - 10;
        this.g.drawImage(getSprite("ui.arrowup"), xp + 20, yp + 50, 80, 80);
    }

    if (this.limitedPortraitScreen || this.limitedLandscapeScreen) {
        this.g.restore();
    }
    if (isMobile()) {
        this.g.drawImage(getSprite("ui.left"), 20, this.canvas.height - 160, 140, 140);
        this.g.drawImage(getSprite("ui.right"), 180, this.canvas.height - 160, 140, 140);
        this.g.drawImage(getSprite("ui.up"), this.canvas.width - 200, this.canvas.height - 160, 140, 140);
    }
    this.lastFrame = Date.now();
    requestAnimationFrame(() => { this.loop() });
    }
}

export const GAME: Game = new Game();
GAME.configureEventHandlers();