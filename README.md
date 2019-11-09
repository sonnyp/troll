# troll

troll is an implementation of common JavaScript APIs for [gjs](https://gitlab.gnome.org/GNOME/gjs) and some helpers to make working with GLib easier.

## Status

- atob [src]('./std/base64')
- btoa [src]('./std/base64')
- console [src]('./std/console')
- TextDecoder [src]('./std/encoding')
- TextEncoder [src]('./std/encoding')
- fetch [src]('./std/fetch')
- setTimeout [src]('./std/timers')
- clearTimeout [src]('./std/timers')
- setInterval [src]('./std/timers')
- clearInterval [src]('./std/timers')
- WebSocket [src]('./std/WebSocket')

## Goals

1. Provide a familiar and simpler environment for building GNOME applications and extensions with JavaScript.
2. Allow application developers to use third party libraries

## Tested with

- [xmpp.js](https://github.com/xmppjs/xmpp.js)
- [aria2.js](https://github.com/sonnyp/aria2.js)

## globals

You can register all globals with

```js
import 'troll/globals'

// window.fetch
// window.WebSocket
// ...
```


## promiseTask(target, method, finish[, ...args])

* `target` [\<GObject.object\>](https://gjs-docs.gnome.org/gobject20/gobject.object)
* `method` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
* `finish` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
* `args` an array of arguments to pass to `method`
* Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

Run a Gio async operation and return a promise that resolve with the result of finish method or rejects.

Examples

```js
import {promiseTask} from 'troll/util'

const { File } = imports.gi.Gio;

(async () => {
  const file = File.new_for_path('/tmp/foobar')

  // see https://developer.gnome.org/gio/stable/GFile.html#g-file-replace-readwrite-async
  const stream = await promisetask(file, 'readwrite_async', 'readwrite_finish')
  log(stream)
})().catch(logError)
```


## once(target, signal[, errorSignal])

* `target` [\<GObject.object\>](https://gjs-docs.gnome.org/gobject20/gobject.object)
* `signal` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
* `errorSignal` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
* Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

Register a signal handler and remove it as soon as the signal is emitted. See also [connect](https://developer.gnome.org/gobject/stable/gobject-Signals.html#g-signal-connect).

Resolves with an array of params emitted by the signal.

If `errorSignal` is specified, an handler for it will be registered and the promise will rejects.

Examples

```js
import {once} from 'troll/util'

(async () => {
  const Button = new Gtk.Button ({label: "Click Me"});
  await once(Button, 'clicked')
  console.log('clicked!')
})().catch(logError)
```
