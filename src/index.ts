//
// Simple bootstrap 
//
import { GAME } from "./Game";
import { GAME_MAP } from "./Map";

GAME_MAP.clear();
if (!GAME_MAP.loadFromStorage()) {
    GAME_MAP.generate();
}
GAME_MAP.setDiscovered(0, 0);

GAME.startLoop();
