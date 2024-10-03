import tst, { assert } from "../tst/tst.js";

import fetch from "../src/std/fetch.js";

import Soup from "gi://Soup";
import Gio from "gi://Gio";
import { Deferred } from "../src/async.js";

const test = tst("fetch");

test("simple get", async () => {
  const content_type = "text/plain";
  const status_code = 231;
  const status_text = "It is my birthday";
  const body = "Hello world!";

  const server = new Soup.Server();
  server.add_handler("/hello-world", (_self, message) => {
    message.get_response_headers().set_content_type(content_type, null);
    message.get_response_body().append(body);

    message.set_status(status_code, status_text);
  });
  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);

  const res = await fetch("http://127.0.0.1:1234/hello-world");
  assert.is(res.status, status_code);
  assert.is(res.statusText, status_text);
  assert.is(res.ok, true);

  assert.is(await res.text(), body);

  server.disconnect();
});

test("get json", async () => {
  const value = { hello: "world" };

  const server = new Soup.Server();
  server.add_handler("/json", (_self, message) => {
    message.get_response_headers().set_content_type("application/json", null);
    message.get_response_body().append(JSON.stringify(value));
    message.set_status(200, null);
  });
  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);

  const res = await fetch("http://127.0.0.1:1234/json");
  assert.equal(await res.json(), value);

  server.disconnect();
});

test("get arrayBuffer", async () => {
  const value = JSON.stringify({ hello: "world" });
  const uintValue = new Uint8Array(new TextEncoder().encode(value));

  const server = new Soup.Server();
  server.add_handler("/bin", (_self, message) => {
    message.get_response_body().append(value);
    message.set_status(200, null);
  });
  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);

  const res = await fetch("http://127.0.0.1:1234/bin");
  assert.equal(new Uint8Array(await res.arrayBuffer()), uintValue);

  server.disconnect();
});

test("get gBytes", async () => {
  const value = JSON.stringify({ hello: "world" });
  const uintValue = new Uint8Array(new TextEncoder().encode(value));

  const server = new Soup.Server();
  server.add_handler("/bin", (_self, message) => {
    message.get_response_body().append(value);
    message.set_status(200, null);
  });
  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);

  const res = await fetch("http://127.0.0.1:1234/bin");
  assert.equal((await res.gBytes()).toArray(), uintValue);

  server.disconnect();
});

test("POST", async () => {
  const server = new Soup.Server();
  const request_body = JSON.stringify({ hello: "world" });
  const deferred = new Deferred();

  server.add_handler("/json", (_self, message) => {
    assert.is(message.get_method(), "POST");

    const request_headers = message.get_request_headers();
    assert.is(request_headers.get_content_type()[0], "application/json");

    const body = message.get_request_body();
    assert.equal(new TextDecoder().decode(body.data), request_body);

    message.set_status(200, null);
    deferred.resolve();
  });

  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);

  const res = await fetch({
    url: "http://127.0.0.1:1234/json",
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: request_body,
  });

  await deferred;

  assert.is(res.status, 200);

  server.disconnect();
});

export default test;
