import Gio from "gi://Gio";
import GioUnix from "gi://GioUnix";
import * as assert from "./assert.js";

const stdout = new Gio.DataOutputStream({
  base_stream: new GioUnix.OutputStream({ fd: 1 }),
});
// const stderr = new Gio.DataOutputStream({
//   base_stream: new GioUnix.OutputStream({ fd: 2 }),
// });

const colors = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  gray: 90,
};

function log(str) {
  return stdout.put_string(str, null);
}

const rgb = {};

for (const name in colors) {
  const color = colors[name];

  const fn = (rgb[name] = function (msg) {
    msg = `\u001b[${color}m${msg}\u001b[39m`;
    log(msg);
  });

  rgb[name + "ln"] = function (str) {
    fn(str + "\n");
  };
}

export default function (headline) {
  const suite = [],
    before = [],
    after = [],
    only = [];

  function self(name, fn) {
    suite.push({ name: name, fn: fn });
  }

  self.only = function (name, fn) {
    only.push({ name: name, fn: fn });
  };

  self.before = function (fn) {
    before.push(fn);
  };
  self.after = function (fn) {
    after.push(fn);
  };
  self.skip = function () {};

  self.run = async function () {
    const tests = only[0] ? only : suite;

    rgb.cyan(headline + " ");

    for (const test of tests) {
      try {
        for (const fn of before) await fn();
        await test.fn();
        rgb.gray("• ");
      } catch (e) {
        for (const fn of after) await fn();
        rgb.red(`\n\n! ${test.name} \n\n`);
        prettyError(e);
        return false;
      }
    }

    for (const fn of after) await fn();
    rgb.greenln(`✓ ${tests.length}`);
    return true;
  };

  return self;
}

function prettyError(e) {
  rgb.yellow(`${e}\n`);

  const msg = e.stack;
  if (!msg) return;

  if (e.name === "Assertion" && e.details) {
    log(e.details);
  }

  const i = msg.indexOf("\n");
  rgb.yellowln(msg.slice(0, i));
  rgb.gray(msg.slice(i + 1));
}

export { assert };
