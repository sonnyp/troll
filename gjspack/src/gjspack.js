import Gio from "gi://Gio";
import GLib from "gi://GLib";

import * as lexer from "../lib/lexer.asm.js";
import { createElement as xml } from "../lib/ltx.js";
import {
  decode,
  appIdToPrefix,
  readTextFileSync,
  writeTextFileSync,
  basename,
} from "./utils.js";

import system from "system";

export function getPathForResource(
  module_path,
  // The file which imports module_path
  relative_to,
  resource_root,
) {
  const module_file = relative_to
    .get_parent()
    .resolve_relative_path(module_path);

  const relative_path = resource_root.get_relative_path(module_file);

  return (
    relative_path ||
    // If the module is outside of the source tree
    // return an absolute path
    module_file.get_path()
  );
}

// glib-compile-resource require the file to exist on disk
// so we have to save the transformed source in a temporary file
function saveTransformed({ resource_alias, transformed }) {
  const [transfomed_file] = Gio.File.new_tmp("gjspack-XXXXXX.js");
  transfomed_file.replace_contents(
    transformed, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null, // cancellable
  );

  return { path: transfomed_file.get_path(), alias: resource_alias };
}

export function isBundableImport(imported) {
  const { n: location } = imported;
  if (!location) return false;
  if (location.startsWith("gi:")) return false;
  if (location.startsWith("resource:")) return false;
  if (!location.startsWith(".") && !location.startsWith("/")) return false;
  return true;
}

export function getAssertType(assert) {
  const normalized = assert.replace(/\s/g, "").replace(/'/g, '"');
  return normalized.match(/type:"([^"]+)"/)?.[1] || null;
}

export function getImportName(statement) {
  const match = statement.match(/^import (\w+) from/);
  return match?.[1];
}

function transform({ imported_file, resource_path, transformer }) {
  const { command, extension = "" } = transformer;

  const [file, stream] = Gio.File.new_tmp(`gjspack-XXXXXX.ui`);

  const [, command_argv] = GLib.shell_parse_argv(command);

  const proc = Gio.Subprocess.new(
    [...command_argv, imported_file.get_path()],
    Gio.SubprocessFlags.STDOUT_PIPE,
  );

  stream
    .get_output_stream()
    .splice(
      proc.get_stdout_pipe(),
      Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
      null,
    );

  proc.wait(null);
  if (!proc.get_successful()) {
    system.exit(1);
  }

  return {
    alias: `${resource_path}${extension}`,
    path: file.get_path(),
    original: resource_path,
  };
}

function preprocess({ imported_file, resource_path, transforms = [] }) {
  const file_name = imported_file.get_basename();

  let result = {
    path: resource_path,
    alias: null,
  };

  for (const transformer of transforms) {
    if (!file_name.match(transformer.test)) continue;
    result = transform({
      imported_file,
      resource_path: result.path,
      transformer,
    });
  }

  return result;
}

// fun is a function that takes an import statement description, as `{ss, se , s, e, a, n, d}`, 
// and returns a new import statement string
export function rewriteImports(source, fun) {
  const [imports] = lexer.parse(source);
  let str = "";
  let prev_end = 0;

  for (let i = 0; i < imports.length; i++) {
    const { ss, se } = imports[i];
    const new_statement = fun(source, imports[i]);

    str += source.substring(prev_end, ss);
    str += new_statement;

    prev_end = se;
  }
  str += source.substring(prev_end);
  return str;
}

// https://github.com/WICG/import-maps
export function rewriteImportWithMap(import_map, source, imported) {
  // ss is start of import statement
  // se is end of import statement
  // s is start of module path
  // e is end of module path
  // n is location
  // d > -1 means dynamic import
  // a is for assert
  const { ss, se, s, e, n: location } = imported;

  const stmt = source.substring(ss, se);
  if (!location) return stmt;

  let new_stmt = "";
  new_stmt += stmt.substring(0, s - ss);

  const proto = location.indexOf("://");
  const folder_end_index = location.indexOf("/");

  if (folder_end_index > proto + 2) {
    const folderPath = location.substring(0, folder_end_index + 1);

    for (const [from, to] of Object.entries(import_map)) {
      if (from === folderPath) {
        new_stmt += to;
        new_stmt += location.substring(folder_end_index + 1);
        new_stmt += stmt.substring(e - ss);
        return new_stmt;
      }
    }
    return stmt;
  } else {
    const mapped = import_map[location];
    if (!mapped) return stmt;

    new_stmt += mapped;
    new_stmt += stmt.substring(e - ss);
    return new_stmt;
  }
}

export function processSourceFile({
  resources,
  source_file,
  resource_root,
  project_root,
  prefix,
  transforms,
  import_map = {},
}) {
  const [, contents] = source_file.load_contents(null);
  const source = decode(contents);

  const mapped_source = rewriteImports(source, (source, imported) =>
    rewriteImportWithMap(import_map, source, imported));
  const transformed = rewriteImports(mapped_source, (source, imported) => {
    // ss is start of import statement
    // se is end of import statement
    // s is start of module path
    // e is end of module path
    // n is location
    // d > -1 means dynamic import
    // a is for assert
    const { ss, se, s, e, a, n, d } = imported;

    // statement
    const stmt = source.substring(ss, se);
    if (!isBundableImport(imported)) return stmt;


    // GJS supports loading relative js paths
    // when importa.meta.url is a resource: uri
    // if (n.endsWith(".js")) return next(source);
    // but it would make way more complicated to
    // figure out a way to skip bundle imports
    // so we replace them with resource uris anyway
    // see commit da38c9430cfebdaa0b3e0021ac98eed966f09e9a

    let new_stmt = "";
    const resource_path = getPathForResource(n, source_file, resource_root);
    const imported_file = source_file.get_parent().resolve_relative_path(n);

    let type;
    let resource;

    if (a > -1) {
      const assert = source.slice(a, se);
      type = getAssertType(assert);
      if (!type) {
        throw new Error(`Invalid assert syntax "${assert}"`);
      }
    }

    if (!type && (n.endsWith(".js") || n.endsWith(".mjs"))) {
      new_stmt += stmt.slice(0, s - ss);
      if (d > -1) new_stmt += '"';
      new_stmt += `resource://${GLib.build_filenamev([prefix, resource_path])}`;
      if (d > -1) new_stmt += '"';
      new_stmt += stmt.slice(e - ss);


      const was_transformed = resources.find(({ alias }) => alias === resource_path);
      if (was_transformed) {
        return new_stmt;
      }
      const transformed = processSourceFile({
        resources,
        source_file: imported_file,
        prefix,
        resource_root,
        project_root,
        transforms,
        import_map,
      });

      resource = saveTransformed({
        resource_alias: resource_path,
        resources,
        transformed,
      });
    } else {
      const name = getImportName(stmt);

      resource = preprocess({
        imported_file,
        resource_path,
        project_root,
        transforms,
      });

      const import_location = GLib.build_filenamev([
        prefix,
        resource.alias || resource.path,
      ]);

      let substitute;
      if (type === "json") {
        substitute = `JSON.parse(new TextDecoder().decode(imports.gi.Gio.resources_lookup_data("${import_location}", null).toArray()))`;
      } else if (type === "builder") {
        substitute = `(() => { imports.gi.Gtk.init(); return imports.gi.Gtk.Builder.new_from_resource("${import_location}") })()`;
      } else if (type === "string") {
        substitute = `new TextDecoder().decode(imports.gi.Gio.resources_lookup_data("${import_location}", null).toArray())`;
      } else if (type === "bytes") {
        substitute = `imports.gi.Gio.resources_lookup_data("${import_location}", null)`;
        // Is there a use case for this?
        // } else if (type === "array") {
        //   from = `imports.gi.Gio.resources_lookup_data(${from}, null).toArray()`;
      } else if (type === "css") {
        substitute = `(() => { imports.gi.Gtk.init(); const provider = new imports.gi.Gtk.CssProvider(); provider.load_from_resource("${import_location}"); return provider; })()`;
      } else if (type === "uri") {
        substitute = `"resource://${import_location}"`;
        // eslint-disable-next-line no-empty
      } else if (type === "resource" || !type) {
        substitute = `"${import_location}"`;
      } else if (type === "icon") {
        const [file_name, icon_name] = basename(resource.path);
        substitute = `"${icon_name}"`;
        resource.prefix = GLib.build_filenamev([
          prefix,
          "icons/scalable/actions",
        ]);
        resource.alias = file_name;
      } else if (type) {
        throw new Error(`Unsupported assert type "${type}"`);
      }

      new_stmt = name ? `const ${name} = ${substitute}` : substitute;
    }

    const project_path = project_root.get_relative_path(imported_file);
    resource.project_path = project_path;

    // Not a duplicate import
    if (!resources.find(({ path }) => path === resource.path)) {
      resources.push(resource);
    }

    return new_stmt;
  });

  console.debug("transformed\n", transformed);

  // Strings are null terminated, if we pass an empty string, we get the following error
  // GLib-GIO-CRITICAL **: 18:38:40.267: g_file_replace_contents: assertion 'contents != NULL' failed
  return transformed || "\n";
}

function buildGresource({
  prefix: base_prefix,
  resources,
  resource_root,
  output,
  appid,
}) {
  const root = xml("gresources", {});

  resources.forEach((resource) => {
    const prefix = resource.prefix || base_prefix;
    let el = root.getChildByAttr("prefix", prefix);
    if (!el) {
      el = xml("gresource", { prefix });
      root.append(el);
    }

    el.append(xml("file", { alias: resource.alias }, resource.path));
  });

  const gresource_xml = `<?xml version="1.0" encoding="UTF-8" ?>${root.toString()}`;

  console.debug(`gresource_xml\n${gresource_xml}`);

  const [file] = Gio.File.new_tmp("gjspack-XXXXXX.gresource.xml");
  file.replace_contents(
    gresource_xml, // contents
    null, // etag
    false, // make_backup
    Gio.FileCreateFlags.NONE, // flags
    null,
  );

  const gresource_path = output.get_child(`${appid}.src.gresource`).get_path();

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
  const str = readTextFileSync(potfiles);
  const entries = str.split("\n").map((entry) => entry.trim());

  let changed = false;
  resources.forEach(({ project_path }) => {
    if (!project_path) return;

    const [, , extension] = basename(project_path);
    if (![".js", ".ui", ".blp"].includes(extension)) return;

    if (str.match(new RegExp(`^#? *${project_path}`, "m"))) return;

    entries.push(project_path);
    changed = true;
  });

  if (changed) {
    writeTextFileSync(potfiles, entries.join("\n"));
  }
}

export function build({
  appid,
  prefix,
  entry,
  output,
  potfiles,
  resource_root = Gio.File.new_for_path(GLib.get_current_dir()),
  project_root = Gio.File.new_for_path(GLib.get_current_dir()),
  blueprint_compiler = "blueprint-compiler",
  transforms,
  import_map = {},
}) {
  transforms ??= [
    {
      test: /\.blp$/,
      command: `${blueprint_compiler} compile`,
      extension: ".ui",
    },
  ];

  prefix = prefix || appIdToPrefix(appid);
  const relative_to = Gio.File.new_for_path(entry.get_path());

  const resources = [];

  const transformed = processSourceFile({
    resources,
    relative_to,
    resource_root,
    project_root,
    source_file: entry,
    prefix,
    transforms,
    import_map
  });

  const entry_alias = resource_root.get_relative_path(entry);
  const resource = saveTransformed({
    resource_alias: entry_alias,
    resources,
    transformed,
  });
  resource.project_path = project_root.get_relative_path(entry);
  resources.push(resource);

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
