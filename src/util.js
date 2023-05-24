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
