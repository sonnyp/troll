# troll

troll is an implementation of common JavaScript APIs for [gjs](https://gitlab.gnome.org/GNOME/gjs) and some helpers.

See [this gjs issue](https://gitlab.gnome.org/GNOME/gjs/-/issues/265) for context.

This is not API stable and no release were made. Use at your own risk.
Contributions welcome.

## Status

- WebSocket [src](src/std/WebSocket.js)
- fetch [src](src/std/fetch.js)
  - request
    - method/url
    - headers
    - text body
  - response
    - status/statusText/ok
    - text() / json()
- base64
  - atob [src](src/std/base64.js)
  - btoa [src](src/std/base64.js)
- crypto
  - getRandomValues [src](src/std/crypto.js)
- ~~timers~~ builtin gjs 1.72
- ~~console~~ builtin gjs 1.70
- ~~TextDecoder/TextEncoder~~ builtin gjs 1.70

## Goals

1. Provide a familiar environment for building GNOME applications
2. Allow application developers to use third party libraries
3. Encourage Shell extension developers to make flatpak apps instead

## Tested with

- [xmpp.js](https://github.com/xmppjs/xmpp.js)
- [aria2.js](https://github.com/sonnyp/aria2.js)

## globals

You can register all globals with

```js
import "./troll/src/globals.js";

// fetch(...)
// new WebSocket(...)
// atob(...)
// btoa(...)
```

## resolve

Arguments

- `base` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) a base uri
- `uri` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) a path or uri, can be absolute or relative

Returns [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) the resolved uri

Similar to `import.meta.resolve` or `new URL(url, base)`.

```js
import { resolve } from "./troll/src/main.js";

console.log(resolve(import.meta.url, "./xml.js"));
// resource:///some/path/xml.js
// or
// file:///some/path/xml.js

console.log(resolve("http://foo.example", "http://bar.example"));
// http://bar.example
```

## resolveParse

Arguments

- `base` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) a base uri
- `uri` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type) a path or uri, can be absolute or relative

Returns [\<GLib.Uri\>](https://gjs-docs.gnome.org/glib20~2.0/glib.uri) the resolved uri

Same as `resolve` but returns a `GLib.Uri` instead of a `string`.

## promiseTask

Arguments

- `target` [\<GObject.object\>](https://gjs-docs.gnome.org/gobject20/gobject.object)
- `method` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `finish` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `...args` the list of arguments to pass to `method`

Returns [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) resolves or rejects with the result of the finish function

Run a Gio async operation and return a promise that resolve with the result of finish method or rejects.

See also [Gio.\_promisify](https://gjs.guide/guides/gjs/asynchronous-programming.html#promisify-helper)

Examples

```js
import { promiseTask } from "./troll/src/main.js";
import Gio from "gi://Gio";

(async () => {
  const file = Gio.File.new_for_path("/tmp/foobar");

  // see https://developer.gnome.org/gio/stable/GFile.html#g-file-replace-readwrite-async
  const stream = await promisetask(file, "readwrite_async", "readwrite_finish");
  log(stream);
})().catch(logError);
```

<!-- ## once(target, signal[, errorSignal])

- `target` [\<GObject.object\>](https://gjs-docs.gnome.org/gobject20/gobject.object)
- `signal` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `errorSignal` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- Returns: [\<Promise\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

Register a signal handler and remove it as soon as the signal is emitted. See also [connect](https://developer.gnome.org/gobject/stable/gobject-Signals.html#g-signal-connect).

Resolves with an array of params emitted by the signal.

If `errorSignal` is specified, an handler for it will be registered and the promise will rejects.

Examples

```js
import { once } from "./troll/src/util.js";

(async () => {
  const Button = new Gtk.Button({ label: "Click Me" });
  await once(Button, "clicked");
  console.log("clicked!");
})().catch(logError);
``` -->

## build

Arguments

- `uri` [\<string\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type)
- `params` [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

Returns [\<Object\>](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)

A helper function to easily load, build and bind a GTK XML interface. Here is an example

<details>
  <summary>window.js</summary>

```js
#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import { build, resolve } from "./troll/src/main.js";

const app = new Gtk.Application({
  application_id: "hello.world",
});

app.connect("activate", () => {
  const { window, button } = build(resolve(import.meta.url, "./window.xml"), {
    onclicked,
    app,
  });
  button.label = "World";
  window.present();
});

app.runAsync(null);

function onclicked(button) {
  console.log("Hello", button.label);
  app.activeWindow?.close();
}
```

</details>

<details>
  <summary>window.xml</summary>

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<interface>
  <requires lib="gtk" version="4.0" />
  <object class="GtkApplicationWindow" id="window">
    <property
      name="title"
      bind-source="app"
      bind-property="application-id"
      bind-flags="sync-create"
    />
    <binding name="application">
      <constant>app</constant>
    </binding>
    <property name="default-width">400</property>
    <property name="default-height">400</property>
    <child>
      <object class="GtkButton" id="button">
        <signal name="clicked" handler="onclicked" />
      </object>
    </child>
  </object>
</interface>
```

</details>

<details>
  <summary>window.blp</summary>

```css
using Gtk 4.0;

ApplicationWindow window {
  title: bind-property app.application-id;
  application: bind app;
  default-width: 400;
  default-height: 400;

  Button button {
    clicked => $onclicked();
  }
}
```

</details>

---

ℹ️ `build` is for `<interface/>` only, for `<template/>`, use [`GObject.registerClass`](https://gjs.guide/guides/gtk/3/14-templates.html#loading-the-template)

## gsx

gsx is a small function to write Gtk.

See [gsx-demo](./gsx-demo) for setup and instructions with Babel.

You can use it as a jsx pragma with [babel](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx), [TypeScript](https://www.typescriptlang.org/tsconfig#jsxFactory), [SWC](https://swc.rs/) or [Rome](https://rome.tools/) like so:

```jsx
import Gtk from "gi://Gtk?version=4.0";
import gsx from "./troll/src/main.js";

/** @jsx gsx.h */
/** @jsxFrag gsx.Fragment */

export default function MyButton() {
  return (
    <Gtk.Button connect-clicked={() => log("clicked")} halign={Gtk.Align.END}>
      <Gtk.Image icon-name="folder-open-symbolic" pixel-size={48} />
    </Gtk.Button>
  );
}
```

GJS doesn't support source map yet. We recommend babel as it is the only option capable of [retaining line numbers](https://babeljs.io/docs/options#retainlines).

<details>
    <summary>Equivalent without gsx</summary>

```js
import Gtk from "gi://Gtk?version=4.0";

export default function MyButton() {
  const image = new Gtk.Image({
    "icon-name": "folder-open-synbolic",
    "pixel-size": 48,
  });

  const button = new Gtk.Button({
    halign: Gtk.Align.END,
  });
  button.connect("signal", () => {
    log("clicked!");
  });

  button.add(image);
}
```

</details>

<details>
  <summary>Usage without a compiler</summary>

```js
import Gtk from "gi://Gtk?version=4.0";
import gsx from "./troll/src/main.js";

const { Button, Align, Image } = Gtk;

export default function MyButton() {
  return gsx(
    Button,
    {
      "connect-clicked": () => log("clicked"),
      halign: Align.END,
    },
    gsx(Image, {
      "icon-name": "folder-open-synbolic",
      "pixel-size": 48,
    }),
  );
}
```

</details>
