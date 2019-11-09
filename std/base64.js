// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const {GLib} = imports.gi;

export function atob(data) {
    return GLib.base64_decode(data);
}

export function btoa(data) {
    return GLib.base64_encode(data);
}
