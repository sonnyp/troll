#!/usr/bin/env -S gjs -m

// This is a simple program to download npm packages as esm modules.
// Running `gjs -m ./src/download-esm.js solid-js ./js` will download
// `solid-js` and its dependencies, writing them to the `./js` folder.

import Gio from "gi://Gio"
import { download } from "./lib.js"

async function main(argv) {
    const HELP = `Usage: download-esm <package> <output-path>`
    const [pkg, output_path] = argv
    const folder = Gio.File.new_for_path(output_path);
    if (!folder.query_exists(null)) {
        folder.make_directory(null);
    }
    await download(pkg, folder)
}

await main(ARGV)