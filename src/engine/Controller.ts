export interface ControllerListener {
    buttonPressed(button: number): void;
    
    buttonReleased(button: number): void;
}

export class Controller {
    enabled: boolean = false;
    altLeft: boolean = false;
    altRight: boolean = false;
    altUp: boolean = false;
    altDown: boolean = false;
    left: boolean = false;
    right: boolean = false;
    up: boolean = false;
    down: boolean = false;
    buttons: boolean[] = [];
    listeners: ControllerListener[] = [];

    firstStickAxes: number[] = [0,1];
    secondStickAxes: number[] = [2,5];

    constructor() {
        if (typeof navigator.getGamepads !== 'undefined') {
            this.enabled = true;
        }
    }

    addListener(listener: ControllerListener) {
        this.listeners.push(listener);
    }

    removeListener(listener: ControllerListener) {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    update(): void {
        if (this.enabled) {
            const gamepads = navigator.getGamepads();
            if (gamepads.length > 0 && gamepads[0]) {
                const pad = gamepads[0];

                if (pad.axes.length > 1) {
                    const xaxis = pad.axes[this.firstStickAxes[0]];
                    const yaxis = pad.axes[this.firstStickAxes[1]];
                    const aaxis = pad.axes[this.secondStickAxes[0]];
                    const baxis = pad.axes[this.secondStickAxes[1]];

                    if (xaxis.valueOf() < -0.5) {
                        this.left = true;
                        this.right = false;
                    } else if (xaxis.valueOf() > 0.5) {
                        this.right = true;
                        this.left = false;
                    } else {
                        this.right = false;
                        this.left = false;
                    }

                    if (yaxis.valueOf() < -0.5) {
                        this.up = true;
                        this.down = false;
                    } else if (yaxis.valueOf() > 0.5) {
                        this.down = true;
                        this.up = false;
                    } else {
                        this.down = false;
                        this.up = false;
                    }

                    if (aaxis.valueOf() < -0.5) {
                        this.altLeft = true;
                        this.altRight = false;
                    } else if (aaxis.valueOf() > 0.5) {
                        this.altRight = true;
                        this.altLeft = false;
                    } else {
                        this.altRight = false;
                        this.altLeft = false;
                    }

                    if (baxis.valueOf() < -0.5) {
                        this.altUp = true;
                        this.altDown = false;
                    } else if (baxis.valueOf() > 0.5) {
                        this.altDown = true;
                        this.altUp = false;
                    } else {
                        this.altDown = false;
                        this.altUp = false;
                    }

                    const oldButtons = this.buttons;
                    this.buttons = pad.buttons.map(b => b.pressed);
                    for (let i=0;i<oldButtons.length;i++) {
                        if (!oldButtons[i] && this.buttons[i]) {
                            console.log("Button: " + i + " pressed");
                            this.listeners.forEach(l => l.buttonPressed(i));
                        } else if (oldButtons[i] && !this.buttons[i]) {
                            console.log("Button: " + i + " released");
                            this.listeners.forEach(l => l.buttonReleased(i));
                        }   
                    }
                }
            }
        }
    }
}