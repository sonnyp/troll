
import Gio from "gi://Gio"
import fetch from "../src/std/fetch.js"

function makeUrl(pkg) {
    return `https://cdn.jsdelivr.net/npm/${pkg}/+esm`
}
function makeUrlFromCDNPath(path) {
    return `https://cdn.jsdelivr.net${path}`
}

export async function download(pkg, folder, { downloaded, simplified_path } = {}) {
    if (!downloaded) {
        downloaded = new Set();
    }

    let url;
    if (pkg.indexOf("https://") == 0) {
        url = pkg;
    } else {
        url = makeUrl(pkg)
    }

    if (downloaded.has(url)) {
        return;
    }

    const response = await fetch(url)
    const { ok, status, statusText } = response
    if (!ok) {
        throw new Error(`Failed to download ${pkg}: ${status} ${statusText}`)
    }

    downloaded.add(url);

    const text = await response.text()

    if (!simplified_path) {
        const original_file = extract_original_file(text);
        simplified_path = simplify_path(original_file);
    }
    print("Downloading", simplified_path);
    const [rewritten_code, captured_paths] = rewrite_code(text);

    const file = folder.get_child(simplified_path);
    file.replace_contents(rewritten_code, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null)

    await Promise.all(Object.keys(captured_paths).map(async (path) => {
        await download(makeUrlFromCDNPath(path), folder, { downloaded, simplified_path: captured_paths[path] })
    }))
}

export function extract_original_file(content) {
    // Looks for Original file: /npm/@observablehq/plot@0.6.6/src/index.js
    const pattern = /Original file: (\/npm\/[^\s]+)/;
    const match = content.match(pattern);

    if (match) {
        return match[1];
    } else {
        throw new Error("Could not find original file");
    }
}

export function simplify_path(path) {
    path = path.split("/npm/")[1];

    const is_scoped_pkg = path.indexOf("@") == 0;
    if (is_scoped_pkg) {
        path = path.replace("@", "");
    }

    let [package_name, version] = path.split("@");
    version = version.split("/")[0];
    version = version.replace(/\./g, "-");
    const simplified_name = `${package_name}-${version}.js`;
    return simplified_name.replace("/", "-");
}

export function rewrite_code(code) {
    const pattern = /(?<keyword>import|export)\s*(?<imports>\{?[^}]+?\}?)\s*from\s*"(?<path>\/npm\/[^"]+)"/g;
    const captured_paths = {};

    function replace_import(_match, keyword, imports, path) {
        const simplified_path = simplify_path(path);
        captured_paths[path] = simplified_path;
        return `${keyword} ${imports} from "./${simplified_path}"`;
    }

    let rewritten_code = code.replaceAll(pattern, replace_import);
    rewritten_code = remove_source_mapping_comments(rewritten_code);
    return [rewritten_code, captured_paths];
}

export function remove_source_mapping_comments(code) {
    const pattern = /\/\/#\s*sourceMappingURL=.*?\.map/g;
    const cleaned_code = code.replace(pattern, "");
    return cleaned_code;
}