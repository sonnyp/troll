#!/usr/bin/env -S gjs -m

import GLib from "gi://GLib";
import system from "system";

const files = ARGV;

if (!files.length) system.exit(0);

// const loop = GLib.MainLoop.new(null, false);
let exit_code;

const paths = files.map((file) => {
  return GLib.path_is_absolute(file)
    ? file
    : GLib.build_filenamev([GLib.get_current_dir(), file]);
});

for await (const path of paths) {
  const module = await import(`file://${path}`);
  const success = await module.default.run();
  exit_code = success ? 0 : 1;

  if (!success) break;
}

// loop.run();
system.exit(exit_code);
