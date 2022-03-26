// import GObject from "gi://GObject";

const Fragment = Symbol("Fragment");

function gsx(Widget, attrs, ...children) {
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
    } else if (key === "id") {
      widget.set_name(attrs[key]);
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
  function signalHandler(self, ...args) {
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
  // widget.get_style_context().
}

const h = gsx;
export { Fragment, h };
export default gsx;
