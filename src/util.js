import GLib from "gi://GLib";
import Gio from "gi://Gio";
import system from "system";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk";

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
  },
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

export function getPid() {
  const credentials = new Gio.Credentials();
  return credentials.get_unix_pid();
}

export function parseResolve(base, uri_ref) {
  const flags = GLib.UriFlags.NONE;
  return GLib.Uri.parse(base, flags).parse_relative(uri_ref, flags);
}

export function resolve(base, uri_ref) {
  return parseResolve(base, uri_ref).to_string();
}

const BuilderScope = GObject.registerClass(
  {
    Implements: [Gtk.BuilderScope],
  },
  class BuilderScope extends GObject.Object {
    constructor() {
      super();
      this.signal_handlers = Object.create(null);
    }

    add_signal_handler(name, fn) {
      this.signal_handlers[name] = fn;
    }

    // https://docs.gtk.org/gtk4/vfunc.BuilderScope.create_closure.html
    vfunc_create_closure(_builder, function_name, flags, _object) {
      if (flags & Gtk.BuilderClosureFlags.SWAPPED) {
        throw new Error('Signal flag "swapped" is unsupported in JavaScript.');
      }

      const fn = this.signal_handlers[function_name];
      // if (!fn) {
      //   throw new Error(`No function named \`${function_name}\`.`);
      // }
      return fn || noop;
    }
  },
);

export function build(uri, params = {}) {
  const builder = new Gtk.Builder();

  const scope = new BuilderScope();
  builder.set_scope(scope);

  for (const [k, v] of Object.entries(params)) {
    // signals
    if (typeof v === "function") {
      scope.add_signal_handler(k, v);
      // objects
    } else if (v instanceof GObject.Object) {
      builder.expose_object(k, v);
    } else {
      throw new Error("Only function and GObject properties are supported.");
    }
  }

  const handler = {
    get(target, prop, receiver) {
      return builder.get_object(prop);
    },
  };

  const proxy = new Proxy({}, handler);

  const g_uri = GLib.Uri.parse(uri, GLib.UriFlags.NONE);
  const scheme = g_uri.get_scheme();
  const path = g_uri.get_path();
  if (!scheme || !path) {
    throw new Error(`Invalud uri \`${uri}\`.`);
  }

  if (scheme === "resource") {
    builder.add_from_resource(path);
  } else if (scheme === "file") {
    builder.add_from_file(path);
  } else {
    throw new Error(`Unsuported scheme \`${scheme}\`.`);
  }

  return proxy;
}
