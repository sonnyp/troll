import tst, { assert } from "../tst/tst.js";
import * as downloadEsm from "./lib.js";

const test = tst("download-esm");

test("extract_original_file", () => {
    const content = `Random text
    Original file: /npm/@observablehq/plot@0.6.6/src/index.js
    `;
    const expected = "/npm/@observablehq/plot@0.6.6/src/index.js";
    const actual = downloadEsm.extract_original_file(content);
    assert.equal(actual, expected);
});

test("simplify_path_unscoped", () => {
    const path = "/npm/react@18.2.0/index.js";
    assert.equal(downloadEsm.simplify_path(path), "react-18-2-0.js");
});

test("simplify_path_scoped", () => {
    const path = "/npm/@observablehq/plot@0.6.6/src/index.js";
    assert.equal(downloadEsm.simplify_path(path), "observablehq-plot-0-6-6.js");
});

test("simplify_esm", () => {
    const path = "/npm/isoformat@0.2.1/+esm";
    assert.equal(downloadEsm.simplify_path(path), "isoformat-0-2-1.js");
});

test("rewrite_code", () => {
    const code = `
        import {f1, f2, f3} from "/npm/isoformat@0.2.1/+esm";
        import solid from "/npm/solid-js@1.0.1/+esm";
        //# sourceMappingURL=/sm/01413fe1f7a8c2da69e83bcc6c3f16a63658e3f27f5a8ffeda7da895d71e4aa2.map
        const x = 1;
    `;
    const expected_code = `
        import {f1, f2, f3} from "./isoformat-0-2-1.js";
        import solid from "./solid-js-1-0-1.js";
        
        const x = 1;
    `
    const [rewritten_code, captured_paths] = downloadEsm.rewrite_code(code);
    const expected_captured_paths = {
        "/npm/isoformat@0.2.1/+esm": "isoformat-0-2-1.js",
        "/npm/solid-js@1.0.1/+esm": "solid-js-1-0-1.js"
    };
    assert.equal(rewritten_code, expected_code);
    assert.equal(captured_paths, expected_captured_paths);
});


export default test;