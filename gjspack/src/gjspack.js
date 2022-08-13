import Gio from "gi://Gio";
import GLib from "gi://GLib";

import * as lexer from "../lib/lexer.js";
import { createElement as xml } from "../lib/ltx.js";
import {
  decode,
  appIdToPrefix,
  readTextFileSync,
  writeTextFileSync,
  basename,
} from "./utils.js";

export function getPathForResource(
  module_path,
  // The file which imports module_path
  relative_to,
  // glib-compile-resources --sourcedir defaults to current directory
  source_dir,
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
function saveTransformed({ resource_alias, resources, transformed }) {
  const [transfomed_file] = Gio.File.new_tmp("gjspack-XXXXXX.js");
  transfomed_file.replace_contents(
    transformed, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null, // cancellable
  );

  resources.push({ path: transfomed_file.get_path(), alias: resource_alias });
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

export function getAssertType(assert) {
  const normalized = assert
    .replace(/\s/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "");
  return normalized.match(/^{type:(.+)}$/)?.[1] || null;
}

export function getImportName(statement) {
  const match = statement.match(/^import (\w+) from/);
  return match?.[1];
}

function preprocessBlueprint({
  imported_file,
  resource_path,
  blueprint_compiler = "blueprint-compiler",
}) {
  const [, stdout, stderr, status] = GLib.spawn_command_line_sync(
    `${blueprint_compiler} compile ${imported_file.get_path()}`,
  );
  if (status !== 0) {
    throw new Error(decode(stderr));
  }
  const xml_ui = decode(stdout);
  console.debug(xml_ui);
  const [transfomed_file] = Gio.File.new_tmp(`gjspack-XXXXXX.ui`);
  transfomed_file.replace_contents(
    xml_ui, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null, // cancellable
  );
  return {
    alias: resource_path.replace(/.blp$/, ".ui"),
    path: transfomed_file.get_path(),
    original: resource_path,
  };
}

function preprocess({ imported_file, resource_path, blueprint_compiler }) {
  const [, , extension] = basename(imported_file.get_basename());

  if (extension === ".blp") {
    return preprocessBlueprint({
      imported_file,
      resource_path,
      blueprint_compiler,
    });
  }

  return { path: resource_path, alias: null };
}

export function processSourceFile({
  resources,
  source_file,
  resource_root,
  prefix,
  blueprint_compiler,
}) {
  const [, contents] = source_file.load_contents(null);
  const source = decode(contents);

  function next(source) {
    const imported = getBundableImport(source);
    if (!imported) return source;

    // ss is start of import statement
    // se is end of import statement
    // s is start of module path
    // e is end of module path
    // n is location
    // d > -1 means dynamic import
    // a is for assert
    const { ss, se, s, e, a, n } = imported;

    // GJS supports loading relative js paths
    // when importa.meta.url is a resource: uri
    // if (n.endsWith(".js")) return next(source);
    // but it would make way more complicated to
    // figure out a way to skip bundle imports
    // so we replace them with resource uris anyway
    // see commit da38c9430cfebdaa0b3e0021ac98eed966f09e9a

    let str = "";
    let resource_path = getPathForResource(n, source_file, resource_root);
    const imported_file = source_file.get_parent().resolve_relative_path(n);

    let type;
    if (a > -1) {
      const assert = source.slice(a, se);
      type = getAssertType(assert);
      if (!type) {
        throw new Error(`Invalid assert syntax "${assert}"`);
      }
    }

    if (!type && (n.endsWith(".js") || n.endsWith(".mjs"))) {
      str += source.slice(0, s);
      str += `resource://${GLib.build_filenamev([prefix, resource_path])}`;
      str += source.slice(e);

      // This is a duplicate import, it was already transformed
      if (resources.find(({ alias }) => alias === resource_path)) {
        return next(str);
      }

      const transformed = processSourceFile({
        resources,
        source_file: imported_file,
        prefix,
        resource_root,
        blueprint_compiler,
      });

      saveTransformed({
        resource_alias: resource_path,
        resources,
        transformed,
      });
    } else {
      const statement = source.slice(ss, se);
      let name = getImportName(statement);

      const resource = preprocess({
        imported_file,
        resource_path,
        blueprint_compiler,
      });

      const import_location = GLib.build_filenamev([
        prefix,
        resource.alias || resource.path,
      ]);

      let substitute;
      if (type === "json") {
        substitute = `JSON.parse(new TextDecoder().decode(imports.gi.Gio.resources_lookup_data("${import_location}", null).toArray()))`;
      } else if (type === "builder") {
        substitute = `imports.gi.Gtk.init() || imports.gi.Gtk.Builder.new_from_resource("${import_location}")`;
      } else if (type === "string") {
        substitute = `new TextDecoder().decode(imports.gi.Gio.resources_lookup_data("${import_location}", null).toArray())`;
      } else if (type === "bytes") {
        substitute = `imports.gi.Gio.resources_lookup_data("${import_location}", null)`;
        // Is there a use case for this?
        // } else if (type === "array") {
        //   from = `imports.gi.Gio.resources_lookup_data(${from}, null).toArray()`;
      } else if (type === "css") {
        // FIXME: does not work - load_from_Resource returns undefined
        substitute = `imports.gi.Gtk.init() || new imports.gi.Gtk.CssProvider().load_from_resource("${import_location}")`;
      } else if (type === "uri") {
        substitute = `"resource://${import_location}"`;
        // eslint-disable-next-line no-empty
      } else if (type === "resource" || !type) {
        substitute = `"${import_location}"`;
      } else if (type) {
        throw new Error(`Unsupported assert type "${type}"`);
      }

      str += source.slice(0, ss);
      str += name ? `const ${name} = ${substitute}` : substitute;
      str += source.slice(se);

      // Not a duplicate import
      if (!resources.find(({ path }) => path === resource.path)) {
        resources.push(resource);
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

function buildGresource({ prefix, resources, resource_root, output, appid }) {
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

  const gresource_path = output.get_child(`${appid}.gresource`).get_path();

  const [, stdout, stderr, status] = GLib.spawn_command_line_sync(
    `glib-compile-resources --target=${gresource_path} --sourcedir=${resource_root.get_path()} ${file.get_path()}`,
  );
  if (status !== 0) {
    throw new Error(decode(stderr));
  }

  console.debug("stdout: ", decode(stdout));

  return { gresource_path };
}

export function updatePotfiles({ potfiles, resources }) {
  const entries = readTextFileSync(potfiles)
    .split("\n")
    .map((entry) => entry.trim());

  resources.forEach(({ original, path, alias }) => {
    const location = original || alias || path;
    const [, , extension] = basename(location);
    if (
      !entries.includes(location) &&
      [".js", ".ui", ".blp"].includes(extension)
    ) {
      entries.push(location);
    }
  });

  writeTextFileSync(potfiles, entries.join("\n"));
}

export function build({ appid, entry, output, potfiles, resource_root, blueprint_compiler }) {
  const prefix = appIdToPrefix(appid);
  const relative_to = Gio.File.new_for_path(entry.get_path());

  const resources = [];

  const transformed = processSourceFile({
    resources,
    relative_to,
    resource_root,
    source_file: entry,
    prefix,
    blueprint_compiler,
  });

  const entry_alias = resource_root.get_relative_path(entry);
  saveTransformed({
    resource_alias: entry_alias,
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
    resource_root,
    resources,
    output,
    appid,
  });

  if (potfiles) {
    updatePotfiles({ potfiles, resources });
  }

  return {
    gresource_path,
    prefix,
    entry_resource_uri: `resource://${GLib.build_filenamev([
      prefix,
      entry_alias,
    ])}`,
  };
}
