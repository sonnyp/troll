// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const byteArray = imports._byteArrayNative;

export class TextEncoder {
    constructor() {
        this.encoding = 'utf-8';
    }

    encode(str) {
        byteArray.fromString(str, 'UTF-8');
    }
}

export class TextDecoder {
    constructor() {
        this.encoding = 'utf-8';
    }

    decode(bytes) {
        byteArray.toString(bytes, 'UTF-8');
    }
}
