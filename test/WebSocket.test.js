import tst, { assert } from "../tst/tst.js";

import WebSocket from "../src/std/WebSocket.js";
import { once } from "../src/async.js";

import Soup from "gi://Soup";
import Gio from "gi://Gio";

const test = tst("WebSocket");

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

  ws.send("hello");
  const [event] = await once(ws, "message", {
    timeout: 1000,
    error: "error",
  });
  assert.is(event.data, "hello");

  server.disconnect();
});

test("protocol", async () => {
  const server = createEchoServer(["xmpp"]);

  const ws = new WebSocket("ws://127.0.0.1:1234/echo", ["xmpp"]);
  assert.is(ws.protocol, "");

  await once(ws, "open", { timeout: 1000, error: "error" });

  assert.is(ws.protocol, "xmpp");

  ws.close();

  assert.is(ws.protocol, "xmpp");

  server.disconnect();
});

function createEchoServer(protocols = []) {
  const server = new Soup.Server();

  function onConnection(_self, _message, _path, connection) {
    connection.connect("message", (_self, type, message) => {
      connection.send_message(type, message);
    });
  }

  server.add_websocket_handler(
    "/echo", // path
    null, // origin
    protocols, // protocols
    onConnection,
  );

  server.listen(Gio.InetSocketAddress.new_from_string("127.0.0.1", 1234), null);
  return server;
}

export default test;
