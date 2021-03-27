const Gtk = imports.gi.Gtk;
const { Align, Orientation } = Gtk;
const { EllipsizeMode } = imports.gi.Pango;

const Fragment = Symbol("Fragment");

function h(name, attrs, ...children) {
  if (name === Fragment) {
    return children;
  }

  let Widget;
  if (typeof name === "string") {
    Widget = Gtk[name.charAt(0).toUpperCase() + name.slice(1)];
  } else {
    Widget = name;
  }

  const signals = Object.create(null);
  let bindings = Object.create(null);
  if (!attrs) {
    attrs = Object.create(null);
  } else {
    for (const key in attrs) {
      if (key.startsWith("connect-")) {
        const signal = key.split("connect-")[1];
        signals[signal] = attrs[key];
        delete attrs[key];
      } else if (key.startsWith("bind-")) {
        const prop = key.split("bind-")[1];
        const params = attrs[key];
        // target property
        params[1] = params[1] || prop;
        bindings[prop] = params;
        delete attrs[key];
      }
    }
  }

  const widget = new Widget(attrs);

  for (const signal in signals) {
    const handler = (self, ...args) => {
      signals[signal](...args);
    };
    widget.connect(signal, handler);
  }
  // signals = null;

  for (const prop in bindings) {
    const [target, targetProp, map] = bindings[prop];
    target.bind(targetProp, widget, prop, map);
  }
  bindings = null;

  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      children[i].forEach((child) => widget.add(child));
    } else {
      widget.add(children[i]);
    }
  }

  if (widget.show_all) {
    widget.show_all();
  }

  return widget;
}

export { Align, Orientation, EllipsizeMode, Fragment, h };
export default {
  h,
  Fragment,
};
