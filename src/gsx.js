// import GObject from "gi://GObject";

const Fragment = Symbol("Fragment");

function h(Widget, attrs, ...children) {
  if (Widget === Fragment) {
    return children;
  }

  attrs ??= Object.create(null);

  const properties = Object.create(null);

  const widget = new Widget();

  for (const key in attrs) {
    if (key.startsWith("connect-")) {
      registerSignal(widget, key, attrs[key]);
    } else if (key === "class") {
      registerClasses(widget, attrs[key]);
    } else {
      properties[key] = attrs[key];
    }
  }

  for (const property in properties) {
    widget.set_property(property, properties[property]);
  }

  for (let i = 0; i < children.length; i++) {
    if (typeof widget.append === "function") {
      widget.append(children[i]);
    } else if (typeof widget.set_child === "function") {
      widget.set_child(children[i]);
    }
  }

  return widget;
}

function registerSignal(widget, key, handler) {
  const signal = key.split("connect-")[1];
  function signalHandler(_self, ...args) {
    handler(...args);
  }
  widget.connect(signal, signalHandler);
}

function registerClasses(widget, classnames) {
  const style_context = widget.get_style_context();

  classnames.split(" ").forEach((classname) => {
    classname = classname.trim();
    if (classname) style_context.add_class(classname);
  });
}

function gsx(...args) {
  return h(...args);
}
Object.assign(gsx, { h, Fragment });

export { gsx, Fragment, h };
export default gsx;
