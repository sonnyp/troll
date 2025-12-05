// eslint-disable-next-line no-undef
module.exports = {
  // gjs does not support source map so this helps
  // https://babeljs.io/docs/en/options#retainlines
  // https://gitlab.gnome.org/GNOME/gjs/-/issues/474
  retainLines: true,
  plugins: [
    [
      "@babel/plugin-transform-react-jsx",
      {
        pragma: "gsx.h",
        pragmaFrag: "gsx.Fragment",
        useSpread: true,
      },
    ],
  ],
};
