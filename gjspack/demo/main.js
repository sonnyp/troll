#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk?version=4.0";
import GLib from "gi://GLib";

import Window from "./window.ui";
import GtkLogo from "./assets/gtk-logo.webm";
import Louis from "./assets/louis.jpeg";
import manifest from "./flatpak.json" assert { type: "json" };

console.log(manifest);

Gtk.init();

const loop = new GLib.MainLoop(null, false);

const builder = Gtk.Builder.new_from_resource(Window);
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
