(() => { imports.gi.Gtk.init(); return imports.gi.Gtk.Builder.new_from_resource("/hello/world/test/fixtures/foo.ui") })();
const bar = (() => { imports.gi.Gtk.init(); return imports.gi.Gtk.Builder.new_from_resource("/hello/world/test/fixtures/bar.js") })();
const baz = (() => { imports.gi.Gtk.init(); return imports.gi.Gtk.Builder.new_from_resource("/hello/world/test/fixtures/baz.blp.ui") })();
