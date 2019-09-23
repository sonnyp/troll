// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

/* exported atob, btoa */

const {GLib} = imports.gi;

function atob(data) {
    return GLib.base64_decode(data);
}

function btoa(data) {
    return GLib.base64_encode(data);
}
