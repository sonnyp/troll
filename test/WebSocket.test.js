import "./setup.js";

import WebSocket from "../src/std/WebSocket.js";
import { once } from "../src/util.js";

import { test } from "./uvu.js";
import * as assert from "./assert.js";
import GLib from "gi://GLib";
import Soup from "gi://Soup";
import Gio from "gi://Gio";

const loop = GLib.MainLoop.new(null, false);
test.after(() => {
  loop.quit();
});

test("open and close", async () => {
  const server = createEchoServer();

  const ws = new WebSocket("ws://127.0.0.1:1234/echo");
  assert.is(ws.readyState, 0);
  assert.is(ws.url, "ws://127.0.0.1:1234/echo");

  await once(ws, "open", { timeout: 1000, error: "error" });

  assert.is(ws.readyState, 1);

  ws.close();

  assert.is(ws.readyState, 2);

  await once(ws, "close", { timeout: 1000, error: "error" });

  assert.is(ws.readyState, 3);

  server.disconnect();
});

test("send and receive", async () => {
  const server = createEchoServer();

  const ws = new WebSocket("ws://127.0.0.1:1234/echo");
  assert.is(ws.readyState, 0);

  await once(ws, "open", { timeout: 1000, error: "error" });

  let message;

  ws.send("hello");
  [message] = await once(ws, "message", {
    timeout: 1000,
    error: "error",
  });
  assert.is(message.data, "hello");

  server.disconnect();
});

test("protocol", async () => {
  const server = createEchoServer();

  const ws = new WebSocket("ws://127.0.0.1:1234/echo", ["xmpp"]);
  assert.is(ws.protocol, "");

  log("foo");

  await once(ws, "open", { timeout: 1000, error: "error" });

  assert.is(ws.protocol, "xmpp");

  ws.close();

  assert.is(ws.protocol, "xmpp");

  server.disconnect();
});

function createEchoServer() {
  const server = new Soup.Server();

  function onConnection(self, message, path, connection) {
    connection.connect("message", (self, type, message) => {
      connection.send_message(type, message);
    });
  }

  server.add_websocket_handler(
    "/echo", // path
    null, // origin
    [], // protocols
    onConnection
  );

  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);
  return server;
}

test.run();
loop.run();
