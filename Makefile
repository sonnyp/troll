.PHONY: build lint test

build:
	npm install
	./node_modules/.bin/rollup -c rollup.config.js

lint:
	./node_modules/.bin/eslint .

test:
	gjs -m test/base64.test.js
	gjs -m test/WebSocket.test.js
	make lint
