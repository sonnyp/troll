#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import builder from "./window.blp" assert { type: "builder" };
// import builder from "./window.ui" assert { type: "builder" };

import GtkLogo from "./assets/gtk-logo.webm";
import Louis from "./assets/louis.jpeg";
import manifest from "./flatpak.json" assert { type: "json" };
import provider from "./style.scss" assert { type: "css" };

console.log(manifest.id);

Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
);

const loop = new GLib.MainLoop(null, false);

const window = builder.get_object("window");

const picture = builder.get_object("picture");
picture.set_resource(Louis);

const video = builder.get_object("video");
video.set_resource(GtkLogo);

window.present();
window.connect("close-request", () => {
  loop.quit();
});

loop.run();
