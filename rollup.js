import myExample from "./rollup-plugin.js";
export default {
  input: "test.js", // resolved by our plugin
  plugins: [myExample()],
  output: [
    {
      file: "bundle.js",
      format: "es",
    },
  ],
};

// npx rollup -c rollup.js
// checkout bundle.js
