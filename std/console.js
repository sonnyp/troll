// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

/*
 * https://console.spec.whatwg.org/
 */

function printable(arg) {
    if (typeof arg === 'object')
        return JSON.stringify(arg, null, 2);
    else
        return arg.toString();
}

const console = {
    log(...args) {
        print(args.map(printable).join(' '));

    },
    error(...args) {
        printerr(args.map(printable).join(' '));
    },
    debug(...args) {
        this.log(...args);

    },
};

export default console
