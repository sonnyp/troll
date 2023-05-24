.PHONY: build lint test

build:
	npm install
	./node_modules/.bin/rollup -c rollup.config.js

lint:
	./node_modules/.bin/eslint --max-warnings=0 .

test: lint
	tst/bin.js **/*.test.js
