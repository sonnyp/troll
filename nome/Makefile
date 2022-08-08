
.PHONY: build lint test test-ci clean demo

build:
	./bin/nome --app-id=nome src/cli.js bin/
# flatpak-builder --user --force-clean --install flatpak re.sonny.Nome.json
# cd demo && flatpak-builder --user --force-clean --install flatpak re.sonny.Nome.Demo.json

lint:
	./node_modules/.bin/eslint --max-warnings=0 src/ src/executable.js.tmpl

test: lint build
# ./bin/nome --app-id=nome src/cli.js bin/
	./bin/nome --app-id=nome-test test/nome.test.js test/build/
	test/build/nome-test

test-ci: clean test
	./bin/nome --app-id=nome-demo ./demo/main.js ./demo/build
# flatpak-builder --show-manifest re.sonny.Nome.json > /dev/null
# flatpak-builder --show-manifest demo/re.sonny.Nome.Demo.json > /dev/null
	flatpak-builder --user --force-clean flatpak re.sonny.Nome.json
	cd demo && flatpak-builder --user --force-clean flatpak re.sonny.Nome.Demo.json

clean:
	rm -rf .flatpak .flatpak-builder demo/flatpak flatpak demo/build test/build

demo: build
	./bin/nome --app-id=nome-demo ./demo/main.js ./demo/build
	./demo/build/nome-demo
