# download-esm

It's a program which can be used to download an npm package and all of its
dependencies as ESM modules. ESM modules can then be directly imported and used
in gjs without the need for a bundler.

WARNING: The downloaded files are provided by https://cdn.jsdelivr.net, a popular CDN for npm packages.
Using this tool means you are trusting that CDN to provide you with the correct files.

This is a rewrite of `https://github.com/simonw/download-esm` using gjs.

## Usage
```
Usage: download-esm PACKAGE OUTPUT_DIR
```