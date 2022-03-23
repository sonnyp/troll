import GLib from "gi://GLib";

// https://gitlab.gnome.org/GNOME/gjs/-/merge_requests/696
const stdout = (() => {
  const { DataOutputStream, UnixOutputStream } = imports.gi.Gio;
  return new DataOutputStream({
    base_stream: new UnixOutputStream({ fd: 1 }),
  });
})();
const stderr = (() => {
  const { DataOutputStream, UnixOutputStream } = imports.gi.Gio;
  return new DataOutputStream({
    base_stream: new UnixOutputStream({ fd: 2 }),
  });
})();
// export const stdin = (() => {
//   const { DataInputStream, UnixInputStream } = imports.gi.Gio;
//   return new DataInputStream({
//     base_stream: new UnixInputStream({ fd: 0 }),
//   });
// })();

// const source = stdin.base_stream.create_source(null);
// source.set_callback(() => {
//   log("foo");
// });
// source.attach(null);

// https://gitlab.gnome.org/GNOME/gjs/-/issues/426
const decoder = new TextDecoder();
GLib.log_set_writer_func((log_level, fields) => {
  const domain = decoder.decode(fields.GLIB_DOMAIN);

  if (domain !== "Gjs-Console") {
    return GLib.LogWriterOutput.UNHANDLED;
    // Need to rebuild fields as LogField
    // return GLib.log_writer_default(
    //   log_level,
    //   Object.entries(fields),
    //   null,
    //   ...args
    // );
  }

  // https://docs.gtk.org/glib/flags.LogLevelFlags.html#level_warning
  const output = log_level < GLib.LogLevelFlags.LEVEL_WARNING ? stderr : stdout;
  output.put_string(decoder.decode(fields.MESSAGE), null);
  return GLib.LogWriterOutput.HANDLED;
});
