import GLib from "gi://GLib";

export function atob(data) {
  return GLib.base64_decode(data);
}

export function btoa(data) {
  return GLib.base64_encode(data);
}
