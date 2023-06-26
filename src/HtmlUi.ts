import { GAME_MAP, SKY_HEIGHT, TILE_SIZE } from "./Map";
import { NETWORK } from "./Network";
import { GAME } from "./Game";

/**
 * A controller for everything thats on the HTML layer rather than the canvas. The game
 * makes use of HTML components for the UI rather than drawing them manually on the canvas.
 */
export class HtmlUi {
    /** The input element used to accept user network chat */
    chatInput: HTMLInputElement;
    /** The button in the setting dialog for resetting the map */
    resetMapButton: HTMLDivElement;
    /** The button in the setting dialog for loading the map */
    loadMapButton: HTMLDivElement;
    /** The button in the setting dialog for saving the map */
    saveMapButton: HTMLDivElement;
    /** The file input element used to upload maps */
    fileInput: HTMLInputElement;

    constructor() {
        this.resetMapButton = document.getElementById("resetMapButton") as HTMLDivElement;
        this.loadMapButton = document.getElementById("loadMapButton") as HTMLDivElement;
        this.saveMapButton = document.getElementById("saveMapButton") as HTMLDivElement;
        this.fileInput = document.getElementById("fileInput") as HTMLInputElement;
        this.chatInput = document.getElementById("chatinput") as HTMLInputElement;

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
                    const fullArray: number[] = Array.from(rawData);
                    const len: number = fullArray.length / 2;
                    GAME_MAP.setMapData({
                        f: fullArray.slice(0, len),
                        b: fullArray.slice(len)
                    });

                    GAME.player.x = 200;
                    GAME.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
                    document.getElementById("settingsPanel")!.style.display = "none";
                    NETWORK.sendMapUpdate(undefined);
                }
                reader.readAsArrayBuffer(this.fileInput.files[0]);
            }
        });

        // reset the map 
        this.resetMapButton.addEventListener("click", () => {
            if (confirm("Reset Map?") && GAME.isHostingTheServer) {
                GAME_MAP.reset();
                GAME.player.x = 200;
                GAME.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
                document.getElementById("settingsPanel")!.style.display = "none";
            }
        });
        //
        // saving the map - since this a browser based app we create a link with
        // an encoded URL of the map data and then click it as a download.
        //
        this.saveMapButton.addEventListener("click", () => {
            const data = GAME_MAP.getMapData();
            const dataBlocks = new Uint8Array([...data.f, ...data.b]);
            const blob = new Blob([dataBlocks], {
                type: "application/octet-stream"
            });
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
            GAME.isHostingTheServer = true;
            document.getElementById("connect")!.style.display = "none";
            NETWORK.startNetwork(GAME.isHostingTheServer);
            GAME.connecting = true;
            GAME.waitingForHost = true;
            document.getElementById("serverLink")!.innerHTML = location.href + "?server=" + GAME.serverId;
        });
        // join game button - just show the join game dialog
        document.getElementById("joinGame")!.addEventListener("click", () => {
            document.getElementById("connect")!.style.display = "none";
            document.getElementById("join")!.style.display = "block";
        });
        // join game button - just show the setup dialog
        document.getElementById("setupButton")!.addEventListener("click", () => {
            document.getElementById("connect")!.style.display = "none";
            document.getElementById("setup")!.style.display = "block";
        });

        // done button from the settings panel. Apply the settings and go back to main menu
        document.getElementById("doneButton")!.addEventListener("click", () => {
            GAME.username = (document.getElementById("playerName") as HTMLInputElement).value;
            GAME.player.name = GAME.username;
            localStorage.setItem("username", GAME.username);
            document.getElementById("connect")!.style.display = "block";
            document.getElementById("setup")!.style.display = "none";

            NETWORK.updatePlayerList(GAME.mobs);
        });

        // settings button in the top right. When clicked display the
        // the setting menu.
        document.getElementById("settings")!.addEventListener("click", () => {
            const panel = document.getElementById("settingsPanel")!;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";

                if (GAME.isHostingTheServer) {
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
            if (NETWORK.connected()) {
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
        
        // Joining the game is starting the game with a network that
        // acts as a client
        document.getElementById("joinButton")!.addEventListener("click", () => {
            GAME.isHostingTheServer = false;
            GAME.serverId = (document.getElementById("serverId") as HTMLInputElement).value;
            GAME.username = (document.getElementById("playerName") as HTMLInputElement).value;
            GAME.player.name = GAME.username;
            NETWORK.updatePlayerList(GAME.mobs);
        
            document.getElementById("join")!.style.display = "none";
            NETWORK.startNetwork(GAME.isHostingTheServer);
            GAME.connecting = true;
            GAME.waitingForHost = true;
        });
    }

    /**
     * Show the chat input
     */
    showChat() {
        if (NETWORK.connected()) {
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
        if (NETWORK.connected()) {
            NETWORK.sendChatMessage(GAME.player.name, message);
        }
    }
    
    /**
     * Hide the chat input
     */
    hideChat() {
        this.chatInput!.style.display = "none";
    }

}

export const HTML_UI: HtmlUi = new HtmlUi();