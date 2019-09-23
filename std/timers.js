// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

/* exported setTimeout, clearTimeout, setInterval, clearInterval */

const {GLib} = imports.gi;

function setTimeout(func, delay, ...args) {
    if (typeof delay !== 'number' || delay < 0)
        delay = 0;

    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
        func(...args);
        return false;
    });
}

function clearTimeout(id) {
    return GLib.source_remove(id);
}

function setInterval(func, delay, ...args) {
    if (typeof delay !== 'number' || delay < 0)
        delay = 0;

    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
        func(...args);
        return true;
    });
}

function clearInterval(id) {
    return GLib.source_remove(id);
}
