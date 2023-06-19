#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import "lodash";
import Interface from "./window.blp" assert { type: "uri" };
// import Interface from "./window.ui" with { type: "uri" };

import GtkLogo from "./assets/gtk-logo.webm";
import Louis from "./assets/louis.jpeg";
import manifest from "./flatpak.json" assert { type: "json" };
// import provider from "./style.scss" assert { type: "css" };
import provider from "./style.css" assert { type: "css" };

import { build } from "troll";

console.log(manifest.id);

Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default(),
  provider,
  Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
);

const loop = new GLib.MainLoop(null, false);

const { window, picture, video } = build(Interface, {
  onCloseRequest() {
    log("bye");
    loop.quit();
  },
  onButtonClicked() {
    log("cool");
  },
});
picture.set_resource(Louis);
video.set_resource(GtkLogo);

window.present();
window.connect("close-request", () => {
  loop.quit();
});

loop.run();
