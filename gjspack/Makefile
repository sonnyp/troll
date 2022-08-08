
.PHONY: build test test-ci clean demo

build:
	./bin/gjspack --app-id=gjspack src/cli.js bin/

test: build
	./bin/gjspack --app-id=gjspack-test test/gjspack.test.js test/build/
	test/build/gjspack-test

test-ci: clean test
	./bin/gjspack --app-id=gjspack-demo ./demo/main.js ./demo/build
	cd demo && flatpak-builder --user --force-clean flatpak flatpak.json

clean:
	rm -rf demo/.flatpak-builder demo/flatpak demo/build test/build

demo: build
	./bin/gjspack --app-id=gjspack-demo ./demo/main.js ./demo/build
	./demo/build/gjspack-demo
