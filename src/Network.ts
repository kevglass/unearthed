import { DataPacket_Kind, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import { Mob } from './Mob';
import { HUMAN_SKELETON } from './Skeletons';
import { SKY_HEIGHT, TILE_SIZE, GAME_MAP } from './Map';
import { GAME } from './Game';

const UPDATE_INTERVAL_MS: number = 100;
const MAP_REQUEST_INTERVAL: number = 1000;
const NETWORK_PASSWORD: string = "_ROOMPASSWORD_";
const NETWORKING_ENABLED: boolean = NETWORK_PASSWORD !== "";

export class Network {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    room = new Room();
    lastUpdate = Date.now();
    lastMapRequest = Date.now();
    lastHostUpdate = Date.now();
    isConnected = false;
    hostingServer = false;
    localMobs: Mob[] = [];
    localPlayer?: Mob;
    hadMap: boolean = false;
    host: RemoteParticipant | undefined;
    removed: string[] = [];
    started: boolean = false;

    updatePlayerList(mobs: Mob[]): void {
        const listDiv = document.getElementById("playerList")!;
        listDiv.innerHTML = "";
    
        for (const mob of mobs) {
            const div = document.createElement("div");
            div.innerHTML = mob.name.substring(0, 12);
            div.classList.add("nametag");
            listDiv.appendChild(div);
        }
    }
    
    connected(): boolean {
        if (!NETWORKING_ENABLED) {
            return this.started;
        }

        return (this.host !== undefined) || this.hostingServer;
    }
    
    async startNetwork(hosting: boolean) {
        if (!NETWORKING_ENABLED) {
            this.started = true;
            return;
        }

        const request = new XMLHttpRequest();
        request.open("GET", "https://cokeandcode.com/demos/unearthed/room.php?username=" + encodeURIComponent(GAME.username!) + 
                            "&room=" + GAME.serverId + "&password=" + NETWORK_PASSWORD, false);
        request.send();
        const token = request.responseText;

        this.hostingServer = hosting;
        const wsURL = "wss://talesofyore.livekit.cloud"
    
        await this.room.connect(wsURL, token);
    
        this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            if (participant === this.host) {
                this.host = undefined;
                this.localMobs.splice(0, this.localMobs.length);
                this.localMobs.push(this.localPlayer!);
            } else {
                const mob = this.localMobs.find(m => m.participantId === participant.sid);
                if (mob) {
                    this.localMobs.splice(this.localMobs.indexOf(mob), 1);
                    this.removed.push(mob.id);
                    const data = JSON.stringify({ type: "remove", mobId: mob.id });
                    this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
                    this.updatePlayerList(this.localMobs);
                } else {
                    console.log("No Mob found for participant");
                }
            }
        });
    
        this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
            if (topic === "map") {
                if (!this.hostingServer) {
                    const fullArray: number[] = Array.from(payload);
                    const len: number = fullArray.length / 2;
                    GAME_MAP.setMapData({
                        f: fullArray.slice(0, len),
                        b: fullArray.slice(len)
                    });
                    this.hadMap = true;
    
                    this.localPlayer!.x = 200;
                    this.localPlayer!.y = (SKY_HEIGHT - 6) * TILE_SIZE;
                }
            } else {
                const strData = this.decoder.decode(payload);
                const message = JSON.parse(strData);
                if (message.type === "requestMap" && hosting) {
                    if (participant) {
                        this.sendMapUpdate(participant.sid);
                    }
                }
                if (message.type === "chatMessage") {
                    this.addChat(message.who, message.message);
                }
                if (message.type === "iAmHost" && !hosting) {
                    this.host = participant!;
                    if (message.version !== "_VERSION_") {
                        alert("Game Version Mismatch");
                        location.reload();
                    }
                }
                if (message.type === "tileChange") {
                    GAME_MAP.setTile(message.x, message.y, message.tile, message.layer);
                    GAME_MAP.refreshSpriteTile(message.x, message.y);
                    if (this.hostingServer) {
                        this.sendNetworkTile(message.x, message.y, message.tile, message.layer);
                    }
                }
                if (message.type === "remove") {
                    const mob = this.localMobs.find(mob => mob.id === message.mobId);
                    if (mob) {
                        this.removed.push(mob.id);
                        this.localMobs.splice(this.localMobs.indexOf(mob), 1);
                        this.updatePlayerList(this.localMobs);
                    }
                }
                if (message.type === "mobs") {
                    if (this.localMobs && this.localPlayer) {
                        if (message.host) {
                            this. host = participant;
                        }
                        for (const mobData of message.data) {
                            if (mobData.id !== this.localPlayer.id) {
                                if (this.removed.includes(mobData.id)) {
                                    continue;
                                }
    
                                let targetMob = this.localMobs.find(mob => mob.id === mobData.id);
                                if (!targetMob) {
                                    targetMob = new Mob(mobData.id, mobData.name, HUMAN_SKELETON, mobData.x, mobData.y);
                                    this.localMobs.push(targetMob);
                                    this.updatePlayerList(this.localMobs);
                                }
    
                                if (participant) {
                                    targetMob.participantId = participant.sid;
                                }
                                targetMob.updateFromNetworkState(mobData);
                            }
                        }
                    }
                }
            }
        });
    
        console.log("Network started");
        this.isConnected = true;
    }
    
    addChat(who: string, message: string): void {
        if (!NETWORKING_ENABLED) {
            return;
        }
        
        const list = document.getElementById("chatList") as HTMLDivElement;
    
        while (list.childElementCount > 4) {
            if (list.firstChild) {
                list.firstChild.parentNode?.removeChild(list.firstChild);
            }
        }
    
        const line = document.createElement("div");
        line.classList.add("chatline");
        const name = document.createElement("div");
        name.classList.add("chatname");
        name.innerHTML = who.substring(0, 12);
        const msg = document.createElement("div");
        msg.classList.add("chattext");
        msg.innerHTML = message.substring(0, 100);
        line.appendChild(name);
        line.appendChild(msg);
    
        list.appendChild(line);
    }
    
    sendMapUpdate(target: string | undefined) {
        if (!NETWORKING_ENABLED) {
            return;
        }
        
        const data = GAME_MAP.getMapData();
        const dataBlocks = new Uint8Array([...data.f, ...data.b]);
        if (target) {
            this.room.localParticipant.publishData(dataBlocks, DataPacket_Kind.RELIABLE, { topic: "map", destination: [target] });
        } else {
            this.room.localParticipant.publishData(dataBlocks, DataPacket_Kind.RELIABLE, { topic: "map" });
        }
    }
    
    sendNetworkTile(x: number, y: number, tile: number, layer: number) {
        if (!NETWORKING_ENABLED) {
            GAME_MAP.setTile(x, y, tile, layer);
            return;
        }
        
        if (this.hostingServer) {
            GAME_MAP.setTile(x, y, tile, layer);
            const data = JSON.stringify({ type: "tileChange", x, y, tile, layer });
            this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
        } else if (this.host) {
            const data = JSON.stringify({ type: "tileChange", x, y, tile, layer });
            this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE, [this.host.sid]);
        }
    }
    
    sendChatMessage(who: string, message: string) {
        if (!NETWORKING_ENABLED) {
            return;
        }
        
        message = message.trim();
        if (message.length === 0) {
            return;
        }
    
        const data = JSON.stringify({ type: "chatMessage", who, message });
        this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
    
        this.addChat(who, message);
    }
    
    update(player: Mob, players: Mob[]) {
        this.localPlayer = player;
        this.localMobs = players;
    
        if (!this.isConnected) {
            return;
        }
    
        if (Date.now() - this.lastMapRequest > MAP_REQUEST_INTERVAL && this.host) {
            this.lastMapRequest = Date.now();
            if (!this.hostingServer && !this.hadMap) {
                // request the map
                console.log("Requesting Map");
                const data = JSON.stringify({ type: "requestMap" });
                this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE, [this.host.sid]);
            }
        }
    
        // need to send out an "I am the host message"
        if (Date.now() - this.lastHostUpdate > MAP_REQUEST_INTERVAL && this.host) {
            this.lastHostUpdate = Date.now();
            const data = JSON.stringify({ type: "iAmHost", version: "_VERSION_" });
            this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
        }
    
        if (Date.now() - this.lastUpdate > UPDATE_INTERVAL_MS) {
            this.lastUpdate = Date.now();
    
            if (this.hostingServer) {
                const data = JSON.stringify({ type: "mobs", host: true, data: players.map(mob => mob.getNetworkState()) });
                this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.LOSSY);
            } else {
                if (this.host) {
                    const data = JSON.stringify({ type: "mobs", host: false, data: [player.getNetworkState()] });
                    this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.LOSSY, [this.host.sid]);
                }
            }
        }
    }
    

}

export const NETWORK = new Network();

