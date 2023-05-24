import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";

function noop() {}

const BuilderScope = GObject.registerClass(
  {
    Implements: [Gtk.BuilderScope],
  },
  class BuilderScope extends GObject.Object {
    constructor() {
      super();
      this.signal_handlers = Object.create(null);
    }

    add_signal_handler(name, fn) {
      this.signal_handlers[name] = fn;
    }

    // https://docs.gtk.org/gtk4/vfunc.BuilderScope.create_closure.html
    vfunc_create_closure(_builder, function_name, flags, _object) {
      if (flags & Gtk.BuilderClosureFlags.SWAPPED) {
        throw new Error('Signal flag "swapped" is unsupported in JavaScript.');
      }

      const fn = this.signal_handlers[function_name];
      // if (!fn) {
      //   throw new Error(`No function named \`${function_name}\`.`);
      // }
      return fn || noop;
    }
  },
);

export function build(uri, params = {}) {
  const builder = new Gtk.Builder();

  const scope = new BuilderScope();
  builder.set_scope(scope);

  for (const [k, v] of Object.entries(params)) {
    // signals
    if (typeof v === "function") {
      scope.add_signal_handler(k, v);
      // objects
    } else if (v instanceof GObject.Object) {
      builder.expose_object(k, v);
    } else {
      throw new Error("Only function and GObject properties are supported.");
    }
  }

  const handler = {
    get(target, prop, receiver) {
      return builder.get_object(prop);
    },
  };

  const proxy = new Proxy({}, handler);

  const g_uri = GLib.Uri.parse(uri, GLib.UriFlags.NONE);
  const scheme = g_uri.get_scheme();
  const path = g_uri.get_path();
  if (!scheme || !path) {
    throw new Error(`Invalud uri \`${uri}\`.`);
  }

  if (scheme === "resource") {
    builder.add_from_resource(path);
  } else if (scheme === "file") {
    builder.add_from_file(path);
  } else {
    throw new Error(`Unsuported scheme \`${uri}\`.`);
  }

  return proxy;
}
