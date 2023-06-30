/**
 * Listener to be notified on button state changes
 */
export interface ControllerListener {
    /**
     * Notification that a button has been pressed 
     * 
     * @param button The index of the button
     */
    buttonPressed(button: number): void;
    
    /**
     * Notification that a button has been released 
     * 
     * @param button The index of the button
     */
    buttonReleased(button: number): void;
}

/**
 * Wrapper round the JS gamepad API
 */
export class Controller {
    /** True if we've found gamepad support is available */
    enabled: boolean = false;
    /** True if the alternate stick is pressed left */
    altLeft: boolean = false;
    /** True if the alternate stick is pressed right */
    altRight: boolean = false;
    /** True if the alternate stick is pressed up */
    altUp: boolean = false;
    /** True if the alternate stick is pressed down */
    altDown: boolean = false;
    /** True if the primary stick is pressed left */
    left: boolean = false;
    /** True if the primary stick is pressed right */
    right: boolean = false;
    /** True if the primary stick is pressed up */
    up: boolean = false;
    /** True if the primary stick is pressed down */
    down: boolean = false;
    /** The state of the buttons on the controllers (true = pressed) */
    buttons: boolean[] = [];
    /** The list of listeners to notify of button changes */
    listeners: ControllerListener[] = [];
    /** The axes that are configured in order (primary horizontal, primary vertical, alternate horizontal, alternate vertical) */
    axesConfigured: number[] = [0,1,2,3];

    constructor() {
        if (typeof navigator.getGamepads !== 'undefined') {
            this.enabled = true;
        }
    }

    /**
     * Add a listener that will be notified of button changes
     * 
     * @param listener The listener to be added
     */
    addListener(listener: ControllerListener) {
        this.listeners.push(listener);
    }

    /**
     * Remove a listener that will no longer be notified of button changes
     * 
     * @param listener The listener to be remove
     */
    removeListener(listener: ControllerListener) {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    /**
     * Get the index of any active axis at the current time
     * 
     * @returns Index of the active axis or -1 for none
     */
    getActiveAxis(): number {
        const gamepads = navigator.getGamepads();
        if (gamepads.length > 0 && gamepads[0]) {
            const pad = gamepads[0];
            let bestAxes = -1;
            let bestValue = 0;
            for (let i=0;i<pad.axes.length;i++) {
                const value = Math.abs(pad.axes[i].valueOf());
                if (value > 0.3 && value <= 1) {
                    if (value > bestValue) {
                        bestAxes = i;
                        bestValue = value;
                    }
                }
            }

            return bestAxes;
        }

        return -1;
    }

    /**
     * Get the index of any active button at the current time
     * 
     * @returns Index of the active button or -1 for none
     */
    getActiveButton(): number {
        const gamepads = navigator.getGamepads();
        if (gamepads.length > 0 && gamepads[0]) {
            const pad = gamepads[0];

            return pad.buttons.findIndex(b => b.pressed);
        }

        return -1;
    }

    /**
     * Vibrate the controller if supported
     */
    vibrate(): void {
        const gamepads = navigator.getGamepads();
        if (gamepads.length > 0 && gamepads[0]) {
            const pad = gamepads[0];
            
            pad.vibrationActuator?.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 200,
                weakMagnitude: 1.0,
                strongMagnitude: 1.0,
            });
        }
    }

    /**
     * Update the gamepad state
     */
    update(): void {
        if (this.enabled) {
            const gamepads = navigator.getGamepads();
            if (gamepads.length > 0 && gamepads[0]) {
                const pad = gamepads[0];

                if (pad.axes.length > 1) {
                    const xaxis = pad.axes[this.axesConfigured[0]];
                    const yaxis = pad.axes[this.axesConfigured[1]];
                    const aaxis = pad.axes[this.axesConfigured[2]];
                    const baxis = pad.axes[this.axesConfigured[3]];

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
                            this.listeners.forEach(l => l.buttonPressed(i));
                        } else if (oldButtons[i] && !this.buttons[i]) {
                            this.listeners.forEach(l => l.buttonReleased(i));
                        }   
                    }
                }
            }
        }
    }
}