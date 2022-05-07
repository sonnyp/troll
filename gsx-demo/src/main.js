import GLib from "gi://GLib";
import Gtk from "gi://Gtk?version=4.0";
import gsx from "../../src/gsx.js";

const {
  Box,
  ShortcutsShortcut,
  Orientation,
  Align,
  Image,
  Label,
  IconSize,
  Justification,
  Window,
} = Gtk;

Gtk.init();

const mainloop = GLib.MainLoop.new(null, false);

const window = (
  <Window>
    <Box
      name="welcome"
      orientation={Orientation.VERTICAL}
      valign={Align.CENTER}
      halign={Align.CENTER}
    >
      <Image
        name="logo"
        icon-name="re.sonny.Workbench"
        pixel-size={196}
        margin-bottom={24}
        class="icon-dropshadow"
      />
      <Label label="Welcome to Workbench" margin-bottom={24} class="title-1" />
      <Label
        label={`Learn and prototype with\nGNOME technologies`}
        margin-bottom={24}
        justify={Justification.CENTER}
        class="title-1"
      ></Label>

      <Box margin-bottom={12}>
        <Image
          icon-name="update-symbolic"
          margin-end={12}
          icon-size={IconSize.NORMAL}
        />
        <Label label="Edit Style and UI to reload the Preview" />
      </Box>

      <Box margin-bottom={12}>
        <Image
          icon-name="media-playback-start-symbolic"
          margin-end={12}
          icon-size={IconSize.NORMAL}
        />
        <Label label="Hit" />
        <ShortcutsShortcut
          accelerator="<Primary>Return"
          margin-start={12}
        ></ShortcutsShortcut>
        <Label label="to format and run Code" />
      </Box>

      <Box margin-bottom={12}>
        <Image
          icon-name="user-bookmarks-symbolic"
          margin-end={12}
          icon-size={IconSize.NORMAL}
        />
        <Label label="Checkout the bookmarks to learn" />
      </Box>

      <Box margin-bottom={12}>
        <Image
          icon-name="media-floppy-symbolic"
          margin-end={12}
          icon-size={IconSize.NORMAL}
        />
        <Label label="Changes are automatically saved and restored" />
      </Box>
    </Box>
  </Window>
);

window.connect("close-request", () => {
  mainloop.quit();
});

window.present();

mainloop.run();
