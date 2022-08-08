.PHONY: build lint test

build:
	npm install
	./node_modules/.bin/rollup -c rollup.config.js

lint:
	./node_modules/.bin/eslint --max-warnings=0 . gjspack/src/executable.js.tmpl

test:
	tst/bin.js **/*.test.js
	./node_modules/.bin/eslint .
