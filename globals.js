// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const {base64, encoding, timers} = imports.troll.std;
const {fetch} = imports.troll.std.fetch;
const {WebSocket} = imports.troll.std.WebSocket;
const {console} = imports.troll.std.console;

Object.assign(window, base64, encoding, timers, {fetch, console, WebSocket});
