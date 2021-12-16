# troll

troll is an implementation of common JavaScript APIs for [gjs](https://gitlab.gnome.org/GNOME/gjs) and some helpers to make working with GLib easier.

See [this gjs issue](https://gitlab.gnome.org/GNOME/gjs/-/issues/265) for context.

Requires gjs 1.68.0 with [ESModules](https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md).

## Status

- WebSocket [src](std/WebSocket.js)
- fetch [src](std/fetch.js)
- base64
  - atob [src](std/base64.js)
  - btoa [src](std/base64.js)
- timers
  - setTimeout [src](std/timers.js)
  - clearTimeout [src](std/timers.js)
  - setInterval [src](std/timers.js)
  - clearInterval [src](std/timers.js)
- ~~console~~ builtin gjs 1.70
- ~~TextDecoder/TextEncoder~~ builtin gjs 1.70

## Goals

1. Provide a familiar and simpler environment for building GNOME applications and extensions with JavaScript.
2. Allow application developers to use third party libraries

## Tested with

- [xmpp.js](https://github.com/xmppjs/xmpp.js)
- [aria2.js](https://github.com/sonnyp/aria2.js)

## globals

You can register all globals with

```js
import "./troll/globals.js";

// globalThis.fetch
// globalThis.WebSocket
// ...
```

## promiseTask(target, method, finish[, ...args])

- `target` [\<GObject.object\>](https://gjs-docs.gnome.org/gobject20/gobject.object)
- `method` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `finish` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `args` an array of arguments to pass to `method`
- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

Run a Gio async operation and return a promise that resolve with the result of finish method or rejects.

Examples

```js
import { promiseTask } from "./troll/util.js";
import Gio from "gi://Gio";

(async () => {
  const file = Gio.File.new_for_path("/tmp/foobar");

  // see https://developer.gnome.org/gio/stable/GFile.html#g-file-replace-readwrite-async
  const stream = await promisetask(file, "readwrite_async", "readwrite_finish");
  log(stream);
})().catch(logError);
```

## once(target, signal[, errorSignal])

- `target` [\<GObject.object\>](https://gjs-docs.gnome.org/gobject20/gobject.object)
- `signal` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `errorSignal` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

Register a signal handler and remove it as soon as the signal is emitted. See also [connect](https://developer.gnome.org/gobject/stable/gobject-Signals.html#g-signal-connect).

Resolves with an array of params emitted by the signal.

If `errorSignal` is specified, an handler for it will be registered and the promise will rejects.

Examples

```js
import { once } from "./troll/util.js";

(async () => {
  const Button = new Gtk.Button({ label: "Click Me" });
  await once(Button, "clicked");
  console.log("clicked!");
})().catch(logError);
```

## gsx

gsx is a small function to write Gtk.

You can use it as a jsx pragma with [babel](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx) like so:

```js
import gsx from "./troll/gsx.js";

/** @jsx gsx */

function Button() {
  return (
    <button connect-clicked={() => openDir(gid)} halign={Align.END}>
      <image icon-name="folder-open-symbolic" pixel-size={48} />
    </button>
  );
}
```

or without babel

```js
import gsx, { Align } from "./troll/gsx.js";

function Button() {
  return gsx(
    "button",
    {
      "connect-clicked": () => log("clicked"),
      halign: Align.END,
    },
    gsx("image", {
      "icon-name": "folder-open-synbolic",
      "pixel-size": 48,
    })
  );
}
```

both are equivalent to

```js
const Gtk = imports.gi.Gtk;
const { Align } = Gtk;

function Button() {
  const image = new Gtk.Image({
    "icon-name": "folder-open-synbolic",
    "pixel-size": 48,
  });

  const button = new Gtk.Button({
    halign: Align.END,
  });
  button.connect("signal", () => {
    log("clicked!");
  });

  button.add(image);
}
```
