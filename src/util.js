import GLib from "gi://GLib";
import Gio from "gi://Gio";
import system from "system";

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

export function promiseTask(object, method, finish, ...args) {
  return new Promise((resolve, reject) => {
    object[method](...args, (self, asyncResult) => {
      try {
        resolve(object[finish](asyncResult));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function normalizeEmitter(emitter) {
  const addListener =
    emitter.on || emitter.addListener || emitter.addEventListener;
  const removeListener =
    emitter.off || emitter.removeListener || emitter.removeEventListener;

  if (!addListener || !removeListener) {
    throw new TypeError("Emitter is not compatible");
  }

  return {
    addListener: addListener.bind(emitter),
    removeListener: removeListener.bind(emitter),
  };
}

function promiseSignal(object, signal, error_signal) {
  return new Promise((resolve, reject) => {
    const handler_id = object.connect(signal, handler);
    let error_handler_id;

    function cleanup() {
      object.disconnect(handler_id);
      if (error_handler_id) object.disconnect(error_handler_id);
    }

    if (error_signal) {
      error_handler_id = object.connect(error_signal, (self, error) => {
        cleanup();
        reject(error);
      });
    }

    function handler(self, ...params) {
      cleanup();
      resolve(params);
    }
  });
}

function promiseEvent(object, signal, error_signal) {
  const { addListener, removeListener } = normalizeEmitter(object);

  return new Promise((resolve, reject) => {
    addListener(signal, listener);

    function cleanup() {
      removeListener(signal, listener);
      if (error_signal) removeListener(error_signal, error_listener);
    }

    if (error_signal) {
      addListener(error_signal, error_listener);
    }

    function error_listener(err) {
      cleanup();
      reject(err);
    }

    function listener(...params) {
      cleanup();
      resolve(params);
    }
  });
}

export function delay(ms) {
  let timeout_id;
  const promise = new Promise((resolve) => {
    timeout_id = setTimeout(() => {
      resolve();
    }, ms);
  });
  promise.timeout_id = timeout_id;
  return promise;
}

function timeout(ms) {
  return delay(ms).then(() => {
    throw new TimeoutError(`Promise timed out after ${ms} milliseconds`);
  });
}

export function once(
  object,
  signal,
  options = {
    error: "",
    timeout: -1,
  }
) {
  let promise;
  if (object.connect && object.disconnect) {
    promise = promiseSignal(object, signal, options.error);
  } else {
    promise = promiseEvent(object, signal, options.error);
  }

  if (options.timeout < 0) {
    return promise;
  }

  const promise_timeout = timeout(options.timeout);
  return Promise.race([promise, promise_timeout]).finally(() => {
    clearTimeout(promise_timeout.timeout_id);
  });
}

// FIXME: does not work with source loaded from resource
// import.meta.url is resource:///re/sonny/Workbench/js/util.js
export function relativePath(path) {
  const [filename] = GLib.filename_from_uri(import.meta.url);
  const dirname = GLib.path_get_dirname(filename);
  return GLib.canonicalize_filename(path, dirname);
}

function noop() {}

export class Deferred extends Promise {
  constructor(def = noop) {
    let res, rej;
    super((resolve, reject) => {
      def(resolve, reject);
      res = resolve;
      rej = reject;
    });
    this.resolve = res;
    this.reject = rej;
  }
}

export function getGIRepositoryVersion(repo) {
  const {
    get_major_version = () => "?",
    get_minor_version = () => "?",
    get_micro_version = () => "?",
  } = repo;
  return `${get_major_version()}.${get_minor_version()}.${get_micro_version()}`;
}

export function getGLibVersion() {
  return `${GLib.MAJOR_VERSION}.${GLib.MINOR_VERSION}.${GLib.MICRO_VERSION}`;
}

export function getGjsVersion() {
  const v = system.version.toString();
  return `${v[0]}.${+(v[1] + v[2])}.${+(v[3] + v[4])}`;
}

// To use with import.meta.url
export function resolve(uri, path) {
  return GLib.build_filenamev([
    GLib.path_get_dirname(GLib.Uri.parse(uri, null).get_path()),
    path,
  ]);
}

export function getPid() {
  const credentials = new Gio.Credentials();
  return credentials.get_unix_pid();
}
