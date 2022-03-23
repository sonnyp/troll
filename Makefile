.PHONY: build lint test

build:
	npm install
	./node_modules/.bin/rollup -c rollup.config.js

lint:
	./node_modules/.bin/eslint .

test:
	tst/bin.js **/*.test.js
	./node_modules/.bin/eslint .
