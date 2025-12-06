
.PHONY: build test test-ci clean demo

build:
	npm install
	./bin/gjspack --appid=gjspack src/cli.js bin/

test:
	../tst/bin.js **/*.test.js

ci: clean test
	./bin/gjspack --appid=gjspack-demo ./demo/main.js ./demo/build
	cd demo && flatpak-builder --install-deps-from=flathub --disable-updates --user --force-clean flatpak flatpak.json

clean:
	rm -rf demo/.flatpak-builder demo/flatpak demo/build test/build

demo: build
	./bin/gjspack --appid=gjspack-demo --import-map=./demo/import_map.json ./demo/main.js ./demo/build
	./demo/build/gjspack-demo

demo-dev:
	cd demo && ./dev.js
