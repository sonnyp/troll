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
import manifest from "../flatpak.json" assert { type: "json" };
console.log(manifest["appid"]);

// import XML UI as GtkBuilder
import builder from "./window.ui" assert { type: "builder" };
// or Blueprint UI as GtkBuilder
import builder from "./window.blp" assert { type: "builder" };
builder.get_object("window").present();
```

See [Examples](#Examples) below.

Features:

- bundle imports into a gresource - no more maintaining `*.gresource.xml` files
- import and bundle any file as a `resource://` URI
- assert types to import as
  - string `assert {type: "string"}`
  - GBytes with `assert {type: "bytes"}`
  - JSON with `assert {type: "json"}`
  - Gtk.Builder with `assert {type: "builder"}`
  - Gtk.CssProvider with `assert {type: "css"}`
  - `resource://` uri with `assert {type: "uri"}`
- deduplicate imports
- retain source lines (maintain correct stack traces)
- automatically add missing entries to POTFILES
- suppots Blueprint

Goals:

- Provide a familiar development environment to Web developers
- Explore ideas to improve GNOME developer experience
- Integrates with GNOME tooling (flatpak, meson, ...)
- Avoid Web development dependencies
- Retain line numbers and usable stack traces
- Remove boilerplate code to convert data before using them
- Fast - forget gjspack is even there

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
  <summary>UI</summary>

You can import xml `.ui` or [blueprint](https://jwestman.pages.gitlab.gnome.org/blueprint-compiler) `blp` files.

```js
import builder from "./Window.ui" assert { type: "builder" };
// or
import builder from "./Window.blp" assert { type: "builder" };

const window = builder.get_object("window");
```

For blueprint support, you will need `blueprint-compiler` but you don't need the meson submodule.

See [https://jwestman.pages.gitlab.gnome.org/blueprint-compiler/flatpak.html](this) for Flatpak otherwise you can just close the directory and specify the path to the executable.

```
git clone https://gitlab.gnome.org/jwestman/blueprint-compiler.git ~/blueprint-compiler
gjspack --blueprint-compiler=~/blueprint-compiler/blueprint-compiler.py
```

</details>

<details>
  <summary>Template</summary>

```js
import Template from "./MyWidget.ui" assert { type: "uri" };

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
import notes from "./notes.txt" assert { type: "string" };

console.log(notes);
```

</details>

<details>
  <summary>JSON</summary>

```js
import pkg from "./package.json" assert { type: "json" };

console.log(pkg.name);
```

</details>

<details>
  <summary>CSS</summary>

```js
import provider from "./styles.css" assert { type: "css" };

Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
);
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

## CLI

```sh
./bin/gjspack --help
```

## Use with meson

Add `troll` as a git submodule

In your `src/meson.build`:

```meson
gjspack = find_program('../troll/gjspack/bin/gjspack')
run_command(gjspack, '--appid=' + meson.project_name(), '--no-executable', 'src/main.js', 'src', check: true)

install_data(meson.project_name() + '.gresource',
  install_dir: pkgdatadir
)
```

Test, port your code and once it works properly , you can remove your `*.gresource.xml` file as well as the `gnome.compile_resources` meson instruction.

See [Commit](https://github.com/sonnyp/Commit/tree/main/src) and [`Junction`](https://github.com/sonnyp/Junction/tree/main/src) for examples with custom executables which don't use `imports.package.init`.

## How does it work?

Given a ES module file, gjspack use an [an ES module parser](https://github.com/guybedford/es-module-lexer/) to detect imports recursively, replace them and bundle all files appropritely in a [Gio.Resource](https://docs.gtk.org/gio/struct.Resource.html).

## Demo

This is a demonstration of a simple application using gjspack.

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

gjspack is self hosted - meaning - it bundles itself.

```sh
# make changes
# then build with
make

# pass the test
make test

# run the demo
make demo
```

## Q&A

### Why not a rollup plugin?

GJS doesn't support Source Maps ([yet?](https://gitlab.gnome.org/GNOME/gjs/-/issues/474)).
Stack traces would be unreadable.

### How to configure ESLint?

ESLint parser doesn't support the import `assert` syntax [yet](https://github.com/eslint/eslint/discussions/15305).

Use the following eslintrc options:

```json
{
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "sourceType": "module",
    "requireConfigFile": false,
    "babelOptions": {
      "plugins": ["@babel/plugin-syntax-import-assertions"]
    }
  }
}
```

Consider using [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import) as well.

## Ideas

- [x] import and bundle JavaScript imports
- [x] import and bundle any file as resource path
- [x] transform resursively
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
- [ ] watch mode / live reload
- [ ] flatpak doc
- [ ] support dynamic imports
- [ ] meson subproject
- [ ] import fonts
- [ ] support `import foo from 'http://...'` - ala deno
- [ ] bundle/import as icon-name `/com/example/icons/scalable/actions`
- [ ] Import maps https://github.com/WICG/import-maps
- [ ] gresource preprocess (`xml-stripblanks` and `json-stripblanks`)
- [ ] gresource compress ?
- [ ] cache
- [ ] Support other programming languages? Ping me if there is any interest.
- [ ] `import foo from './foo.ui#object_id' assert {type: "builder"}`
- [ ] one file mode (gresource inside .js executable)
- [ ] ~~resolve `import foo from 'bar'` from `node_modules`~~ (import maps and http instead)
