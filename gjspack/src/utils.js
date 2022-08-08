import Gio from "gi://Gio";

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

export function appIdToPrefix(app_id) {
  return `/${app_id.replaceAll(".", "/")}`;
}

export function basename(file) {
  const [filename, basename, extension] = file
    .get_basename()
    .match(/(.+?)(\.[^.]*$|$)/);
  return [filename, basename, extension];
}
