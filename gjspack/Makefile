
.PHONY: build lint test test-ci clean demo

build:
	./bin/gjspack --app-id=gjspack src/cli.js bin/

lint:
	../node_modules/.bin/eslint --max-warnings=0 src/ src/executable.js.tmpl

test: lint build
	./bin/gjspack --app-id=gjspack-test test/gjspack.test.js test/build/
	test/build/gjspack-test

test-ci: clean test
	./bin/gjspack --app-id=gjspack-demo ./demo/main.js ./demo/build

clean:
	rm -rf .flatpak .flatpak-builder demo/flatpak flatpak demo/build test/build

demo: build
	./bin/gjspack --app-id=gjspack-demo ./demo/main.js ./demo/build
	./demo/build/gjspack-demo
