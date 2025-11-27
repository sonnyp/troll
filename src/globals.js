import { atob, btoa } from "./std/base64.js";
import fetch from "./std/fetch.js";
import WebSocket from "./std/WebSocket.js";
import { getRandomValues, QuotaExceededError } from "./std/crypto.js";

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = getRandomValues;
}

Object.entries({ atob, btoa, fetch, WebSocket, QuotaExceededError }).forEach(
  ([key, value]) => {
    if (!globalThis[key]) globalThis[key] = value;
  },
);
