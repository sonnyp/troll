import GLib from "gi://GLib";
import Gio from "gi://Gio";
import system from "system";

export function getGIRepositoryVersion(repo) {
  const {
    get_major_version = () => "?",
    get_minor_version = () => "?",
    get_micro_version = () => "?",
  } = repo;
  return `${get_major_version()}.${get_minor_version()}.${get_micro_version()}`;
}

export function getGLibVersion() {
  return `${GLib.MAJOR_VERSION}.${GLib.MINOR_VERSION}.${GLib.MICRO_VERSION}`;
}

export function getGjsVersion() {
  const v = system.version.toString();
  return `${v[0]}.${+(v[1] + v[2])}.${+(v[3] + v[4])}`;
}

export function getPid() {
  const credentials = new Gio.Credentials();
  return credentials.get_unix_pid();
}

export function parseResolve(base, uri_ref) {
  const flags = GLib.UriFlags.NONE;
  return GLib.Uri.parse(base, flags).parse_relative(uri_ref, flags);
}

export function resolve(base, uri_ref) {
  return parseResolve(base, uri_ref).to_string();
}

export function debounce(func, timeout) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

/*
Requires a gsettings schema with
<key name="width" type="i">
  <default>0</default>
</key>
<key name="height" type="i">
  <default>0</default>
</key>
<key name="maximized" type="b">
  <default>false</default>
</key>
<key name="fullscreened" type="b">
  <default>false</default>
</key>
*/
export function persistWindowState({ settings, window }) {
  settings.bind(
    "maximized",
    window,
    "maximized",
    Gio.SettingsBindFlags.DEFAULT,
  );
  settings.bind(
    "fullscreened",
    window,
    "fullscreened",
    Gio.SettingsBindFlags.DEFAULT,
  );

  // Resizing the window triggers a lot of notify signals
  // so we use a debounced function instead of settings.bind
  const onSizeChanged = debounce(() => {
    settings.set_int("width", window.default_width);
    settings.set_int("height", window.default_height);
  }, 300);
  window.connect("notify::default-width", onSizeChanged);
  window.connect("notify::default-height", onSizeChanged);
  window.default_width = settings.get_int("width");
  window.default_height = settings.get_int("height");
}
