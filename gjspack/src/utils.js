import Gio from "gi://Gio";
import GLib from "gi://GLib";

// https://gitlab.gnome.org/GNOME/gjs/-/merge_requests/784
export function* readDirSync(file) {
  const enumerator = file.enumerate_children(
    "standard::name",
    Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
    null,
  );

  while (true) {
    try {
      const info = enumerator.next_file(null);
      if (info === null) break;
      yield enumerator.get_child(info);
    } catch (err) {
      enumerator.close(null);
      throw err;
    }
  }
  enumerator.close(null);
}

export function readTextFileSync(file) {
  const [, contents] = file.load_contents(null);
  return decode(contents);
}

export function writeTextFileSync(file, contents) {
  file.replace_contents(
    contents, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null, // cancellable
  );
}

export function decode(data) {
  return new TextDecoder().decode(data);
}

export function appIdToPrefix(appid) {
  return `/${appid.replaceAll(".", "/")}`;
}

export function basename(filename) {
  const [name, basename, extension] =
    GLib.path_get_basename(filename).match(/(.+?)(\.[^.]*$|$)/);
  return [name, basename, extension];
}
