//
// Simple bootstrap 
//

import { Game } from "./Game";

console.log("██    ██ ███    ██ ███████  █████  ██████  ████████ ██   ██ ███████ ██████  ");
console.log("██    ██ ████   ██ ██      ██   ██ ██   ██    ██    ██   ██ ██      ██   ██ ");
console.log("██    ██ ██ ██  ██ █████   ███████ ██████     ██    ███████ █████   ██   ██ ");
console.log("██    ██ ██  ██ ██ ██      ██   ██ ██   ██    ██    ██   ██ ██      ██   ██ ");
console.log(" ██████  ██   ████ ███████ ██   ██ ██   ██    ██    ██   ██ ███████ ██████ ");

console.log("");
console.log("Version _VERSION_")
console.log("");

const game = new Game();
game.startLoop();