import { nodeResolve } from "@rollup/plugin-node-resolve";

export default [
  {
    input: "node_modules/uvu/assert/index.mjs",
    output: {
      file: "tst/assert.js",
    },
    plugins: [nodeResolve()],
  },
];
