import Gio from "gi://Gio";
import GLib from "gi://GLib";

import * as lexer from "../lib/lexer.js";
import { createElement as xml } from "../lib/ltx.js";
import { decode, appIdToPrefix } from "./utils.js";

const current_dir = GLib.get_current_dir();
const current_file = Gio.File.new_for_path(current_dir);

export function getPathForResource(
  module_path,
  // The file which imports module_path
  relative_to,
  // glib-compile-resources --sourcedir defaults to current directory
  source_dir = current_file,
) {
  const module_file = relative_to
    .get_parent()
    .resolve_relative_path(module_path);

  const relative_path = source_dir.get_relative_path(module_file);

  return (
    relative_path ||
    // If the module is outside of the source tree
    // return an absolute path
    module_file.get_path()
  );
}

// glib-compile-resource require the file to exist on disk
// so we have to save the transformed source in a temporary file
function saveTransformed({ alias, resources, transformed }) {
  const [transfomed_file] = Gio.File.new_tmp("gjspack-XXXXXX.js");
  transfomed_file.replace_contents(
    transformed, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null, // cancellable
  );

  resources.push({ path: transfomed_file.get_path(), alias });
}

export function isBundableImport(imported) {
  const { n: location, d } = imported;
  if (!location) return false;
  if (location.startsWith("gi:")) return false;
  if (location.startsWith("resource:")) return false;
  if (!location.startsWith(".") && !location.startsWith("/")) return false;
  // We don't support dyanmic import yet
  // probably should remain their own file by default
  // and simply get copied to some DATA_DIR
  if (d > -1) return false;
  return true;
}

function getBundableImport(source) {
  const [imports] = lexer.parse(source);
  return imports.find(isBundableImport);
}

export function processSourceFile({ resources, source_file, prefix }) {
  const [, contents] = source_file.load_contents(null);
  const source = decode(contents);

  function next(source) {
    const imported = getBundableImport(source);
    if (!imported) return source;

    // ss is start of import statement
    // se is end of import statement
    // s is start of moule path
    // e is end of module path
    // n is location
    // d > -1 means dynamic import
    const { ss, se, s, e, n } = imported;

    // GJS supports loading relative js paths
    // when importa.meta.url is a resource: uri
    // if (n.endsWith(".js")) return next(source);
    // but it would make way more complicated to
    // figure out a way to skip bundle imports
    // so we replace them with resource uris anyway
    // see commit da38c9430cfebdaa0b3e0021ac98eed966f09e9a

    let str = "";
    const path = getPathForResource(n, source_file);

    if (n.endsWith(".js") || n.endsWith(".mjs")) {
      str += source.slice(0, s);
      str += `resource://${GLib.build_filenamev([prefix, path])}`;
      str += source.slice(e);

      // This is a duplicate import, it was already transformed
      if (resources.find(({ alias }) => alias === path)) {
        return next(str);
      }

      const import_file = source_file.get_parent().resolve_relative_path(n);
      const transformed = processSourceFile({
        resources,
        source_file: import_file,
        prefix,
      });

      saveTransformed({
        alias: path,
        resources,
        transformed,
      });
    } else {
      const statement = source.slice(ss, se);
      const match = statement.match(/^import (\w+) from/);
      const name = match?.[1];

      str += source.slice(0, ss);
      str += name
        ? `const ${name} = "${GLib.build_filenamev([prefix, path])}"`
        : `// ${GLib.build_filenamev([prefix, path])}`;
      str += source.slice(se);

      // Not a duplicate import
      if (!resources.find((resource) => resource.path === path)) {
        resources.push({ path, alias: null });
      }
    }

    return next(str);
  }

  const transformed = next(source);
  console.debug("transformed\n", transformed);

  // Strings are null terminated, if we pass an empty string, we get the following error
  // GLib-GIO-CRITICAL **: 18:38:40.267: g_file_replace_contents: assertion 'contents != NULL' failed
  return transformed || "\n";
}

function buildGresource({ prefix, resources, output, app_id }) {
  const el = xml(
    "gresources",
    {},
    xml(
      "gresource",
      { prefix },
      ...resources.map(({ path, alias }) => xml("file", { alias }, path)),
    ),
  );
  const gresource_xml = `<?xml version="1.0" encoding="UTF-8" ?>${el.toString()}`;

  console.debug(`gresource_xml\n${gresource_xml}`);

  const [file] = Gio.File.new_tmp("gjspack-XXXXXX.gresource.xml");
  file.replace_contents(
    gresource_xml, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null,
  );

  const gresource_path = output.get_child(`${app_id}.gresource`).get_path();

  const [, stdout, stderr, status] = GLib.spawn_command_line_sync(
    `glib-compile-resources --target=${gresource_path} ${file.get_path()}`,
  );
  if (status !== 0) {
    throw new Error(decode(stderr));
  }

  console.debug("stdout: ", decode(stdout));

  return { gresource_path };
}

export function build({ app_id, entry, output }) {
  console.debug({ current_dir });

  const prefix = appIdToPrefix(app_id);
  const relative_to = Gio.File.new_for_path(entry.get_path());

  const resources = [];

  const transformed = processSourceFile({
    resources,
    relative_to,
    source_file: entry,
    prefix,
  });

  saveTransformed({
    alias: entry.get_basename(),
    resources,
    transformed,
  });

  try {
    output.make_directory_with_parents(null);
  } catch (err) {
    if (err.code !== Gio.IOErrorEnum.EXISTS) throw err;
  }

  const { gresource_path } = buildGresource({
    prefix,
    resources,
    output,
    app_id,
  });

  return { gresource_path, prefix };
}
