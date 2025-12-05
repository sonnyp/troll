import Gtk from "gi://Gtk?version=4.0";
import tst, { assert } from "../tst/tst.js";

import { gsx } from "../src/gsx.js";

// eslint-disable-next-line no-restricted-globals
const signals = imports.signals;

Gtk.init();

const test = tst("gsx");

test("widget", () => {
  const box = gsx.h(Gtk.Box);
  assert.ok(box instanceof Gtk.Box);
});

test("attribute", () => {
  const box = gsx.h(Gtk.Box, { orientation: Gtk.Orientation.VERTICAL });
  assert.is(box.orientation, Gtk.Orientation.VERTICAL);
});

test("attribute enum text", () => {
  const box = gsx.h(Gtk.Box, { orientation: Gtk.Orientation.VERTICAL });
  assert.is(box.orientation, Gtk.Orientation.VERTICAL);
});

test("parent with append method", () => {
  gsx.h(Gtk.Box, undefined, gsx.h(Gtk.Image));
});

test("parent with set_child method", () => {
  gsx.h(Gtk.Button, undefined, gsx.h(Gtk.Image));
});

test("multiple children", () => {
  const single_child = gsx.h(Gtk.Box, undefined, gsx.h(Gtk.Image));
  assert.is([...single_child].length, 1);

  const multiple_children = gsx.h(
    Gtk.Box,
    undefined,
    gsx.h(Gtk.Image),
    gsx.h(Gtk.Image),
  );
  assert.is([...multiple_children].length, 2);
});

test("fragment", () => {
  const fragment = gsx.h(
    gsx.Fragment,
    undefined,
    gsx.h(Gtk.Image),
    gsx.h(Gtk.Image),
  );
  assert.is([...fragment].length, 2);
});

test("class names", () => {
  const button = gsx.h(Gtk.Button, { ["class"]: " abc  123 3j" });
  assert.is(button.get_style_context().has_class("abc"), true);
  assert.is(button.get_style_context().has_class("123"), true);
  assert.is(button.get_style_context().has_class("3j"), true);
});

test("signal", async () => {
  const deferred = Promise.withResolvers();

  function onClicked(self) {
    assert.is.not(self, button);
    deferred.resolve();
  }

  const button = gsx.h(Gtk.Button, { "connect-clicked": onClicked });

  button.emit("clicked");

  await deferred.promise;
});

test("signal arguments", async () => {
  class MyWidget {}
  signals.addSignalMethods(MyWidget.prototype);

  const deferred = Promise.withResolvers();

  const values = [1, 2, 3];
  function onSignal(...args) {
    assert.equal(args, values);
    deferred.resolve();
  }

  const button = gsx.h(MyWidget, { "connect-signal": onSignal });

  button.emit("signal", ...values);

  await deferred.promise;
});

export default test;
