export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

export function assert(value, message = '') {
  if (!value) throw new AssertionError(message)
}

export function is(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(message || `Expected "${actual}" to be "${expected}".`);
  }
}

export default assert
