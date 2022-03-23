import { atob, btoa } from "./std/base64.js";
import fetch from "./std/fetch.js";
import WebSocket from "./std/WebSocket.js";

Object.entries({ atob, btoa, fetch, WebSocket }).forEach(([key, value]) => {
  if (!globalThis[key]) globalThis[key] = value;
});
