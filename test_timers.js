import './globals.js'
import GLib from 'gi://GLib'

const loop = GLib.MainLoop.new(null, false);

setInterval(() => {
    console.log('should print every 1s');
}, 1000);

setTimeout(() => {
    console.log('should print once');
}, 1000);

loop.run();
