// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const {GLib} = imports.gi;

export function setTimeout(func, delay, ...args) {
    if (typeof delay !== 'number' || delay < 0)
        delay = 0;

    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
        func(...args);
        return false;
    });
}

export function clearTimeout(id) {
    return GLib.source_remove(id);
}

export function setInterval(func, delay, ...args) {
    if (typeof delay !== 'number' || delay < 0)
        delay = 0;

    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
        func(...args);
        return true;
    });
}

export function clearInterval(id) {
    return GLib.source_remove(id);
}
