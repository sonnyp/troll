import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";

// https://gitlab.gnome.org/GNOME/gjs/-/blob/0c822fb4a794610da8593ecfe4807b7ae5d6e0e4/modules/core/overrides/Gtk.js

function _createClosure(builder, thisArg, handlerName, swapped, connectObject) {
  connectObject = connectObject || thisArg;

  if (swapped) {
    throw new Error('Unsupported template signal flag "swapped"');
  } else if (typeof thisArg[handlerName] === "undefined") {
    throw new Error(
      `A handler called ${handlerName} was not ` + `defined on ${thisArg}`,
    );
  }

  return thisArg[handlerName].bind(connectObject);
}

const BuilderScopeBuild = GObject.registerClass(
  {
    Implements: [Gtk.BuilderScope],
  },
  class BuilderScopeBuild extends GObject.Object {
    #signal_handlers = {};

    add_signal_handler(name, fn) {
      this.#signal_handlers[name] = fn;
    }

    vfunc_create_closure(builder, function_name, flags, object) {
      const swapped = flags & Gtk.BuilderClosureFlags.SWAPPED;
      return _createClosure(
        builder,
        this.#signal_handlers,
        function_name,
        swapped,
        object,
      );
    }

    clear() {
      this.#signal_handlers = {};
    }
  },
);

export function build(uri, params = {}) {
  const builder = new Gtk.Builder();

  const scope = new BuilderScopeBuild();
  builder.set_scope(scope);

  const handler = {
    get(target, prop) {
      return builder.get_object(prop);
    },
  };

  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "function") scope.add_signal_handler(k, v);
    else if (v instanceof GObject.Object) builder.expose_object(k, v);
    else
      throw new TypeError(
        "Only function and GObject are supported properties.",
      );
  }

  const scheme = GLib.Uri.peek_scheme(uri);
  if (!scheme) {
    builder.add_from_string(uri, -1);
  } else {
    const g_uri = GLib.Uri.parse(uri, GLib.UriFlags.NONE);
    const path = g_uri.get_path();
    if (!path) throw new Error(`Invalid URI "${uri}".`);

    if (scheme === "resource") builder.add_from_resource(path);
    else if (scheme === "file") builder.add_from_file(path);
    else throw new Error(`Unsupported scheme "${uri}".`);
  }

  scope.clear();

  return new Proxy({}, handler);
}
