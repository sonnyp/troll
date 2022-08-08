# gjspack

A bundler for GNOME JavaScript.

gjspack lets your import anything and will bundle everything for you, think [webpack](https://webpack.js.org/) for GJS.

With gjspack, you can do the following without worrying about packaging or maintaining `*.gresource.xml` files.

## Examples

### Image

```js
import Porygon from "./Porygon.png";

// GtkPicture displays an image at its natural size
const picture = Gtk.Picture.new_from_picture(Porygon);

// GtkImage if you want to display a fixed-size image, such as an icon.
const image = Gtk.Image.new_from_resource(Porygon);
```

### UI

```js
import Window from "./Window.ui";

const builder = Gtk.Builder.new_from_resource(Window);
```

### Video

```js
import AnimatedLogo from "./AnimatedLog.webm";

const video = Gtk.Video.new_from_resource(AnimatedLogo);
```

### Text

```js
import Notes from "./notes.txt";

const contents = Gio.resources_lookup_data(Notes, null);
log(new TextDecoder().decode(contents.toArray()));
```

### JSON

```js
import pkg from "./package.json" assert { type: "json" };

console.log(pkg.name);
```

### CSS

```js
import Styles from "./styles.css";

const css_provider = new Gtk.CssProvider();
css_provider.load_from_resource(Styles);
Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
);
```

### Bundling arbitrary files

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

## How to use

```sh
./bin/gjspack --help
```

## How does it work

Given a ES module file, gjspack use an [an ES module parser](https://github.com/guybedford/es-module-lexer/) to detect imports recursively, transform your sources and bundle all files appropritely in a [Gio.Resource](https://docs.gtk.org/gio/struct.Resource.html).

## Demo

This is a demonstration of a simple application using gjspack.

### Host

```sh
cd demo
# bundle
../bin/gjspack --app-id=gjspack-demo ./main.js ./build
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

## Roadmap and ideas

- [x] import and bundle JavaScript imports
- [x] import and bundle any file as resource path
- [x] transform resursively
- [x] bundle sources files outside of `$PWD`
- [x] bundle data files outside of `$PWD`
- [x] deduplicate files imported multiple times
- [x] support unnamed imports
- [ ] support dynamic imports
- [ ] meson subproject
- [ ] live reload - automatically reload on change
- [ ] import from UI and blp files
- [ ] ~~import any file as gbytes~~
- [ ] import css, fonts, ...
- [ ] support `import foo from 'http://...'` - ala deno
- [ ] bundle/import as icon-name `/com/example/icons/scalable/actions`
- [ ] resolve `import foo from 'bar'` from `node_modules`
- [ ] Import maps https://github.com/WICG/import-maps
- [ ] JSON modules https://github.com/tc39/proposal-json-modules
- [ ] gresource preprocess (`xml-stripblanks` and `json-stripblanks`)
- [ ] gresource compress ?
- [ ] cache
- [ ] import blueprint files
- [ ] json
- [ ] Support other programming languages? Ping me if there is any interest.

## Q&A

### Why not a rollup plugin?

GJS doesn't support Source Maps ([yet?](https://gitlab.gnome.org/GNOME/gjs/-/issues/474)).
Stack traces would be unreadable.
