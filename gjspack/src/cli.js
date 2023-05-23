#!/usr/bin/env -S gjs -m

import system from "system";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { build } from "./gjspack.js";
import { decode, basename } from "./utils.js";
import { setConsoleLogDomain } from "console";

GLib.set_prgname("gjspack");
GLib.set_application_name("re.sonny.gjspack");
setConsoleLogDomain("gjspack");

let status;
let appid;
let entry;
let output;
let resource_root;
let no_executable;
let potfiles;
let blueprint_compiler;
let prefix;
let project_root;
let import_map;

const app = new Gio.Application({
  application_id: GLib.get_application_name(),
  flags: Gio.ApplicationFlags.HANDLES_OPEN,
});

app.set_option_context_parameter_string("<entry file> <output dir>");

app.set_option_context_summary(
  `
Examples:
  ${GLib.get_prgname()} my-app.js build
  ${GLib.get_prgname()} --appid=my.app main.js build
`.trim(),
);

app.add_main_option(
  "version",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.NONE,
  "Print version information and exit",
  null,
);

app.add_main_option(
  "appid",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.STRING,
  // TODO: probably not a good idea to default to entry file
  // doesn't work with pkg.name
  "Identifier to use as executable name (default: name of the entry file)",
  null,
);

app.add_main_option(
  "prefix",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.STRING,
  "Path to use as resource prefix (default: guess from appid)",
  null,
);

app.add_main_option(
  "potfiles",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.FILENAME,
  "Location of the POTFILES to merge missing imports (.js, .ui, .blp)",
  "PATH",
);

app.add_main_option(
  "resource-root",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.FILENAME,
  "The directory from which gresource file paths are relative to (default: current directory)",
  "PATH",
);

app.add_main_option(
  "project-root",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.FILENAME,
  "The directory from which POTFILES entries will be relative to (default: current directory)",
  "PATH",
);

app.add_main_option(
  "import-map",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.FILENAME,
  "Path to a JSON file containing an import map (default: none)",
  "PATH",
);

app.add_main_option(
  "no-executable",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.NONE,
  "Don't emit executable, you will need to import the gresource yourself",
  null,
);

app.add_main_option(
  "blueprint-compiler",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.FILENAME,
  'Path to the blueprint-compiler executable (default: "blueprint-compiler")',
  null,
);

app.set_option_context_description(
  `
Given a JavaScript module <entry file>, ${GLib.get_prgname()} will traverse the imports
and output an executable as well as a resource bundle in <output dir>.

Compile
  ${GLib.get_prgname()} --appid=my.app main.js build

Run the program
  ./build/my.app

List bundled resources
  gresource list ./build/my.app.src.gresource
`.trim(),
);

function showHelp() {
  const [, stdout, stderr] = GLib.spawn_command_line_sync(
    `${system.programInvocationName} --help`,
  );

  if (stdout) {
    print(decode(stdout));
  } else if (stderr) {
    printerr(decode(stderr));
  }
}

// This is called when no files are passed
app.connect("activate", () => {
  showHelp();
  system.exit(0);
});

app.connect("open", (self, files) => {
  [entry, output] = files;
  if (!entry || !output) {
    showHelp();
    return system.exit(1);
  }

  appid ??= basename(entry.get_path())[1];
});

app.connect("handle-local-options", (self, options) => {
  if (options.contains("version")) {
    print("alpha");
    return 0;
  }

  no_executable = options.contains("no-executable");

  try {
    [appid] = options.lookup_value("appid", null).get_string();
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    [prefix] = options.lookup_value("prefix", null).get_string();
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    const root_path = decode(
      options.lookup_value("resource-root", null).deepUnpack(),
    )
      .trim()
      .replaceAll("\0", "");
    resource_root = Gio.File.new_for_path(root_path);
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    const project_path = decode(
      options.lookup_value("project-root", null).deepUnpack(),
    )
      .trim()
      .replaceAll("\0", "");
    project_root = Gio.File.new_for_path(project_path);
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    const import_map_path = decode(
      options.lookup_value("import-map", null).deepUnpack(),
    )
      .trim()
      .replaceAll("\0", "");

    import_map = Gio.File.new_for_path(import_map_path);
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    potfiles = decode(options.lookup_value("potfiles", null).deepUnpack())
      .trim()
      .replaceAll("\0", "");
    potfiles = Gio.File.new_for_path(potfiles);
    // eslint-disable-next-line no-empty
  } catch {}

  try {
    blueprint_compiler = decode(
      options.lookup_value("blueprint-compiler", null).deepUnpack(),
    )
      .trim()
      .replaceAll("\0", "");
    // eslint-disable-next-line no-empty
  } catch {}

  return -1;
});

status ??= app.run([system.programInvocationName].concat(ARGV));
if (status > 0) system.exit(status);

function emitExecutable({ appid, output, entry_resource_uri }) {
  const str = `
#!/usr/bin/env -S gjs -m

import Gio from "gi://Gio";

const file = Gio.File.new_for_uri(import.meta.url);
const resource = Gio.resource_load(
  file.get_parent().resolve_relative_path("${appid}.src.gresource").get_path(),
);
Gio.resources_register(resource);

import("${entry_resource_uri}").catch(logError);

`.trim();

  const executable = output.get_child(appid);
  executable.replace_contents(str, null, false, Gio.FileCreateFlags.NONE, null);
  // Make file executable
  executable.set_attribute_uint32(
    "unix::mode",
    parseInt("0755", 8),
    Gio.FileQueryInfoFlags.NONE,
    null,
  );
}

try {
  const { entry_resource_uri } = build({
    appid,
    prefix,
    entry,
    output,
    potfiles,
    resource_root,
    project_root,
    blueprint_compiler,
    import_map,
  });
  if (!no_executable) {
    emitExecutable({ appid, output, entry_resource_uri });
  }
} catch (err) {
  logError(err);
  status = 1;
}

system.exit(status);
