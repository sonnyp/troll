#!/usr/bin/env -S gjs -m

import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import Interface from "./window.blp" with { type: "uri" };
// import Interface from "./window.ui" with { type: "uri" };

import GtkLogo from "./assets/gtk-logo.webm";
import Louis from "./assets/louis.jpeg";
import manifest from "./flatpak.json" with { type: "json" };
// import provider from "./style.scss" with { type: "css" };
import provider from "./style.css" with { type: "css" };

// eslint-disable-next-line import/no-unresolved
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
    console.log("bye");
    loop.quit();
  },
  onButtonClicked() {
    console.log("cool");
  },
});
picture.set_resource(Louis);
video.set_resource(GtkLogo);

window.present();
window.connect("close-request", () => {
  loop.quit();
});

loop.run();
