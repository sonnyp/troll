#!/usr/bin/env -S gjs -m

import system from "system";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { build, emitExecutable } from "./gjspack.js";
import { decode, basename } from "./utils.js";

GLib.set_prgname("gjspack");
GLib.set_application_name("re.sonny.gjspack");

let status;
let app_id;
let entry;
let output;
let no_executable;

const app = new Gio.Application({
  application_id: GLib.get_application_name(),
  flags: Gio.ApplicationFlags.HANDLES_OPEN,
});

app.set_option_context_parameter_string("<entry file> <output dir>");

app.set_option_context_summary(
  `
Examples:
  ${GLib.get_prgname()} my-app.js build
  ${GLib.get_prgname()} --app-id=my.app main.js build
`.trim()
);

app.add_main_option(
  "version",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.NONE,
  "Print version information and exit",
  null
);

app.add_main_option(
  "app-id",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.STRING,
  "Identifier to use as resource prefix and executable name (default: name of the entry file)",
  null
);

app.add_main_option(
  "no-executable",
  null,
  GLib.OptionFlags.NONE,
  GLib.OptionArg.NONE,
  "Don't emit executable, you will need to import the gresource yourself",
  null
);

app.set_option_context_description(
  `
Given a JavaScript module <entry file>, ${GLib.get_prgname()} will traverse the imports
and output an executable as well as a resource bundle in <output dir>.

Compile
  ${GLib.get_prgname()} --app-id=my.app main.js build

Run the program
  ./build/my.app

List bundled resources
  gresource list ./build/my.app.gresource
`.trim()
);

function showHelp() {
  const [, stdout, stderr] = GLib.spawn_command_line_sync(
    `${system.programInvocationName} --help`
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

  app_id ??= basename(entry)[1];
});

app.connect("handle-local-options", (self, options) => {
  if (options.contains("version")) {
    print("alpha");
    return 0;
  }

  no_executable = options.contains("no-executable");

  try {
    [app_id] = options.lookup_value("app-id", null).get_string();
    // eslint-disable-next-line no-empty
  } catch {}

  return -1;
});

status ??= app.run([system.programInvocationName].concat(ARGV));
if (status > 0) system.exit(status);

const { prefix } = build({ app_id, entry, output });
if (!no_executable) {
  emitExecutable({ app_id, entry, output, prefix });
}

system.exit(status);
