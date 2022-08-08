# nome

A bundler for GNOME JavaScript.

nome lets your import anything and will bundle everything for you, think [webpack](https://webpack.js.org/) for GJS.

With nome, you can do the following without worrying about packaging or maintaining `*.gresource.xml` files.

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

### CSS

```js
import Styles from "./styles.css";

const css_provider = new Gtk.CssProvider();
css_provider.load_from_resource(Styles);
Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
);
```

## How to install

```sh
cd nome
flatpak-builder --user --install-deps-from=flathub --force-clean --install flatpak re.sonny.Nome.json
```

## How to use

```sh
# build
flatpak run re.sonny.Nome --app-id=my_app main.js build/
# run
./build/my_app
```

You can also alias `nome="flatpak run re.sonny.Nome"`.

## How does it work

Given a ES module file, nome use an [an ES module parser](https://github.com/guybedford/es-module-lexer/) to detect imports recursively, transform your sources and bundle all files appropritely in a [Gio.Resource](https://docs.gtk.org/gio/struct.Resource.html).

## Examples

Enable debug logs with `G_MESSAGES_DEBUG=Gjs-Console`.

```
gjs -m example.js
```

```
G_MESSAGES_DEBUG=Gjs-Console ./src/cli.js --app-id=my.app test/compile/src/main.js test/compile/dist/ && ./test/compile/dist/my.app
```

## Development

Nome is self hosted meaning - that it bundles itself.

```sh
# make changes
make
# test with
./bin/nome --app-id=nome-demo demo/main.js demo/build
# or
make test
```

## Notes

```sh
# watchman logs
tail -f /var/run/watchman/sonny-state/log

# works but require closing app
watchman-make -p 'test/compile/src/**' --run ./watch.sh

watchman watch-project test/compile/src/

watchman -- trigger test/compile/src/ nome -- ./cli.js my.app ./test/compile/src/main.js ./test/compile/dist/
```

https://gitlab.gnome.org/GNOME/gnome-builder/-/blob/main/src/plugins/meson-templates/resources/src/hello.js.in

## Roadmap

- [x] bundle JavaScript imports
- [x] import/bundle any file as resource path
- [x] transform resursively
- [x] bundle sources files outside of `$PWD`
- [x] bundle data files outside of `$PWD`
- [x] deduplicate files imported multiple times
- [x] unnamed imports
- [ ] meson subproject
- [ ] live reload - automatically reload on change
- [ ] dynamic imports
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
