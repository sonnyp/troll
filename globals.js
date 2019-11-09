// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

import {atob, btoa} from './std/base64'
import {TextEncoder, TextDecoder} from './std/encoding'
import {setTimeout, setInterval, clearTimeout, clearInterval} from './std/timers'
import fetch from './std/fetch'
import WebSocket from './std/WebSocket'
import console from './std/console'

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
