import { DataPacket_Kind, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import { Mob } from './Mob';
import { HUMAN_SKELETON } from './Skeletons';
import { GameMap, SKY_HEIGHT, TILE_SIZE } from './Map';
import { Game } from './Game';

//
// Network is handled by using WebRTC through https://livekit.io/ 
//
// They're really designed for video/audio rooms but since they support data channel
// its particularly easy to set up P2P network through them. They have a fault tolerant local access
// point based network through their service and give a generous 50GB of transfer a month free
// 
// In short they're awesome, go use it
//

/** Interval between updates sent from server and client - 1/10th of a second */
const UPDATE_INTERVAL_MS: number = 100;
/** Interval between asking for the map if we haven't had it yet - once a second */
const MAP_REQUEST_INTERVAL: number = 1000;
/** 
 * The network password using to access cokeandcode's service - 
 * this is set from your local.properties.json - if you don't have one a blank value means no network 
 */
const NETWORK_PASSWORD: string = "_ROOMPASSWORD_";
/** True if networking is enabled */
const NETWORKING_ENABLED: boolean = NETWORK_PASSWORD !== "";

/**
 * A webrtc based peer to peer network that allocates one player as server and then forwards
 * state updates between players. 
 */
export class Network {
    /** used to encode blobs across the network */
    encoder = new TextEncoder();
    /** used to decode blobs across the network */
    decoder = new TextDecoder();
    /** The livekit.io Room we're using */
    room = new Room();
    /** The last time there was an update sent */
    lastUpdate = Date.now();
    /** The last time the map was requested */
    lastMapRequest = Date.now();
    /** The last time a host update was received */
    lastHostUpdate = Date.now();
    /** True if we're connected to the network */
    isConnected = false;
    /** True if this client is hosting the server */
    thisIsTheHostServer = false;
    /** The list of mobs that we're syncing across the network */
    localMobs: Mob[] = [];
    /** The player thats considered local and shouldn't be updated from the network */
    localPlayer?: Mob;
    /** True if we've received the game map */
    hadMap: boolean = false;
    /** The participant that represents the remote hosting server (if we're not the host) */
    hostParticipantId: RemoteParticipant | undefined;
    /** The list of mobs names that have been removed */
    removed: string[] = [];
    /** True if the networking has been started */
    started: boolean = false;
    /** The game map this network is running against */
    gameMap: GameMap;
    /** The central game controller */
    game: Game;

    /**
     * Create a new network session
     * 
     * @param game The central game controller
     * @param map The map to maintain
     */
    constructor(game: Game, map: GameMap) {
        this.game = game;
        this.gameMap = map;
    }

    /**
     * Update the visual list of players connected 
     * 
     * @param mobs The list of mobs that are the players
     */
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
    
    /**
     * Check if we're connected to the networking service.
     * 
     * @returns True if we're connected to the network
     */
    connected(): boolean {
        if (!NETWORKING_ENABLED) {
            return this.started;
        }

        return (this.hostParticipantId !== undefined) || this.thisIsTheHostServer;
    }
    
    /**
     * Start the networking service 
     * 
     * @param hosting True if we want to host the game
     */
    async startNetwork(hosting: boolean): Promise<void> {
        this.started = true;

        if (!NETWORKING_ENABLED) {
            return;
        }

        // request a token for accessing a LiveKit.io room. This is currently hard wired to the cokeandcode 
        // provider that uses kev's hidden livekit key. 
        const request = new XMLHttpRequest();
        request.open("GET", "https://cokeandcode.com/demos/unearthed/room.php?username=" + encodeURIComponent(this.game.username!) + 
                            "&room=" + this.game.serverId + "&serverPassword=" + this.game.serverPassword + "&password=" + NETWORK_PASSWORD, false);
        request.send();
        const token = request.responseText;

        this.thisIsTheHostServer = hosting;
        const wsURL = "wss://talesofyore.livekit.cloud"
    
        // connect to the live kit room
        await this.room.connect(wsURL, token);
    
        this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
            // if the hosting participant disconnects then go into frozen mode
            // until we get one back
            if (participant === this.hostParticipantId) {
                this.hostParticipantId = undefined;
                this.localMobs.splice(0, this.localMobs.length);
                this.localMobs.push(this.localPlayer!);
            } else {
                // otherwise if a participant disconnects remove their 
                // mob from the game
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
    
        // process messages received 
        this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
            const messageIsFromHost = participant?.metadata === "true";
            if (messageIsFromHost) {
                this.hostParticipantId = participant!;
            }

            // if the topic is "map" then we've got a big
            // binary blob coming that is the tile mapS
            if (topic === "map") {
                // only accept map updates from authenticated hosts
                if (messageIsFromHost) {
                    if (!this.thisIsTheHostServer) {
                        // parse the blob and update the game map
                        const fullArray: number[] = Array.from(payload);
                        const len: number = fullArray.length / 2;
                        this.gameMap.setMapData({
                            f: fullArray.slice(0, len),
                            b: fullArray.slice(len)
                        });
                        this.hadMap = true;
        
                        this.localPlayer?.reset();
                    }
                }
            } else {
                const strData = this.decoder.decode(payload);
                const message = JSON.parse(strData);

                // a remote client is requesting the game map - this happens when clients
                // connect to the room before the host got in
                if (message.type === "requestMap" && hosting) {
                    if (participant) {
                        this.sendMapUpdate(participant.sid);
                    }
                }

                // simple chat message, just display it
                if (message.type === "chatMessage") {
                    this.addChat(message.who, message.message);
                }

                // notification that a client who is hosting is around
                // we do a quick version check to prevent different
                // versions of the game connecting since that gets
                // very confusing
                if (message.type === "iAmHost" && !hosting) {
                    // only accept host messages from authenticated hosts
                    if (messageIsFromHost) {
                        this.hostParticipantId = participant!;
                        if (message.version !== "_VERSION_") {
                            alert("Game Version Mismatch");
                            location.reload();
                        }
                    }
                }

                // notification of a tile being updates. This can be sent from server
                // or client but only the server controls which tiles are actually applied
                if (message.type === "tileChange") {
                    // only accept host messages from authenticated hosts or if we're the server
                    if (messageIsFromHost || this.thisIsTheHostServer) {
                        this.gameMap.setTile(message.x, message.y, message.tile, message.layer);
                        this.gameMap.refreshSpriteTile(message.x, message.y);
                        if (this.thisIsTheHostServer) {
                            this.sendNetworkTile(message.x, message.y, message.tile, message.layer);
                        }
                    }
                }

                // remove a mob from the world
                if (message.type === "remove") {
                    const mob = this.localMobs.find(mob => mob.id === message.mobId);
                    if (mob) {
                        this.removed.push(mob.id);
                        this.localMobs.splice(this.localMobs.indexOf(mob), 1);
                        this.updatePlayerList(this.localMobs);
                    }
                }

                // the mains state update - all the mobs encoded with their network
                // state. If any mob didn't get an update for a while then 
                // remove it as a timeout. If we don't have a mob for a state update
                // then create it as a new player.
                if (message.type === "mobs") {
                    if (this.localMobs && this.localPlayer) {
                        // clients should only be sending 1 mob update - 
                        if (message.data.length === 1 || messageIsFromHost) {
                            for (const mobData of message.data) {
                                if (mobData.id !== this.localPlayer.id) {
                                    if (this.removed.includes(mobData.id)) {
                                        continue;
                                    }
        
                                    let targetMob = this.localMobs.find(mob => mob.id === mobData.id);
                                    if (!targetMob) {
                                        targetMob = new Mob(this, this.gameMap, mobData.id, mobData.name, HUMAN_SKELETON, mobData.x, mobData.y);
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
            }
        });
    
        console.log("Network started");
        this.isConnected = true;
    }
    
    /**
     * Add a chat to the session
     * 
     * @param who The name of the player that sent the chat
     * @param message The message they sent
     */
    addChat(who: string, message: string): void {
        if (!NETWORKING_ENABLED) {
            return;
        }
        
        // add the chat into the HTML
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
    
    /**
     * Send the state of block/tile map out across the network. This can either be
     * because a client requested it (then the target will be set) or at the start 
     * when the host joins and all players need it
     * 
     * @param target The participant ID of the player to send the map to or undefined to broadcast to all
     */
    sendMapUpdate(target: string | undefined) {
        if (!NETWORKING_ENABLED) {
            return;
        }
        if (!this.isConnected) {
            return;
        }
        
        const data = this.gameMap.getMapData();
        const dataBlocks = new Uint8Array([...data.f, ...data.b]);
        if (target) {
            this.room.localParticipant.publishData(dataBlocks, DataPacket_Kind.RELIABLE, { topic: "map", destination: [target] });
        } else {
            this.room.localParticipant.publishData(dataBlocks, DataPacket_Kind.RELIABLE, { topic: "map" });
        }
    }
    
    /**
     * Send a tile update across the network. This will be forwards to other via the server.
     * 
     * @param x The x coordinate of the tile being update
     * @param y The y coordinate of the tile being update
     * @param tile The tile to place on the map (or 0 to remove)
     * @param layer The layer to place the tile on
     */
    sendNetworkTile(x: number, y: number, tile: number, layer: number) {
        if (!NETWORKING_ENABLED) {
            this.gameMap.setTile(x, y, tile, layer);
            return;
        }
        
        if (this.thisIsTheHostServer) {
            // if we're the host then forward the update to all players
            this.gameMap.setTile(x, y, tile, layer);
            const data = JSON.stringify({ type: "tileChange", x, y, tile, layer });
            this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
        } else if (this.hostParticipantId) {
            // if we have a host then send it to just that host
            const data = JSON.stringify({ type: "tileChange", x, y, tile, layer });
            this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE, [this.hostParticipantId.sid]);
        }
    }
    
    /**
     * Send a chat messages across the network
     * 
     * @param who The name of the player sending the chat
     * @param message The message to send
     */
    sendChatMessage(who: string, message: string) {
        if (!NETWORKING_ENABLED) {
            return;
        }
        
        message = message.trim();
        if (message.length === 0) {
            return;
        }
    
        // broadcast the chat to everyone
        const data = JSON.stringify({ type: "chatMessage", who, message });
        this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
    
        this.addChat(who, message);
    }
    
    /**
     * Update the network by sending any regular messages
     * 
     * @param player The local player Mob
     * @param players The list of mob to sync
     */
    update(player: Mob, players: Mob[]) {
        this.localPlayer = player;
        this.localMobs = players;
    
        if (!this.isConnected) {
            return;
        }
    
        if (Date.now() - this.lastMapRequest > MAP_REQUEST_INTERVAL && this.hostParticipantId) {
            this.lastMapRequest = Date.now();
            if (!this.thisIsTheHostServer && !this.hadMap) {
                // request the map
                console.log("Requesting Map");
                const data = JSON.stringify({ type: "requestMap" });
                this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE, [this.hostParticipantId.sid]);
            }
        }
    
        // need to send out an "I am the host message"
        if (Date.now() - this.lastHostUpdate > MAP_REQUEST_INTERVAL && this.hostParticipantId) {
            this.lastHostUpdate = Date.now();
            const data = JSON.stringify({ type: "iAmHost", version: "_VERSION_" });
            this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.RELIABLE);
        }
    
        if (Date.now() - this.lastUpdate > UPDATE_INTERVAL_MS) {
            this.lastUpdate = Date.now();
    
            if (this.thisIsTheHostServer) {
                const data = JSON.stringify({ type: "mobs", host: true, data: players.map(mob => mob.getNetworkState()) });
                this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.LOSSY);
            } else {
                if (this.hostParticipantId) {
                    const data = JSON.stringify({ type: "mobs", host: false, data: [player.getNetworkState()] });
                    this.room.localParticipant.publishData(this.encoder.encode(data), DataPacket_Kind.LOSSY, [this.hostParticipantId.sid]);
                }
            }
        }
    }
}

