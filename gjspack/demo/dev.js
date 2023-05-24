#!/usr/bin/env -S gjs -m

import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { build as gjspack } from "../src/gjspack.js";

const { gresource_path, prefix } = gjspack({
  appid: "re.sonny.gjspack.Demo",
  entry: Gio.File.new_for_path("./main.js"),
  output: Gio.File.new_for_path("./build"),
  transforms: [
    // Blueprint transform is enabled by default
    {
      // Regular expression tested against the filename
      test: /\.blp$/,
      // Expect result on stdout
      command: "blueprint-compiler compile",
      // window.blp -> window.blp.ui
      extension: ".ui",
    },
    // Let's add a Sass transformer
    // {
    //   test: /\.scss$/,
    //   command: "sassc",
    //   extension: ".css",
    // },
  ],
  import_map: Gio.File.new_for_path("./import_map.json"),
});

const resource = Gio.resource_load(gresource_path);
Gio.resources_register(resource);

const loop = GLib.MainLoop.new(null, false);
import(`resource://${prefix}/main.js`)
  .then(() => {
    loop.quit();
  })
  .catch(logError);
loop.run();
