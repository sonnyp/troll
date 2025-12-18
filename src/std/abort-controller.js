import { Event, EventTarget } from "./event-target.js";

const SECRET = {};

export function AbortSignal(secret) {
  if (secret !== SECRET) {
    throw new TypeError("Illegal constructor.");
  }
  EventTarget.call(this);
  this._aborted = false;
}

AbortSignal.prototype = Object.create(EventTarget.prototype);
AbortSignal.prototype.constructor = AbortSignal;

Object.defineProperty(AbortSignal.prototype, "onabort", {
  get: function () {
    return this._onabort;
  },
  set: function (callback) {
    const existing = this._onabort;
    if (existing) {
      this.removeEventListener("abort", existing);
    }
    this._onabort = callback;
    this.addEventListener("abort", callback);
  },
});

Object.defineProperty(AbortSignal.prototype, "aborted", {
  get: function () {
    return this._aborted;
  },
});

export function AbortController() {
  this._signal = new AbortSignal(SECRET);
}

AbortController.prototype = Object.create(Object.prototype);

Object.defineProperty(AbortController.prototype, "signal", {
  get: function () {
    return this._signal;
  },
});

AbortController.prototype.abort = function () {
  const signal = this.signal;
  if (!signal.aborted) {
    signal._aborted = true;
    signal.dispatchEvent(new Event("abort"));
  }
};
