import { DataPacket_Kind, RemoteParticipant, Room, RoomEvent } from 'livekit-client';
import { Mob } from './Mob';
import { HUMAN_SKELETON } from './Skeletons';
import { MAP_DEPTH, MAP_WIDTH, SKY_HEIGHT, TILE_SIZE, getMapData, refreshSpriteTile, setMapData, setTile } from './Map';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const room = new Room();
let lastUpdate = Date.now();
let lastMapRequest = Date.now();
let lastHostUpdate = Date.now();
const UPDATE_INTERVAL_MS: number = 100;
const MAP_REQUEST_INTERVAL: number = 1000;
let connected = false;
let hostingServer = false;
let localMobs: Mob[] = [];
let localPlayer: Mob;
let hadMap: boolean = false;
let host: RemoteParticipant | undefined;
let removed: string[] = [];

export function updatePlayerList(mobs: Mob[]): void {
    const listDiv = document.getElementById("playerList")!;
    listDiv.innerHTML = "";

    for (const mob of mobs) {
        const div = document.createElement("div");
        div.innerHTML = mob.name.substring(0, 12);
        div.classList.add("nametag");
        listDiv.appendChild(div);
    }
}

export function networkConnected(): boolean {
    return (host !== undefined) || hostingServer;
}

export async function startNetwork(token: string, hosting: boolean) {
    hostingServer = hosting;
    const wsURL = "wss://talesofyore.livekit.cloud"

    await room.connect(wsURL, token);

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (participant === host) {
            host = undefined;
            localMobs.splice(0, localMobs.length);
            localMobs.push(localPlayer);
        } else {
            const mob = localMobs.find(m => m.sid === participant.sid);
            if (mob) {
                localMobs.splice(localMobs.indexOf(mob), 1);
                removed.push(mob.id);
                const data = JSON.stringify({ type: "remove", mobId: mob.id });
                room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.RELIABLE);
                updatePlayerList(localMobs);
            } else {
                console.log("No Mob found for participant");
            }
        }
    });

    room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
        if (topic === "map") {
            if (!hostingServer) {
                const fullArray: number[] = Array.from(payload);
                const len: number = fullArray.length / 2;
                setMapData({
                    f: fullArray.slice(0, len),
                    b: fullArray.slice(len)
                });
                hadMap = true;

                localPlayer.x = 200;
                localPlayer.y = (SKY_HEIGHT - 6) * TILE_SIZE;
            }
        } else {
            const strData = decoder.decode(payload);
            const message = JSON.parse(strData);
            if (message.type === "requestMap" && hosting) {
                if (participant) {
                    sendMapUpdate(participant.sid);
                }
            }
            if (message.type === "chatMessage") {
                addChat(message.who, message.message);
            }
            if (message.type === "iAmHost" && !hosting) {
                host = participant!;
                if (message.version !== "_VERSION_") {
                    alert("Game Version Mismatch");
                    location.reload();
                }
            }
            if (message.type === "tileChange") {
                setTile(message.x, message.y, message.tile, message.layer);
                refreshSpriteTile(message.x, message.y);
                if (hostingServer) {
                    sendNetworkTile(message.x, message.y, message.tile, message.layer);
                }
            }
            if (message.type === "remove") {
                const mob = localMobs.find(mob => mob.id === message.mobId);
                if (mob) {
                    removed.push(mob.id);
                    localMobs.splice(localMobs.indexOf(mob), 1);
                    updatePlayerList(localMobs);
                }
            }
            if (message.type === "mobs") {
                if (localMobs && localPlayer) {
                    if (message.host) {
                        host = participant;
                    }
                    for (const mobData of message.data) {
                        if (mobData.id !== localPlayer.id) {
                            if (removed.includes(mobData.id)) {
                                continue;
                            }

                            let targetMob = localMobs.find(mob => mob.id === mobData.id);
                            if (!targetMob) {
                                targetMob = new Mob(mobData.id, mobData.name, HUMAN_SKELETON, mobData.x, mobData.y);
                                localMobs.push(targetMob);
                                updatePlayerList(localMobs);
                            }

                            if (participant) {
                                targetMob.sid = participant.sid;
                            }
                            targetMob.updateFromNetworkState(mobData);
                        }
                    }
                }
            }
        }
    });

    console.log("Network started");
    connected = true;
}

export function addChat(who: string, message: string): void {
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

export function sendMapUpdate(target: string | undefined) {
    const data = getMapData();
    const dataBlocks = new Uint8Array([...data.f, ...data.b]);
    if (target) {
        room.localParticipant.publishData(dataBlocks, DataPacket_Kind.RELIABLE, { topic: "map", destination: [target] });
    } else {
        room.localParticipant.publishData(dataBlocks, DataPacket_Kind.RELIABLE, { topic: "map" });
    }
}

export function sendNetworkTile(x: number, y: number, tile: number, layer: number) {
    if (hostingServer) {
        setTile(x, y, tile, layer);
        const data = JSON.stringify({ type: "tileChange", x, y, tile, layer });
        room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.RELIABLE);
    } else if (host) {
        const data = JSON.stringify({ type: "tileChange", x, y, tile, layer });
        room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.RELIABLE, [host.sid]);
    }
}

export function sendChatMessage(who: string, message: string) {
    message = message.trim();
    if (message.length === 0) {
        return;
    }

    const data = JSON.stringify({ type: "chatMessage", who, message });
    room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.RELIABLE);

    addChat(who, message);
}

export function networkUpdate(player: Mob, players: Mob[]) {
    localPlayer = player;
    localMobs = players;

    if (!connected) {
        return;
    }

    if (Date.now() - lastMapRequest > MAP_REQUEST_INTERVAL && host) {
        lastMapRequest = Date.now();
        if (!hostingServer && !hadMap) {
            // request the map
            console.log("Requesting Map");
            const data = JSON.stringify({ type: "requestMap" });
            room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.RELIABLE, [host.sid]);
        }
    }

    // need to send out an "I am the host message"
    if (Date.now() - lastHostUpdate > MAP_REQUEST_INTERVAL && host) {
        lastHostUpdate = Date.now();
        const data = JSON.stringify({ type: "iAmHost", version: "_VERSION_" });
        room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.RELIABLE);
    }

    if (Date.now() - lastUpdate > UPDATE_INTERVAL_MS) {
        lastUpdate = Date.now();

        if (hostingServer) {
            const data = JSON.stringify({ type: "mobs", host: true, data: players.map(mob => mob.getNetworkState()) });
            room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.LOSSY);
        } else {
            if (host) {
                const data = JSON.stringify({ type: "mobs", host: false, data: [player.getNetworkState()] });
                room.localParticipant.publishData(encoder.encode(data), DataPacket_Kind.LOSSY, [host.sid]);
            }
        }
    }
}

