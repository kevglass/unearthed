import { Game } from "./Game";
import {GameMap, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE} from "./Map";
import { Network } from "./Network";
import { confirmAudioContext, isSoundMuted, setSoundMuted } from "./engine/Resources";

/**
 * A controller for everything thats on the HTML layer rather than the canvas. The game
 * makes use of HTML components for the UI rather than drawing them manually on the canvas.
 */
export class HtmlUi {
    /** The input element used to accept user network chat */
    chatInput: HTMLInputElement;
    /** The input element used to set portal codes */
    portalInput: HTMLInputElement;
    /** The input element holding the players name */
    playernameInput: HTMLInputElement;
    /** The button in the setting dialog for resetting the map */
    resetMapButton: HTMLDivElement;
    /** The button in the setting dialog for loading the map */
    loadMapButton: HTMLDivElement;
    /** The button in the setting dialog for saving the map */
    saveMapButton: HTMLDivElement;
    /** The file input element used to upload maps */
    fileInput: HTMLInputElement;
    /** The network in use */
    network: Network;
    /** The game map being maintained */
    gameMap: GameMap;
    /** The central game controller */
    game: Game;

    constructor(game: Game, network: Network, gameMap: GameMap) {
        this.game = game;
        this.network = network;
        this.gameMap = gameMap;

        this.resetMapButton = document.getElementById("resetMapButton") as HTMLDivElement;
        this.loadMapButton = document.getElementById("loadMapButton") as HTMLDivElement;
        this.saveMapButton = document.getElementById("saveMapButton") as HTMLDivElement;
        this.fileInput = document.getElementById("fileInput") as HTMLInputElement;
        this.chatInput = document.getElementById("chatinput") as HTMLInputElement;
        this.portalInput = document.getElementById("portalinput") as HTMLInputElement;
        this.playernameInput = document.getElementById("playerName") as HTMLInputElement;

        //
        // The file input is used to show the file selector in the browser. We programmatically
        // click it to show the choose. When the value is changed we load the data
        // selected and stick it in our map array
        //
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files) {
                const reader = new FileReader();
                reader.onload = () => {
                    const rawData = new Uint8Array(reader.result as ArrayBuffer);
                    if (rawData[0] === 255) {
                        // new file format with room for meta
                        const lengthOfMeta = ((rawData[1] << 8) & 0xFF00) + rawData[2];
                        const decoder = new TextDecoder();
                        const metaAsText = decoder.decode(rawData.slice(3, 3+lengthOfMeta));
                        const meta = JSON.parse(metaAsText);
                        const fullArray: number[] = Array.from(rawData.slice(3+lengthOfMeta));
                        const len: number = meta.mapSize;
                        this.gameMap.setMapData({
                            f: fullArray.slice(0, len),
                            b: fullArray.slice(len)
                        });
                        Object.assign(this.gameMap.metaData, meta);
                    } else {
                        const fullArray: number[] = Array.from(rawData);
                        const len: number = fullArray.length / 2;
                        this.gameMap.setMapData({
                            f: fullArray.slice(0, len),
                            b: fullArray.slice(len)
                        });
                    }

                    this.game.player.x = 200;
                    this.game.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
                    document.getElementById("settingsPanel")!.style.display = "none";
                    this.game.gameMap.save();
                    this.network.sendMapUpdate(undefined);
                }
                reader.readAsArrayBuffer(this.fileInput.files[0]);
            }
        });

        // reset the map 
        this.resetMapButton.addEventListener("click", () => {
            if (confirm("Reset Map?") && this.game.isHostingTheServer) {
                this.gameMap.reset();
                this.network.sendMapUpdate(undefined);
                this.game.player.x = 200;
                this.game.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
                document.getElementById("settingsPanel")!.style.display = "none";
            }
        });
        //
        // saving the map - since this a browser based app we create a link with
        // an encoded URL of the map data and then click it as a download.
        //
        this.saveMapButton.addEventListener("click", () => {
            const data = this.gameMap.getMapData();
            const encoder = new TextEncoder();
            // copy the metadata
            const meta = JSON.parse(JSON.stringify(this.gameMap.metaData));
            meta.mapSize = data.f.length;
            const metaAsBytes = Array.from(encoder.encode(JSON.stringify(meta)));
            const dataBlocks = new Uint8Array([255, metaAsBytes.length >> 8, (metaAsBytes.length & 0xFF), ...metaAsBytes, ...data.f, ...data.b]);
            const blob = new Blob([dataBlocks], {
                type: "application/octet-stream"
            });
            console.log(dataBlocks);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toLocaleString();
            link.download = "unearthed-level-" + date + ".bin";
            link.click();
        });
        // This is just to start the file chooser
        this.loadMapButton.addEventListener("click", () => {
            this.fileInput.click();
        });

        // start the game button - start the network on our server ID
        document.getElementById("startGame")!.addEventListener("click", () => {
            confirmAudioContext();

            this.game.isHostingTheServer = true;
            document.getElementById("connect")!.style.display = "none";
            this.network.startNetwork(this.game.isHostingTheServer);
            this.game.connecting = true;
            this.game.waitingForHost = true;
            this.game.player.reset();
            document.getElementById("serverLink")!.innerHTML = location.href + "?server=" + this.game.serverId;
        });
        // join game button - just show the join game dialog
        document.getElementById("joinGame")!.addEventListener("click", () => {
            confirmAudioContext();

            document.getElementById("connect")!.style.display = "none";
            document.getElementById("join")!.style.display = "block";
        });
        // join game button - just show the setup dialog
        document.getElementById("setupButton")!.addEventListener("click", () => {
            confirmAudioContext();

            this.game.player.reset();
            document.getElementById("connect")!.style.display = "none";
            document.getElementById("setup")!.style.display = "block";
        });

        // done button from the settings panel. Apply the settings and go back to main menu
        document.getElementById("doneButton")!.addEventListener("click", () => {
            this.game.username = this.playernameInput.value;
            this.game.player.name = this.game.username;
            localStorage.setItem("username", this.game.username);
            document.getElementById("connect")!.style.display = "block";
            document.getElementById("setup")!.style.display = "none";

            this.network.updatePlayerList(this.game.mobs);
        });

        // settings button in the top right. When clicked display the
        // the setting menu.
        document.getElementById("settings")!.addEventListener("click", () => {
            const panel = document.getElementById("settingsPanel")!;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";

                if (this.game.isHostingTheServer) {
                    this.resetMapButton.style.display = "block";
                    this.loadMapButton.style.display = "block";
                } else {
                    this.resetMapButton.style.display = "none";
                    this.loadMapButton.style.display = "none";
                }
            }
        })
        // chat button in the top left. When clicked show the user
        // chat input
        document.getElementById("chat")!.addEventListener("click", () => {
            if (this.network.connected()) {
                if (this.chatInput.style.display === "block") {
                    this.hideChat();
                } else {
                    this.showChat();
                }
            }
        })
        // close button hide the settings panel
        document.getElementById("closeButton")!.addEventListener("click", () => {
            document.getElementById("settingsPanel")!.style.display = "none";
            if (!this.game.network.connected()) {
                document.getElementById("connect")!.style.display = "block";
            }
        })

        // sound on/off button
        document.getElementById("soundButton")!.addEventListener("click", () => {
            setSoundMuted(!isSoundMuted());

            this.renderSoundButton();
        })

        // sound on/off button
        document.getElementById("fullscreenButton")!.addEventListener("click", () => {
            this.setFullscreen(!this.isFullscreen());
        })

        document.getElementById("controllerButton")!.addEventListener("click", () => {
            this.game.startControllerSetup();
        })



        // special cases for when chatting. Enter will send the message and escape
        // will hide the chat box.
        this.chatInput!.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                this.chatInput.value = "";
                document.getElementById("settingsPanel")!.style.display = "none";
                this.hideChat();
            }
            if (event.key === "Enter") {
                this.sendChat(this.chatInput.value);
                this.chatInput.value = "";
                this.hideChat();
            }
        });
        
        this.portalInput!.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                this.hidePortal();
            }
            if (event.key === "Enter") {
                const tileIndex = Math.floor(this.game.player.x / TILE_SIZE) + (Math.floor(this.game.player.y / TILE_SIZE) * MAP_WIDTH);
                const portal = this.gameMap.metaData.portals.find(portal => portal.tileIndex === tileIndex);
                if (portal) {
                    portal.code = this.portalInput.value;
                    if (this.game.isHostingTheServer) {
                        localStorage.setItem("portals", JSON.stringify(this.game.gameMap.metaData.portals));
                    }
                }
                this.hidePortal();
            }
        });
        
        // Joining the game is starting the game with a network that
        // acts as a client
        document.getElementById("joinButton")!.addEventListener("click", () => {
            this.joinAsClient();
        });

        // So we see variables in console. And change them without refreshing.
        if (window.location.href.includes('localhost')) {
            (window as any).game = game
        }

        this.renderSoundButton();
    }
    
    joinAsClient() {
        this.game.isHostingTheServer = false;
        this.game.serverId = (document.getElementById("serverId") as HTMLInputElement).value;
        this.game.username = (document.getElementById("playerName") as HTMLInputElement).value;
        this.game.player.name = this.game.username;
        this.network.updatePlayerList(this.game.mobs);

        document.getElementById("join")!.style.display = "none";
        this.network.startNetwork(this.game.isHostingTheServer);
        this.game.connecting = true;
        this.game.waitingForHost = true;
    }

    setFullscreen(fs: boolean) {
        if (fs) {
            document.body.requestFullscreen().then(() => {
                setTimeout(() => { this.renderFullscreenButton(); }, 1000);
            });
        } else {
            document.exitFullscreen().then(() => {
                setTimeout(() => { this.renderFullscreenButton(); }, 1000);
            });
        }
    }

    isFullscreen(): boolean {
        return !window.screenTop && !window.screenY;
    }
    /**
     * Show the chat input
     */
    showChat() {
        if (this.network.connected()) {
            this.chatInput!.style.display = "block";
            this.chatInput.focus();
        }
    }

    /**
     * Send a chat message
     * 
     * @param message The message to send
     */
    sendChat(message: string) {
        if (this.network.connected()) {
            this.network.sendChatMessage(this.game.player.name, message);
        }
    }

    /**
     * Hide the chat input
     */
    hideChat() {
        this.chatInput!.style.display = "none";
    }

    /**
     * Show the portal input
     */
    showPortal() {
        this.portalInput!.style.display = "block";
        this.portalInput!.focus();
    }
    
    hidePortal() {
        this.portalInput.value = "";
        document.getElementById("portalinput")!.style.display = "none";
    }
	
    /**
     * Show which sound icon based on current user preference.
     */
    renderSoundButton() {
        let button = document.getElementById("soundButton");
        if (button) {
            if (localStorage.getItem('muted') === '1') {
                button.classList.add('isoff');
            } else {
                button.classList.remove('isoff');
            }
        }
    }

    /**
     * Show which if we're in fullscreen or not
     */
    renderFullscreenButton() {
        let button = document.getElementById("fullscreenButton");
        console.log(button,this.isFullscreen());
        if (button) {
            if (this.isFullscreen()) {
                button.classList.add('isFullscreen');
            } else {
                button.classList.remove('isFullscreen');
            }
        }
    }
}