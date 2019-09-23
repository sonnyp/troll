imports.searchPath.push('.');

// eslint-disable-next-line no-unused-expressions
imports.globals;

const loop = imports.gi.GLib.MainLoop.new(null, false);

setInterval(() => {
    console.log('should print every 1s');
}, 1000);

setTimeout(() => {
    console.log('should print once');
}, 1000);



loop.run();


