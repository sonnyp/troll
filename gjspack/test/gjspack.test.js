import system from "system";
import Gio from "gi://Gio";

import tst, { assert } from "../../tst/tst.js";

import {
  getPathForResource,
  isBundableImport,
  processSourceFile,
  getAssertType,
  getImportName,
} from "../src/gjspack.js";
import { appIdToPrefix } from "../src/utils.js";
import {
  readDirSync,
  readTextFileSync,
  writeTextFileSync,
  basename,
} from "../src/utils.js";

const test = tst("gjspack");

test("appIdToPrefix", () => {
  assert.is(appIdToPrefix("my.app"), "/my/app");
  assert.is(appIdToPrefix("cool"), "/cool");
});

test("basename", () => {
  assert.equal(basename(Gio.File.new_for_path("/tmp/foo.js")), [
    "foo.js",
    "foo",
    ".js",
  ]);

  assert.equal(basename(Gio.File.new_for_path("/tmp/foo")), ["foo", "foo", ""]);

  assert.equal(basename(Gio.File.new_for_path("/tmp/foo.js.bar")), [
    "foo.js.bar",
    "foo.js",
    ".bar",
  ]);

  assert.equal(basename(Gio.File.new_for_path("/tmp/.foo")), [
    ".foo",
    ".foo",
    "",
  ]);
});

test("isBundableImport", () => {
  assert.is(isBundableImport({ n: "", d: -1 }), false);
  assert.is(isBundableImport({ n: undefined, d: -1 }), false);
  assert.is(isBundableImport({ n: null, d: -1 }), false);
  assert.is(isBundableImport({ n: "resource:///foo/bar", d: -1 }), false);
  assert.is(isBundableImport({ n: "gi://Gtk", d: -1 }), false);
  assert.is(isBundableImport({ n: "hello:123", d: -1 }), false);
  assert.is(isBundableImport({ n: "hello://123", d: -1 }), false);
  assert.is(isBundableImport({ n: "system", d: -1 }), false);
  assert.is(isBundableImport({ n: "./hello", d: -1 }), true);
  assert.is(isBundableImport({ n: "./hello", d: 0 }), false);
  assert.is(isBundableImport({ n: "/hello", d: -1 }), true);
  assert.is(isBundableImport({ n: "/hello", d: 0 }), false);
});

test("getPathForResource", () => {
  const source_dir = Gio.File.new_for_path("/foo");
  const relative_to = Gio.File.new_for_path("/foo/bar/baz/main.js");

  // in-tree relative module path
  assert.is(
    getPathForResource("../wow.js", relative_to, source_dir),
    "bar/wow.js",
  );

  // in-tree absolute module path
  assert.is(
    getPathForResource("/foo/bar/wow.js", relative_to, source_dir),
    "bar/wow.js",
  );

  // out-tree relative module path
  assert.is(
    getPathForResource("../../../../wow.js", relative_to, source_dir),
    "/wow.js",
  );

  // out-tree absolute module path
  assert.is(getPathForResource("/wow.js", relative_to, source_dir), "/wow.js");
});

test("getAssertType", () => {
  assert.is(getAssertType(`{type: "json"}`), "json");
  assert.is(getAssertType(`{type: 'foo'}`), "foo");
  assert.is(getAssertType(`{ type    : 'foo' }`), "foo");
});

test("getImportName", () => {
  assert.is(getImportName(`import foo from "hello`), "foo");
});

test("processSourceFile", () => {
  const resources = [];
  const prefix = "/hello/world";

  const fixtures = Gio.File.new_for_path("test/fixtures");

  const files = [...readDirSync(fixtures)];

  const tests = files
    .filter((file) => file.get_basename().endsWith(".in.js"))
    .map((file) => file.get_basename().split(".in.js")[0]);

  for (const test of tests) {
    const input_file = fixtures.get_child(test + ".in.js");
    const output_file = fixtures.get_child(test + ".out.js");

    assert.fixture(
      processSourceFile({
        resources,
        source_file: input_file,
        prefix,
      }),
      readTextFileSync(output_file),
    );
  }
});

test("processSourceFile duplicate imports", () => {
  const resources = [];
  const prefix = "/hello/world";

  const [foo_file] = Gio.File.new_tmp("gjspack-test-foo-XXXXXX.js");
  const [bar_file] = Gio.File.new_tmp("gjspack-test-bar-XXXXXX.png");

  const input = `
import foo1 from "./${foo_file.get_basename()}";
import foo2 from "./${foo_file.get_basename()}";

import bar1 from "./${bar_file.get_basename()}";
import bar2 from "./${bar_file.get_basename()}";
`;

  const [source_file] = Gio.File.new_tmp("gjspack-test-XXXXXX.js");

  writeTextFileSync(source_file, input);

  processSourceFile({
    resources,
    source_file,
    prefix,
  });

  assert.equal(resources.length, 2);

  assert.ok(resources[0].path.startsWith("/tmp/gjspack-"));
  assert.equal(resources[0].alias, foo_file.get_path());

  assert.equal(resources[1], { path: bar_file.get_path(), alias: null });
});

// log(test.run());

system.exit((await test.run()) ? 0 : 1);
