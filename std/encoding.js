// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

/* exported TextEncoder, TextDecoder */

const byteArray = imports._byteArrayNative;

class TextEncoder {
    constructor() {
        this.encoding = 'utf-8';
    }

    encode(str) {
        byteArray.fromString(str, 'UTF-8');
    }
}

class TextDecoder {
    constructor() {
        this.encoding = 'utf-8';
    }

    decode(bytes) {
        byteArray.toString(bytes, 'UTF-8');
    }
}
