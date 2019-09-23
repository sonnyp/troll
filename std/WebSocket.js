// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

/* exported WebSocket */

const {Soup} = imports.gi;
const ByteArray = imports.byteArray;
const Signals = imports.signals;

imports.searchPath.push('..');

const {promiseTask} = imports.util;

var WebSocket = class WebSocket {
    constructor(url, protocols = []) {
        this.eventListeners = new WeakMap();
        this._connection = null;

        if (typeof protocols === 'string')
            protocols = [protocols];

        this._start(url, protocols);
    }

    async _start(url, protocols) {
        const session = new Soup.Session();
        const message = new Soup.Message({
            method: 'GET',
            uri: Soup.URI.new(url),
        });

        let connection;

        try {
            connection = await promiseTask(
                session,
                'websocket_connect_async',
                'websocket_connect_finish',
                message,
                'origin',
                protocols,
                null
            );
        } catch (err) {
            this.onerror(err);
            return;
        }

        this._onconnection(connection);
    }

    _onconnection(connection) {
        this._connection = connection;

        this._onopen();

        connection.connect('closed', () => {
            this._onclose();
        });

        connection.connect('error', (self, err) => {
            this._onerror(err);
        });

        connection.connect('message', (self, type, message) => {
            if (type === Soup.WebsocketDataType.TEXT) {
                const data = ByteArray.toString(ByteArray.fromGBytes(message));
                this._onmessage({data});
            } else {
                this._onmessage({data: message});
            }
        });
    }

    send(data) {
        this._connection.send_text(data);
    }

    close() {
        this._connection.close(Soup.WebsocketCloseCode.NORMAL, null);
    }

    _onopen() {
        if (typeof this.onopen === 'function')
            this.onopen();

        this.emit('open');
    }

    _onmessage(message) {
        if (typeof this.onmessage === 'function')
            this.onmessage(message);

        this.emit('message', message);
    }

    _onclose() {
        if (typeof this.onclose === 'function')
            this.onclose();

        this.emit('close');
    }

    _onerror(error) {
        if (typeof this.onerror === 'function')
            this.onerror(error);

        this.emit('error', error);
    }

    addEventListener(name, fn) {
        const id = this.connect(name, (self, ...args) => {
            fn(...args);
        });
        this.eventListeners.set(fn, id);
    }

    removeEventListener(name, fn) {
        const id = this.eventListeners.get(fn);
        this.disconnect(id);
        this.eventListeners.delete(fn);
    }


};
Signals.addSignalMethods(WebSocket.prototype);
