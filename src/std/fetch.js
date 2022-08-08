import { promiseTask } from "../util.js";
import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib";

export default async function fetch(url, options = {}) {
  if (typeof url === "object") {
    options = url;
    url = options.url;
  }

  const session = new Soup.Session();
  const method = options.method || "GET";

  const uri = GLib.Uri.parse(url, GLib.UriFlags.NONE);

  const message = new Soup.Message({
    method,
    uri,
  });
  const headers = options.headers || {};

  const request_headers = message.get_request_headers();
  for (const header in headers) {
    request_headers.append(header, headers[header]);
  }

  if (typeof options.body === "string") {
    message.set_request_body_from_bytes(null, new GLib.Bytes(options.body));
  }

  const inputStream = await promiseTask(
    session,
    "send_async",
    "send_finish",
    message,
    null,
    null,
  );

  const { status_code, response_headers, reason_phrase } = message;
  const ok = status_code >= 200 && status_code < 300;

  return {
    status: status_code,
    statusText: reason_phrase,
    ok,
    type: "basic",
    async json() {
      const text = await this.text();
      return JSON.parse(text);
    },
    async text() {
      const contentLength = response_headers.get_one("content-length");
      const bytes = await promiseTask(
        inputStream,
        "read_bytes_async",
        "read_bytes_finish",
        contentLength,
        null,
        null,
      );

      return new TextDecoder().decode(bytes.toArray());
    },
  };
}
