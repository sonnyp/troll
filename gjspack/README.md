# gjspack

A bundler for GNOME JavaScript.

This is in development alpha software, use at your own risk.

gjspack lets your import anything and bundles everything for you, think [webpack](https://webpack.js.org/) for GJS.

Just like that:

```js
// import any file as resource path
import Pumpkin from "./Pumpkin.png";
const picture = Gtk.Picture.new_from_resource(Pumpkin);

// import JSON
import manifest from "../flatpak.json" with { type: "json" };
console.log(manifest["app-id"]);

// import string
import os_release from "/etc/os-release" with {type: "string"};
console.log(os_release);
```

See [Examples](#Examples) below.

Features:

- bundle imports into a gresource - no more maintaining `*.gresource.xml` files
- import and bundle any file as a `resource://` URI
- transform at build time to
  - string `with {type: "string"}`
  - GBytes with `with {type: "bytes"}`
  - JSON with `with {type: "json"}`
  - Gtk.CssProvider with `with {type: "css"}`
  - `resource://` uri with `with {type: "uri"}`
  - registered icons with `with {type: "icon"}`
- deduplicate imports
- retain source lines (maintain correct stack traces)
- automatically add missing files to `POTFILES`
- supports [Blueprint](https://gnome.pages.gitlab.gnome.org/blueprint-compiler/)
- support custom transformers
- support [import maps](https://github.com/WICG/import-maps)

## Examples

<details>
  <summary>Image</summary>

```js
import Porygon from "./Porygon.png";

// GtkPicture displays an image at its natural size
const picture = Gtk.Picture.new_from_picture(Porygon);
// or
picture.set_resource(Porygon);

// GtkImage if you want to display a fixed-size image, such as an icon.
const image = Gtk.Image.new_from_resource(Porygon);
// or
image.set_resource(Porygon);
```

</details>

<details>
  <summary>Interface</summary>

You can import xml `.ui` or [blueprint](https://gnome.pages.gitlab.gnome.org/blueprint-compiler/) `blp` files.
Combined with troll `build` method, you can load, build and bind interfaces easily.

See [troll build](../README.md#build)

```js
import Interface from "./Window.ui" with { type: "uri" };
// or
import Interface from "./Window.blp" with { type: "uri" };

import {build} from "./troll/src/util.js";

function Window() {
  const {window} = build(Interface);
}
```

For blueprint support, if you are on GNOME SDK >= 49 you have nothing to do.

Otherwise you will need `blueprint-compiler` but you don't need the meson submodule.

See [https://gnome.pages.gitlab.gnome.org/blueprint-compiler/flatpak.html](this) for Flatpak.
Or you can just close the directory and specify the path to the executable.

```
git clone https://gitlab.gnome.org/GNOME/blueprint-compiler.git ~/blueprint-compiler
gjspack --blueprint-compiler=~/blueprint-compiler/blueprint-compiler.py
```

</details>

<details>
  <summary>Template</summary>

```js
import Template from "./MyWidget.ui" with { type: "uri" };
// or (see above to setup Blueprint)
import Template from "./MyWidget.blp" with { type: "uri" };

GObject.registerClass(
  {
    Template,
  },
  class X extends GObject.Object {},
);
```

</details>

<details>
  <summary>Video</summary>

```js
import AnimatedLogo from "./AnimatedLog.webm";

const video = Gtk.Video.new_from_resource(AnimatedLogo);
// or
video.set_resource(AnimatedLogo);
```

</details>

<details>
  <summary>Text</summary>

```js
import notes from "./notes.txt" with { type: "string" };

console.log(notes);
```

</details>

<details>
  <summary>JSON</summary>

```js
import pkg from "./package.json" with { type: "json" };

console.log(pkg.name);
```

</details>

<details>
  <summary>CSS</summary>

```js
import provider from "./styles.css" with { type: "css" };

Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
);
```

</details>

<details>
  <summary>icon</summary>

```js
import myicon from "./myicon-symbolic.svg" with { type: "icon" };

const image = new Gtk.Image({
  icon_name: myicon,
});
```

```blp
Image {
  icon-name: "myicon-symbolic";
}
```

</details>

<details>
  <summary>Arbitrary files</summary>

This example is taken directly from the [Commit](https://github.com/sonnyp/Commit/) app.

```js
import "./language-specs/git.lang";
import "./language-specs/hg.lang";

const language_manager = GtkSource.LanguageManager.get_default();
language_manager.set_search_path([
  ...language_manager.get_search_path(),
  GLib.Uri.resolve_relative(
    import.meta.url,
    "language-specs",
    GLib.UriFlags.NONE,
  ),
]);
```

</details>

<details>
  <summary>Sass / custom transforms</summary>

Custom transforms are only supported with the API, not the CLI.

See [example](./demo/dev.js).

</details>

<details>
  <summary>Import maps</summary>

main.js

```js
import lodash from "lodash";
import foo from "foo";
import Gtk from "gtk";
```

import_map.json

```json
{
  "imports": {
    "foo": "./src/foo.js",
    "gtk": "gi://Gtk?version=4.0",
    "lodash": "./node_modules/lodash-es/lodash.js"
  }
}
```

Either pass `--import-map=import_map.json` to `gjspack` CLI or `import_map: GFile` to `gjspack()`

</details>

## CLI

```sh
./bin/gjspack --help
```

## Use with meson

Add `troll` as a git submodule

In your `src/meson.build`:

```meson
blueprint_compiler = find_program('blueprint-compiler')
gjspack = find_program('../troll/gjspack/bin/gjspack')
gresource = custom_target('gjspack',
  input: ['main.js', '../po/POTFILES'],
  output: meson.project_name() + '.src.gresource',
  command: [
    gjspack,
    '--appid=' + meson.project_name(),
    '--project-root', meson.source_root(),
    '--resource-root', meson.project_source_root(),
    '--blueprint-compiler', blueprint_compiler,
    '--no-executable',
    '@INPUT0@',
    '--potfiles', '@INPUT1@',
    '@OUTDIR@',
  ],
  install: true,
  install_dir: pkgdatadir,
  build_always_stale: true,
)
```

Test, port your code and once it works properly , you can remove your `*.gresource.xml` files as well as the `gnome.compile_resources` meson instruction.

See also [Commit](https://github.com/sonnyp/Commit/tree/main/src) and [Junction](https://github.com/sonnyp/Junction/tree/main/src) for examples with custom executables which don't use `imports.package.init`.

## How does it work?

Given a ES module file, gjspack use an [an ES module parser](https://github.com/guybedford/es-module-lexer/) to detect imports recursively, replace them and bundle all files appropriately in a [Gio.Resource](https://docs.gtk.org/gio/struct.Resource.html).

## Demo

This is a demonstration of a simple application using gjspack.

### Dev

```sh
cd demo
./dev.js
```

### Host

```sh
cd demo
# bundle
../bin/gjspack --appid=gjspack-demo ./main.js ./build
# run
./build/gjspack-demo
```

### Flatpak

```sh
cd demo
# bundle FIXME - test working
flatpak-builder --user --force-clean --install flatpak flatpak.json
# run
flatpak run re.sonny.gjspack.Demo
```

## Development

```sh
# make changes

# then test with
./src/cli.js --help

# then build with
make

# pass the test
make test

# run the demo
make demo

# make sure everything is ok
make ci
```

## Q&A

### Why not a rollup plugin?

GJS doesn't support Source Maps ([yet?](https://gitlab.gnome.org/GNOME/gjs/-/issues/474)).
Stack traces would be unreadable.

## Guidelines

- Provide a familiar development environment to Web developers
- Explore ideas to improve GNOME developer experience
- Integrates with GNOME tooling (flatpak, meson, ...)
- Avoid Web development dependencies
- Retain line numbers and usable stack traces
- Remove boilerplate code to convert data before using
- Fast - forget gjspack is even there

## Ideas

- [x] import and bundle JavaScript imports
- [x] import and bundle any file as resource path
- [x] transform recursively
- [x] bundle sources files outside of `$PWD`
- [x] bundle data files outside of `$PWD`
- [x] deduplicate files imported multiple times
- [x] support unnamed imports
- [x] meson doc
- [x] import css
- [x] import from UI
- [x] JSON modules https://github.com/tc39/proposal-json-modules
- [x] import any file as gbytes
- [x] automatically add files to POTFILES
- [x] import blueprint files
- [x] support dynamic imports
- [x] bundle/import as icon-name `/com/example/icons/scalable/actions`
- [x] Import maps https://github.com/WICG/import-maps
- [ ] watch mode / live reload
- [ ] flatpak doc
- [ ] meson subproject
- [ ] import fonts
- [ ] support `import foo from 'http://...'` - ala deno
- [ ] gresource preprocess (`xml-stripblanks` and `json-stripblanks`)
- [ ] gresource compress ?
- [ ] cache
- [ ] Support other programming languages? Ping me if there is any interest.
- [ ] one file mode (gresource inside .js executable)
- [ ] ~`import foo from './foo.ui#object_id' with {type: "builder"}`~ use troll build
- [ ] ~`import {window, button} from './foo.ui' with {type: "builder"}`~ use troll build
- [ ] ~~resolve `import foo from 'bar'` from `node_modules`~~ (import maps and http instead)

## Credits

* [es-module-lexer](https://github.com/guybedford/es-module-lexer)
* [ltx](https://github.com/xmppjs/ltx/)
