
/**
 * Check if we're running on a tablet type device
 * 
 * @returns True if we're running on a tablet type device
 */
export function isTablet(): boolean {
    if (!isPhone() && isIOS()) {
        return true;
    }
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(navigator.userAgent.toLowerCase());

    return isTablet;
}
/**
 * Check if we're running on a mobile type (including tablets) device
 * 
 * @returns True if we're running on a mobile type (including tablets) device
 */
export function isMobile(): boolean {
    return isIOS() || isAndroid();
}

/**
 * Check if we're running on Android
 * 
 * @returns True if we're running on android
 */
export function isAndroid(): boolean {
    return navigator.userAgent.match(/Android/i) != null;
}

/**
 * Check if we're running on IOS
 * 
 * @returns True if we're running on IOS
 */
export function isIOS(): boolean {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].indexOf(navigator.platform) >= 0
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

/**
 * Check if we're running on a small phone device
 * 
 * @returns True if we're running on a small mobile device (phone like)
 */
export function isPhone(): boolean {
    return isIOS() && window.matchMedia("only screen and (max-width: 760px)").matches;
}