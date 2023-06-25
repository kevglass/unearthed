import { GAME_MAP, SKY_HEIGHT, TILE_SIZE } from "./Map";
import { NETWORK } from "./Network";
import { GAME } from "./Game";

export class HtmlUi {
    chatInput = document.getElementById("chatinput") as HTMLInputElement;
    resetMapButton = document.getElementById("resetMapButton") as HTMLDivElement;
    loadMapButton = document.getElementById("loadMapButton") as HTMLDivElement;
    saveMapButton = document.getElementById("saveMapButton") as HTMLDivElement;
    fileInput = document.getElementById("fileInput") as HTMLInputElement;

    constructor() {
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

        this.resetMapButton.addEventListener("click", () => {
            if (confirm("Reset Map?") && GAME.hosting) {
                GAME_MAP.reset();
                GAME.player.x = 200;
                GAME.player.y = (SKY_HEIGHT - 6) * TILE_SIZE;
                document.getElementById("settingsPanel")!.style.display = "none";
            }
        });
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

        this.loadMapButton.addEventListener("click", () => {
            this.fileInput.click();
        });


        document.getElementById("startGame")!.addEventListener("click", () => {
            GAME.hosting = true;
            const request = new XMLHttpRequest();
            request.open("GET", "https://cokeandcode.com/demos/unearthed/room.php?username=" + encodeURIComponent(GAME.username!) + 
                                "&room=" + GAME.serverId + "&password=_ROOMPASSWORD_", false);
            request.send();
            const accessToken = request.responseText;

            document.getElementById("connect")!.style.display = "none";
            NETWORK.startNetwork(accessToken, GAME.hosting);
            GAME.connecting = true;
            GAME.waitingForHost = true;
            document.getElementById("serverLink")!.innerHTML = location.href + "?server=" + GAME.serverId;
        });

        document.getElementById("joinGame")!.addEventListener("click", () => {
            document.getElementById("connect")!.style.display = "none";
            document.getElementById("join")!.style.display = "block";
        });

        document.getElementById("setupButton")!.addEventListener("click", () => {
            document.getElementById("connect")!.style.display = "none";
            document.getElementById("setup")!.style.display = "block";
        });

        document.getElementById("doneButton")!.addEventListener("click", () => {
            GAME.username = (document.getElementById("playerName") as HTMLInputElement).value;
            GAME.player.name = GAME.username;
            localStorage.setItem("username", GAME.username);
            document.getElementById("connect")!.style.display = "block";
            document.getElementById("setup")!.style.display = "none";

            NETWORK.updatePlayerList(GAME.mobs);
        });

        document.getElementById("settings")!.addEventListener("click", () => {
            const panel = document.getElementById("settingsPanel")!;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";

                if (GAME.hosting) {
                    this.resetMapButton.style.display = "block";
                    this.loadMapButton.style.display = "block";
                } else {
                    this.resetMapButton.style.display = "none";
                    this.loadMapButton.style.display = "none";
                }
            }
        })
        document.getElementById("chat")!.addEventListener("click", () => {
            if (NETWORK.connected()) {
                if (this.chatInput.style.display === "block") {
                    this.hideChat();
                } else {
                    this.showChat();
                }
            }
        })
        document.getElementById("closeButton")!.addEventListener("click", () => {
            document.getElementById("settingsPanel")!.style.display = "none";
        })
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
        

        document.getElementById("joinButton")!.addEventListener("click", () => {
            GAME.hosting = false;
            GAME.serverId = (document.getElementById("serverId") as HTMLInputElement).value;
            GAME.username = (document.getElementById("playerName") as HTMLInputElement).value;
            GAME.player.name = GAME.username;
            NETWORK.updatePlayerList(GAME.mobs);
        
            const request = new XMLHttpRequest();
            request.open("GET", "https://cokeandcode.com/demos/unearthed/room.php?username=" + encodeURIComponent(GAME.username!) + 
                                "&room=" + GAME.serverId + "&password=_ROOMPASSWORD_", false);
            request.send();
            const accessToken = request.responseText;
        
            document.getElementById("join")!.style.display = "none";
            NETWORK.startNetwork(accessToken, GAME.hosting);
            GAME.connecting = true;
            GAME.waitingForHost = true;
        });
    }

    showChat() {
        if (NETWORK.connected()) {
            this.chatInput!.style.display = "block";
            this.chatInput.focus();
        }
    }
    
    sendChat(message: string) {
        if (NETWORK.connected()) {
            NETWORK.sendChatMessage(GAME.player.name, message);
        }
    }
    
    hideChat() {
        this.chatInput!.style.display = "none";
    }

}

export const HTML_UI: HtmlUi = new HtmlUi();