import { Game } from "./Game";

/**
 * A step in controller configuration. A message will be displayed
 * to the user and the control waited for
 */
export interface ControllerSetupStep {
    /**
     * Get the message to display to the user during this step
     * 
     * @return The message to display to the user
     */
    getLabel(): string;

    /**
     * Check if this step has been completed. 
     * 
     * @param game The game context to perform the check
     * @return True if the step is completed
     */
    check(game: Game): boolean;
}

export class AxisSetupStep implements ControllerSetupStep {
    label: string;
    axis: number;
    hasBeenClear: boolean = false;

    constructor(label: string, axis: number) {
        this.label = label;
        this.axis = axis;
    }

    /**
     * Get the message to display to the user during this step
     * 
     * @return The message to display to the user
     */
    getLabel(): string {
        return this.label;
    }

    /**
     * Check if this step has been completed. 
     * 
     * @param game The game context to perform the check
     * @return True if the step is completed
     */
    check(game: Game): boolean {
        const active = game.gamepad.getActiveAxis();
        if (this.hasBeenClear) {
            if (active >= 0) {
                game.gamepad.axesConfigured[this.axis] = active;
                return true;
            }
        } else if (active === -1) {
            this.hasBeenClear = true;
        }

        return false;
    }
}

export class ButtonSetupStep implements ControllerSetupStep {
    label: string;
    button: string;
    hasBeenClear: boolean = false;

    /**
     * Get the message to display to the user during this step
     * 
     * @return The message to display to the user
     */
    constructor(label: string, button: string) {
        this.label = label;
        this.button = button;
    }

    /**
     * Get the message to display to the user during this step
     * 
     * @return The message to display to the user
     */
    getLabel(): string {
        return this.label;
    }


    /**
     * Check if this step has been completed. 
     * 
     * @param game The game context to perform the check
     * @return True if the step is completed
     */
    check(game: Game): boolean {
        const active = game.gamepad.getActiveButton();
        if (this.hasBeenClear) {
            if (active >= 0) {
                (game.controllerButtons as any)[this.button] = active;
                return true;
            }
        } else if (active === -1) {
            this.hasBeenClear = true;
        }

        return false;
    }
}

export class KeySetupStep implements ControllerSetupStep {
    label: string;
    key: string;
    hasBeenClear: boolean = false;

    /**
     * Get the message to display to the user during this step
     * 
     * @return The message to display to the user
     */
    constructor(label: string, key: string) {
        this.label = label;
        this.key = key;
    }

    /**
     * Get the message to display to the user during this step
     * 
     * @return The message to display to the user
     */
    getLabel(): string {
        return this.label;
    }
    
    check(game: Game): boolean {
        let keyDown = undefined;

        for (const k of Object.keys(game.keyDown)) {
            if (game.keyDown[k]) {
                keyDown = k;
            }
        }

        if (keyDown) {
            if (this.hasBeenClear) {
                (game.keyControls as any)[this.key] = keyDown;
                return true;
            }
        } else {
            this.hasBeenClear = true;
        }
        
        return false;
    }

}
/**
 * The index of controller buttons that are configured
 */
export interface ControllerButtons {
    /** The next item button */
    next: number;
    /** The previous item button */
    prev: number;
    /** The jump button */
    jump: number;
    /** The toggle place layer button */
    layer: number;
    /** The trigger item button */
    trigger: number;
}

export interface KeyControls {
    /** The next item button */
    up: string;
    /** The next item button */
    down: string;
    /** The next item button */
    left: string;
    /** The next item button */
    right: string;
    /** The next item button */
    next: string;
    /** The previous item button */
    prev: string;
    /** The toggle place layer button */
    layer: string;
    /** The trigger item button */
    trigger: string;
}
/**
 * The steps for the user to follow for configuring a controller
 */
export const CONTROLLER_SETUP_STEPS: ControllerSetupStep[] = [
    new AxisSetupStep("Push Move Right Control!", 0),
    new AxisSetupStep("Push Move Up Control!", 1),
    new AxisSetupStep("Push Dig Right Control!", 2),
    new AxisSetupStep("Push Dig Up Control!", 3),
    new ButtonSetupStep("Press Jump Button!", "jump"),
    new ButtonSetupStep("Press Previous Item Button!", "prev"),
    new ButtonSetupStep("Press Next Item Button!", "next"),
    new ButtonSetupStep("Press Layer Switch Button!", "layer"),
    new ButtonSetupStep("Press Trigger Button!", "trigger"),
];

export const KEYS_SETUP_STEPS: ControllerSetupStep[] = [
    new KeySetupStep("Press the Key For Up!", "up"),
    new KeySetupStep("Press the Key For Down!", "down"),
    new KeySetupStep("Press the Key For Left!", "left"),
    new KeySetupStep("Press the Key For Right!", "right"),
    new KeySetupStep("Press the Key For Next Item!", "next"),
    new KeySetupStep("Press the Key For Previous Item!", "prev"),
    new KeySetupStep("Press the Key For Layer Switch!", "layer"),
    new KeySetupStep("Press the Key For Triggering!", "trigger"),
];
