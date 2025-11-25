import Gio from "gi://Gio";

const MAX_BYTES = 65536;

/**
 * Web Crypto API compatible QuotaExceededError
 */
export const QuotaExceededError = (() => {
  if (globalThis.QuotaExceededError) {
    return globalThis.QuotaExceededError;
  }

  class QuotaExceededError extends Error {
    constructor(message) {
      super(message);
      this.name = "QuotaExceededError";
    }
  }

  return QuotaExceededError;
})();

/**
 * Web Crypto API compatible getRandomValues
 */
export function getRandomValues(array) {
  if (!ArrayBuffer.isView(array) || array instanceof DataView) {
    throw new TypeError("Expected a TypedArray");
  }

  if (array.byteLength === 0) {
    return array;
  }

  if (array.byteLength > MAX_BYTES) {
    throw new QuotaExceededError(
      `Requested array size ${array.byteLength} exceeds quota of ${MAX_BYTES} bytes`,
    );
  }

  const file = Gio.File.new_for_path("/dev/urandom");
  const inputStream = file.read(null);

  const buffer = new ArrayBuffer(array.byteLength);
  const view = new Uint8Array(buffer);
  let bytesRead = 0;

  try {
    while (bytesRead < array.byteLength) {
      const chunk = inputStream.read_bytes(array.byteLength - bytesRead, null);
      if (!chunk || chunk.get_size() === 0) {
        throw new Error("Failed to read from /dev/urandom: no data returned");
      }

      view.set(chunk.toArray(), bytesRead);
      bytesRead += chunk.get_size();
    }
  } finally {
    try {
      inputStream.close(null);
    } catch (closeError) {
      console.warn(
        "Warning: Failed to close /dev/urandom input stream:",
        closeError,
      );
    }
  }

  const targetView = new Uint8Array(
    array.buffer,
    array.byteOffset,
    array.byteLength,
  );
  targetView.set(view);

  return array;
}
