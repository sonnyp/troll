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

export function once(object, signal, errorSignal) {
  return new Promise((resolve, reject) => {
    const handlerId = object.connect(signal, handler);
    let errorHandlerId;

    if (errorSignal) {
      errorHandlerId = object.connect(errorSignal, (self, error) => {
        object.disconnect(handlerId);
        object.disconnect(errorHandlerId);
        reject(error);
      });
    }

    function handler(self, ...params) {
      object.disconnect(handlerId);
      if (errorHandlerId) object.disconnect(errorHandlerId);
      return resolve(params);
    }
  });
}
