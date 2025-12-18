export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
}

export function promiseTask(object, method, finish, ...args) {
  return new Promise((resolve, reject) => {
    object[method](...args, (_self, asyncResult) => {
      try {
        resolve(object[finish](asyncResult));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function delay(ms) {
  let timeout;
  const promise = new Promise((resolve) => {
    timeout = setTimeout(() => {
      resolve();
    }, ms);
  });
  promise.timeout = timeout;
  return promise;
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
  if (object.addEventListener && object.removeEventListener) {
    promise = promiseEvent(object, signal, options.error);
  } else {
    promise = promiseSignal(object, signal, options.error);
  }

  if (options.timeout < 0) {
    return promise;
  }

  const promise_timeout = timeout(options.timeout);
  return Promise.race([promise, promise_timeout]).finally(() => {
    clearTimeout(promise_timeout.timeout_id);
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

function promiseSignal(object, signal, error_signal) {
  return new Promise((resolve, reject) => {
    const handler_id = object.connect(signal, handler);
    let error_handler_id;

    function cleanup() {
      object.disconnect(handler_id);
      if (error_handler_id) object.disconnect(error_handler_id);
    }

    if (error_signal) {
      error_handler_id = object.connect(error_signal, (_self, error) => {
        cleanup();
        reject(error);
      });
    }

    function handler(_self, ...params) {
      cleanup();
      resolve(params);
    }
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

function timeout(ms) {
  return delay(ms).then(() => {
    throw new TimeoutError(`Promise timed out after ${ms} milliseconds`);
  });
}
