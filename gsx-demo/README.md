# gsx demo

This is a simple demo to write Gtk interfaces using jsx syntax.

It uses Babel to compile jsx syntax to JavaScript that gjs understands.

## Setup

```sh
cd gsx-demo
npm install
```

## Run

```sh
cd gsx-demo
# edit js/main.js
npm run build
gjs -m js/main.js
```
