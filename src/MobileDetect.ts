
export function isTablet(): boolean {
    if (!isPhone() && isIOS()) {
        return true;
    }
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(navigator.userAgent.toLowerCase());

    return isTablet;
}

export function isMobile(): boolean {
    return isIOS() || isAndroid();
}

export function isAndroid(): boolean {
    return navigator.userAgent.match(/Android/i) != null;
}

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

export function isPhone(): boolean {
    return isIOS() && window.matchMedia("only screen and (max-width: 760px)").matches;
}