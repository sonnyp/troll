import { atob, btoa } from "./std/base64.js";
import fetch from "./std/fetch.js";
import WebSocket from "./std/WebSocket.js";
import { getRandomValues, QuotaExceededError } from "./std/crypto.js";
import { Event, EventTarget, CustomEvent } from "./std/event-target.js";
import { AbortController, AbortSignal } from "./std/abort-controller.js";

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = getRandomValues;
}

Object.entries({
  atob,
  btoa,
  fetch,
  WebSocket,
  QuotaExceededError,
  Event,
  EventTarget,
  CustomEvent,
  AbortController,
  AbortSignal,
}).forEach(([key, value]) => {
  if (!globalThis[key]) globalThis[key] = value;
});
