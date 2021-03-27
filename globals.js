// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

import {atob, btoa} from './std/base64.js'
import {TextEncoder, TextDecoder} from './std/encoding.js'
import {setTimeout, setInterval, clearTimeout, clearInterval} from './std/timers.js'
import fetch from './std/fetch.js'
import WebSocket from './std/WebSocket.js'
import console from './std/console.js'

Object.assign(window, {
  atob,
  btoa,
  TextEncoder,
  TextDecoder,
  setTimeout,
  setInterval,
  clearTimeout,
  clearInterval,
  fetch,
  console,
  WebSocket
});
