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

const urlParams = new URLSearchParams(window.location.search);
const portal = urlParams.get('portal');
if (portal) {
    game.ui.joinAsClient();
    document.getElementById("connect")!.style.display = "none";
}
