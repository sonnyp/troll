// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

/* exported promiseTask */

function promiseTask(object, method, finish, ...args) {
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
