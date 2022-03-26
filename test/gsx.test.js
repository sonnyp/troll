import Gtk from "gi://Gtk?version=4.0";
import tst, { assert } from "../tst/tst.js";

import gsx from "../src/gsx.js";
import { Deferred } from "../src/util.js";

const signals = imports.signals;

Gtk.init();

const test = tst("gsx");

test("widget", () => {
  const box = gsx(Gtk.Box);
  assert.ok(box instanceof Gtk.Box);
});

test("attribute", () => {
  const box = gsx(Gtk.Box, { orientation: Gtk.Orientation.VERTICAL });
  assert.is(box.orientation, Gtk.Orientation.VERTICAL);
});

test("attribute enum text", () => {
  const box = gsx(Gtk.Box, { orientation: Gtk.Orientation.VERTICAL });
  assert.is(box.orientation, Gtk.Orientation.VERTICAL);
});

test("parent with append method", () => {
  gsx(Gtk.Box, undefined, gsx(Gtk.Image));
});

test("parent with set_child method", () => {
  gsx(Gtk.Button, undefined, gsx(Gtk.Image));
});

test("multiple children", () => {
  const single_child = gsx(Gtk.Box, undefined, gsx(Gtk.Image));
  assert.is([...single_child].length, 1);

  const multiple_children = gsx(
    Gtk.Box,
    undefined,
    gsx(Gtk.Image),
    gsx(Gtk.Image)
  );
  assert.is([...multiple_children].length, 2);
});

test("class names", () => {
  const button = gsx(Gtk.Button, { ["class"]: " abc  123 3j" });
  assert.is(button.get_style_context().has_class("abc"), true);
  assert.is(button.get_style_context().has_class("123"), true);
  assert.is(button.get_style_context().has_class("3j"), true);
});

test("id", () => {
  const button = gsx(Gtk.Button, { id: "cool" });
  assert.is(button.get_name(), "cool");
});

test("signal", async () => {
  const deferred = new Deferred();

  function onClicked(self) {
    assert.is.not(self, button);
    deferred.resolve();
  }

  const button = gsx(Gtk.Button, { "connect-clicked": onClicked });

  button.emit("clicked");

  await deferred;
});

test("signal arguments", async () => {
  class MyWidget {}
  signals.addSignalMethods(MyWidget.prototype);

  const deferred = new Deferred();

  const values = [1, 2, 3];
  function onSignal(...args) {
    assert.equal(args, values);
    deferred.resolve();
  }

  const button = gsx(MyWidget, { "connect-signal": onSignal });

  button.emit("signal", ...values);

  await deferred;
});

export default test;
