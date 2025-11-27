import tst, { assert } from "../tst/tst.js";
import { getRandomValues } from "../src/std/crypto.js";

const test = tst("crypto");

test("Uint8Array", () => {
  const array = new Uint8Array(16);
  const result = getRandomValues(array);

  assert.is(result, array);
  assert.is(array.length, 16);

  // Check that values are actually random (not all zero)
  let hasNonZero = false;
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== 0) {
      hasNonZero = true;
      break;
    }
  }
  assert.is(hasNonZero, true);
});

test("Uint32Array", () => {
  const array = new Uint32Array(4);
  const result = getRandomValues(array);

  assert.is(result, array);
  assert.is(array.length, 4);

  // Check that values are actually random (not all zero)
  let hasNonZero = false;
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== 0) {
      hasNonZero = true;
      break;
    }
  }
  assert.is(hasNonZero, true);
});

test("Float64Array", () => {
  const array = new Float64Array(2);
  const result = getRandomValues(array);

  assert.is(result, array);
  assert.is(array.length, 2);
});

test("DataView rejection", () => {
  try {
    getRandomValues(new DataView(new ArrayBuffer(8)));
    assert.is(false, true, "Should have thrown TypeError");
  } catch (error) {
    assert.is(error instanceof TypeError, true);
    assert.is(error.message, "Expected a TypedArray");
  }
});

test("Plain object rejection", () => {
  try {
    getRandomValues({});
    assert.is(false, true, "Should have thrown TypeError");
  } catch (error) {
    assert.is(error instanceof TypeError, true);
    assert.is(error.message, "Expected a TypedArray");
  }
});

test("Empty array", () => {
  const array = new Uint8Array(0);
  const result = getRandomValues(array);

  assert.is(result, array);
  assert.is(array.length, 0);
});

test("Statistical randomness - no patterns", () => {
  const array = new Uint8Array(256);
  getRandomValues(array);

  // Count occurrences of each byte value
  const distribution = new Array(256).fill(0);
  for (let i = 0; i < array.length; i++) {
    distribution[array[i]]++;
  }

  // No single value should dominate (e.g., more than 10% of values)
  const maxOccurrence = Math.max(...distribution);
  assert.is(
    maxOccurrence <= 26,
    true,
    `Max occurrence ${maxOccurrence} exceeds threshold`,
  );
});

test("Different values on repeated calls", () => {
  const array1 = new Uint8Array(32);
  const array2 = new Uint8Array(32);

  getRandomValues(array1);
  getRandomValues(array2);

  // Arrays should not be identical
  let identical = true;
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      identical = false;
      break;
    }
  }
  assert.is(
    identical,
    false,
    "Two consecutive calls returned identical values",
  );
});

test("Sufficient entropy - no constant runs", () => {
  const array = new Uint8Array(100);
  getRandomValues(array);

  // Check for runs of identical values (max run length should be < 10)
  let maxRun = 1;
  let currentRun = 1;

  for (let i = 1; i < array.length; i++) {
    if (array[i] === array[i - 1]) {
      currentRun++;
      maxRun = Math.max(maxRun, currentRun);
    } else {
      currentRun = 1;
    }
  }

  assert.is(maxRun < 10, true, `Max run length ${maxRun} is too high`);
});

test("All bytes are written - no zeros at end", () => {
  const array = new Uint8Array(1000);
  // Pre-fill with sentinel value
  array.fill(0xff);

  getRandomValues(array);

  // Check that values have changed from 0xFF
  let changedBytes = 0;
  for (let i = 0; i < array.length; i++) {
    if (array[i] !== 0xff) {
      changedBytes++;
    }
  }

  // At least 95% should have changed (statistically very likely)
  assert.is(
    changedBytes >= 950,
    true,
    `Only ${changedBytes}/1000 bytes changed`,
  );
});

test("Large buffers are filled correctly", () => {
  const array = new Uint8Array(65536); // 64KB
  const result = getRandomValues(array);

  assert.is(result, array);

  // Check entropy across the entire buffer
  let hasNonZero = false;
  let hasNonFF = false;

  for (let i = 0; i < array.length; i++) {
    if (array[i] !== 0) hasNonZero = true;
    if (array[i] !== 0xff) hasNonFF = true;
    if (hasNonZero && hasNonFF) break;
  }

  assert.is(hasNonZero && hasNonFF, true);
});

test("Odd-sized arrays are filled completely", () => {
  const sizes = [1, 3, 7, 15, 31, 63, 127, 255];

  for (const size of sizes) {
    const array = new Uint8Array(size);
    array.fill(0xaa); // Fill with pattern

    getRandomValues(array);

    // At least 80% should be different from 0xAA
    let changed = 0;
    for (let i = 0; i < size; i++) {
      if (array[i] !== 0xaa) changed++;
    }

    const changeRate = changed / size;
    assert.is(
      changeRate >= 0.8,
      true,
      `Size ${size}: only ${(changeRate * 100).toFixed(1)}% changed`,
    );
  }
});

test("Handles partial reads from urandom", () => {
  // This is hard to test directly, but we can verify the loop copies all bytes
  const array = new Uint8Array(100);
  array.fill(0);

  getRandomValues(array);

  // Check last 10 bytes are also random (not left as zeros)
  let lastTenNonZero = false;
  for (let i = 90; i < 100; i++) {
    if (array[i] !== 0) {
      lastTenNonZero = true;
      break;
    }
  }

  assert.is(lastTenNonZero, true, "Last bytes of array were not filled");
});

test("Quota limit - maximum size accepted", () => {
  const array = new Uint8Array(65536); // Exactly 64KB
  const result = getRandomValues(array);

  assert.is(result, array);
  assert.is(array.length, 65536);
});

test("Quota limit - oversized array rejected", () => {
  const array = new Uint8Array(65537); // 1 byte over limit

  try {
    getRandomValues(array);
    assert.is(false, true, "Should have thrown QuotaExceededError");
  } catch (error) {
    assert.is(error.name, "QuotaExceededError");
    assert.is(error.message.includes("exceeds quota"), true);
    assert.is(error.message.includes("65537"), true);
    assert.is(error.message.includes("65536"), true);
  }
});

test("Quota limit - large oversized array rejected", () => {
  const array = new Uint8Array(131072); // 128KB, double the limit

  try {
    getRandomValues(array);
    assert.is(false, true, "Should have thrown QuotaExceededError");
  } catch (error) {
    assert.is(error.name, "QuotaExceededError");
    assert.is(error.message.includes("exceeds quota"), true);
  }
});

test("Quota limit - different typed arrays respect limit", () => {
  // Test with different typed array types
  const types = [
    { ctor: Uint8Array, bytesPerElement: 1 },
    { ctor: Uint16Array, bytesPerElement: 2 },
    { ctor: Uint32Array, bytesPerElement: 4 },
    { ctor: Float64Array, bytesPerElement: 8 },
  ];

  for (const { ctor, bytesPerElement } of types) {
    // Calculate size that exceeds 64KB
    const elements = Math.floor(65536 / bytesPerElement) + 1;
    const array = new ctor(elements);

    try {
      getRandomValues(array);
      assert.is(
        false,
        true,
        `Should have thrown QuotaExceededError for ${ctor.name}`,
      );
    } catch (error) {
      assert.is(error.name, "QuotaExceededError");
    }
  }
});

test("Quota limit - maximum size for different typed arrays", () => {
  // Test that maximum allowed size works for different typed arrays
  const types = [
    { ctor: Uint8Array, maxElements: 65536 },
    { ctor: Uint16Array, maxElements: 32768 },
    { ctor: Uint32Array, maxElements: 16384 },
    { ctor: Float64Array, maxElements: 8192 },
  ];

  for (const { ctor, maxElements } of types) {
    const array = new ctor(maxElements);
    const result = getRandomValues(array);

    assert.is(result, array);
    assert.is(array.length, maxElements);
    assert.is(array.byteLength, 65536);
  }
});

export default test;
