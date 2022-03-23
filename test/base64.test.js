import tst, { assert } from "../tst/tst.js";
import { atob, btoa } from "../src/std/base64.js";

const test = tst("base64");

test("btoa", () => {
  assert.is(btoa("foobar"), "Zm9vYmFy");
});

test("atob", () => {
  assert.is(atob("Zm9vYmFy"), "foobar");
});

// https://gitlab.gnome.org/GNOME/gjs/-/issues/285
test("NUL termination", () => {
  const encoded = btoa("hello\0world");
  const decoded = atob(encoded);

  assert.is.not(decoded, "hello");
  assert.is(decoded, "hello\0world");
});

export default test;
// test.run();
// loop.run();
