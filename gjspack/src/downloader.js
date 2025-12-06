import GLib from "gi://GLib";
import Gio from "gi://Gio";

// https://github.com/denoland/deno/blob/2ddf85492ff5d5806e63a46286ee0e3603042c02/cli/cache/http_cache.rs#L27
export function baseUrlToFile(url) {
    const scheme = url.get_scheme();
    const out = Gio.File.new_for_path(`/${scheme}`);

    if (scheme === "http" || scheme === "https") {
        const host = url.get_host();
        const port = url.get_port();
        const host_port = port !== -1 ? `${host}_PORT${port}` : host;

        return out.get_child(host_port);
    } else {
        console.debug(`Don't know how to create cache name for scheme: ${scheme}`);
        return null;
    }
}

export function urlToFilepath(url) {
    const cache_filename = baseUrlToFile(url);
    if (!cache_filename) {
        return null;
    }
    let rest_str = url.get_path();
    const query = url.get_query();
    if (query) {
        rest_str += `?${query}`;
    }
    // NOTE: fragment is omitted on purpose - it's not taken into
    // account when caching - it denotes parts of webpage, which
    // in case of static resources doesn't make much sense

    const hashed = checksum(rest_str);
    return cache_filename.get_child(hashed).get_path().substring(1);
}

export function checksum(data) {
    return GLib.compute_checksum_for_string(GLib.ChecksumType.SHA256, data, -1);
}