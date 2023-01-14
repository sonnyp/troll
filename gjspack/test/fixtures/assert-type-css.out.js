(() => { imports.gi.Gtk.init(); const provider = new imports.gi.Gtk.CssProvider(); provider.load_from_resource("/hello/world/test/fixtures/foo.css"); return provider; })();
const bar = (() => { imports.gi.Gtk.init(); const provider = new imports.gi.Gtk.CssProvider(); provider.load_from_resource("/hello/world/test/fixtures/bar.js"); return provider; })();
