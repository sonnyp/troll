import Gio from "gi://Gio";
import GLib from "gi://GLib";

import tst, { assert } from "../../tst/tst.js";

import {
  getPathForResource,
  isBundableImport,
  rewriteImports,
  processSourceFile,
  getAssertType,
  getImportName,
  updatePotfiles,
  rewriteImportWithMap,
} from "../src/gjspack.js";
import {
  appIdToPrefix,
  readDirSync,
  readTextFileSync,
  writeTextFileSync,
  basename,
} from "../src/utils.js";

const fixtures = Gio.File.new_for_path("test/fixtures");

const test = tst("gjspack");

test("appIdToPrefix", () => {
  assert.is(appIdToPrefix("my.app"), "/my/app");
  assert.is(appIdToPrefix("cool"), "/cool");
});

test("basename", () => {
  assert.equal(basename("/tmp/foo.js"), ["foo.js", "foo", ".js"]);

  assert.equal(basename("/tmp/foo"), ["foo", "foo", ""]);

  assert.equal(basename("/tmp/foo.js.bar"), ["foo.js.bar", "foo.js", ".bar"]);

  assert.equal(basename("/tmp/.foo"), [".foo", ".foo", ""]);

  assert.equal(basename("/tmp/foo-symbolic.svg"), [
    "foo-symbolic.svg",
    "foo-symbolic",
    ".svg",
  ]);

  assert.equal(basename("/tmp/foo-symbolic"), [
    "foo-symbolic",
    "foo-symbolic",
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
  assert.is(isBundableImport({ n: "./hello", d: 0 }), true);
  assert.is(isBundableImport({ n: "/hello", d: -1 }), true);
  assert.is(isBundableImport({ n: "/hello", d: 0 }), true);
});

test("rewriteImports", () => {
  const source = `import solid from "solid-js";
  import { render } from "solid-js/web";
  
  console.log("hello world");
  `;

  const res = rewriteImports(source, (_source, _imported) => {
    return `import x from "test"`;
  });

  const expected = `import x from "test";
  import x from "test";
  
  console.log("hello world");
  `;

  assert.is(res, expected);
});

test("rewriteImportWithMap", () => {
  const import_map = {
    imports: {
      "moment": "https://unpkg.com/moment@2.29.4/moment.js",
      "moment/": "https://unpkg.com/moment@2.29.4/",
      "gi://MyPackage": "gi://MyPackage?version=4.0",
    }
  };
  const source = `
  import moment from "moment";
  import localeData from "moment/locale/zh-cn.js";
  import MyPackage from "gi://MyPackage";
  `;

  const expected = `
  import moment from "https://unpkg.com/moment@2.29.4/moment.js";
  import localeData from "https://unpkg.com/moment@2.29.4/locale/zh-cn.js";
  import MyPackage from "gi://MyPackage?version=4.0";
  `;
  assert.is(rewriteImports(
    source,
    (source, imported) => rewriteImportWithMap(import_map, source, imported),
  ),
    expected
  )
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
  assert.is(
    getAssertType(
      `
    {
      type: "icon",
    }
`.trim(),
    ),
    "icon",
  );
  assert.is(getAssertType(`{type: "icon", foo: "bar"}`), "icon");
  assert.is(getAssertType(`{foo: "bar", type: "icon"}`), "icon");
  assert.is(
    getAssertType(
      `
    {
      bar: "foo"
      type: "icon",
      foo: "bar
    }
`.trim(),
    ),
    "icon",
  );
});

test("getImportName", () => {
  assert.is(getImportName(`import foo from "hello`), "foo");
});

(function testProcessSourceFiles() {
  const resources = [];
  const prefix = "/hello/world";

  const files = [...readDirSync(fixtures)];

  const tests = files
    .filter((file) => file.get_basename().endsWith(".in.js"))
    .map((file) => file.get_basename().split(".in.js")[0]);

  for (const name of tests) {
    if (name === "assert-type-builder") {
      print("skipping assert-type-builder")
      continue
    }
    test(`processSourceFile fixture ${name}`, () => {
      const input_file = fixtures.get_child(name + ".in.js");
      const output_file = fixtures.get_child(name + ".out.js");

      assert.fixture(
        processSourceFile({
          resources,
          source_file: input_file,
          resource_root: Gio.File.new_for_path(GLib.get_current_dir()),
          project_root: Gio.File.new_for_path(GLib.get_current_dir()),
          prefix,
          transforms: [
            {
              test: /\.blp$/,
              command: "blueprint-compiler compile",
              extension: ".ui",
            },
          ],
        }),
        readTextFileSync(output_file),
      );
    });
  }
})()


/*
// Broken: It expects the use of specific paths, but not all systems use those paths.
// Also, for some reason resource[0].project_path is null.

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
    resource_root: Gio.File.new_for_path(GLib.get_current_dir()),
    project_root: Gio.File.new_for_path("/tmp"),
    prefix,
  });

  assert.equal(resources.length, 2);

  // `resources[0].path` could start with `/run/user/.../`, so this will fail
  // assert.match(resources[0].path, /^\/tmp\/gjspack/);
  assert.equal(resources[0].alias, foo_file.get_path());
  assert.equal(resources[0].project_path, foo_file.get_basename());

  assert.equal(resources[1], {
    path: bar_file.get_path(),
    alias: null,
    project_path: bar_file.get_basename(),
  });
});*/

test("updatePotfiles", () => {
  const [potfiles] = Gio.File.new_tmp("gjspack-test-POTFILES-XXXXXX");

  writeTextFileSync(
    potfiles,
    `
hello
cool/bar.js
# also cool

#notme1.js
# notme2.blp
#  notme3.ui

foo/bar/already-here.ui

ok
  `.trim(),
  );

  const resources = [
    {
      alias: "wow.js",
      path: "/tmp/whatever.js",
      project_path: "whatever.js",
    },
    {
      alias: null,
      path: "cool-stuff.ui",
      project_path: "cool-stuff.ui",
    },
    {
      original: "foo/halo.blp",
      alias: "foo/halo.ui",
      path: "/tmp/wow.ui",
      project_path: "foo/halo.blp",
    },
    {
      alias: null,
      path: "nono.png",
      project_path: "nono.png",
    },
    {
      alias: null,
      path: "foo/bar/already-here.ui",
      project_path: "foo/bar/already-here.ui",
    },
    { alias: null, path: "notme1.js", project_path: "notme1.js" },
    { alias: null, path: "notme2.blp", project_path: "notme2.blp" },
    { alias: null, path: "notme3.ui", project_path: "notme3.ui" },
  ];

  updatePotfiles({ potfiles, resources });

  assert.fixture(
    readTextFileSync(potfiles),
    `
hello
cool/bar.js
# also cool

#notme1.js
# notme2.blp
#  notme3.ui

foo/bar/already-here.ui

ok
whatever.js
cool-stuff.ui
foo/halo.blp

  `.trim(),
  );
});

/*
// Broken: It expects a specific output string, but the output also contains
// `--Gjs-Message:·17:42:49.510:·JS·WARNING:·[resource:///gjspack/lib/lexer.asm.js·0]:·Successfully·compiled·asm.js·code·(total·compilation·time·2ms)`

test("transform error", () => {
  const [, stdout, stderr, status] = GLib.spawn_command_line_sync(
    [
      "./bin/gjspack",
      fixtures.get_child("invalid-blueprint.js").get_path(),
      "/tmp",
    ].join(" "),
  );

  assert.not.equal(status, 0);
  assert.equal(decode(stdout), "");
  assert.match(
    decode(stderr),
    "Namespace Gtk does not contain a type called FooApplicationWindow",
  );
});
*/

export default test;
