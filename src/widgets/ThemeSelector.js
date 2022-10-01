import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import Gdk from "gi://Gdk";

import Template from "./ThemeSelector.blp" assert { type: "uri" };
import Style from "./ThemeSelector.css";

const style_manager = Adw.StyleManager.get_default();
let provider;

class ThemeSelector extends Gtk.Widget {
  constructor(params = {}) {
    ThemeSelector.set_layout_manager_type(Gtk.BinLayout);
    super(params);

    style_manager.connect(
      "notify::system-supports-color-schemes",
      this._on_notify_system_supports_color_schemes.bind(this),
    );
    this._on_notify_system_supports_color_schemes();

    const dark = style_manager.get_dark();
    this.theme = dark ? "dark" : "light";

    style_manager.connect("notify::dark", this._on_notify_dark.bind(this));
    this._on_notify_dark();

    if (!provider) {
      provider = new Gtk.CssProvider();
      provider.load_from_resource(Style);
      Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        provider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
      );
    }
  }

  _on_notify_system_supports_color_schemes() {
    this._follow.set_visible(style_manager.get_system_supports_color_schemes());
  }

  _on_notify_dark() {
    if (style_manager.get_dark()) this.add_css_class("dark");
    else this.remove_css_class("dark");
  }
}

export default GObject.registerClass(
  {
    GTypeName: "ThemeSelector",
    Template,
    CssName: "themeselector",
    InternalChildren: ["follow"],
    Properties: {
      theme: GObject.ParamSpec.string(
        "theme", // Name
        "Theme", // Nick
        "Theme", // Blurb
        GObject.ParamFlags.READWRITE,
        null, // Default value
      ),
    },
  },
  ThemeSelector,
);
