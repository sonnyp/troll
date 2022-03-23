import WebSocket from "./src/std/WebSocket.js";
import GLib from "gi://GLib";

const loop = GLib.MainLoop.new(null, false);
const ws = new WebSocket("wss://ws.postman-echo.com/raw");

ws.addEventListener("open", () => {
  console.log("open");
  ws.send("hello");
  ws.send("foo");
});

ws.addEventListener("error", (err) => {
  console.error(err);
});

function onMessage(msg) {
  console.log("message", msg.data);
  ws.removeEventListener("message", onMessage);
  ws.close();
}

ws.addEventListener("message", onMessage);
ws.addEventListener("close", () => {
  console.log("close");
  loop.quit();
});

loop.run();
