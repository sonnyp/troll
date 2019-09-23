// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

imports.searchPath.push('.');

const {base64, encoding, timers} = imports.std;
const {fetch} = imports.std.fetch;
const {WebSocket} = imports.std.WebSocket;
const {console} = imports.std.console;

Object.assign(window, base64, encoding, timers, {fetch, console, WebSocket});
