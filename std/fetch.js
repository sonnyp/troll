// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

import {promiseTask} from '../util.js'
import Soup from 'gi://Soup'

const ByteArray = imports.byteArray;

export default async function fetch(url, options = {}) {
    const session = new Soup.Session();
    const method = options.method || 'GET';
    const message = new Soup.Message({
        method,
        uri: Soup.URI.new(url),
    });
    const headers = options.headers || {};

    for (const header in headers)
        message.request_headers.set(header, headers[header]);

    if (typeof options.body === 'string')
        message.response_body_data = new Uint8Array(options.body);

    const inputStream = await promiseTask(
        session,
        'send_async',
        'send_finish',
        message,
        null
    );

    const {status_code, response_headers, reason_phrase} = message;
    const ok = status_code >= 200 && status_code < 300;

    return {
        status: status_code,
        statusText: reason_phrase,
        ok,
        type: 'basic',
        async json() {
            const text = await this.text();
            return JSON.parse(text);
        },
        async text() {
            const contentLength = response_headers.get('content-length');
            const bytes = await promiseTask(
                inputStream,
                'read_bytes_async',
                'read_bytes_finish',
                contentLength,
                null,
                null
            );
            return ByteArray.toString(ByteArray.fromGBytes(bytes));
        },
    };
}
