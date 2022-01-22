import { atob, btoa } from "./std/base64.js";
import fetch from "./std/fetch.js";
import WebSocket from "./std/WebSocket.js";

Object.assign(globalThis, {
  atob,
  btoa,
  fetch,
  WebSocket,
});
