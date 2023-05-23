// Reference
// https://github.com/WICG/import-maps
// https://deno.com/manual/basics/import_maps

import { readTextFileSync } from "./utils.js";
import Gio from "gi://Gio";

// TODO: add support for scopes

export function makeImportMap() {
  return {
    imports: {},
    scopes: {},
  };
}

// relative paths in the import map should be relative to the import map file itself
// https://deno.com/manual/basics/import_maps#example---using-project-root-for-absolute-imports
export function expandRelativePaths(import_map, containing_folder) {
  for (const [k, v] of Object.entries(import_map.imports)) {
    const ends_with_slash = v.endsWith("/");
    if (v.startsWith("./") || v.startsWith("../")) {
      import_map.imports[k] = containing_folder
        .resolve_relative_path(v)
        .get_path();
      if (ends_with_slash) {
        import_map.imports[k] += "/";
      }
    } else if (v.startsWith("file:///./") || v.startsWith("file:///../")) {
      import_map.imports[k] = `file://${containing_folder
        .resolve_relative_path(v.substring(8))
        .get_path()}`;
      if (ends_with_slash) {
        import_map.imports[k] += "/";
      }
    } else {
      import_map.imports[k] = v;
    }
  }
  return import_map;
}

export function makeFromContent(content, containing_folder) {
  const parsed = JSON.parse(content);
  const withDefault = Object.assign(makeImportMap(), parsed);

  const expanded = expandRelativePaths(withDefault, containing_folder);
  return expanded;
}

export function makeFromFile(file) {
  return makeFromContent(
    file ? readTextFileSync(file) : "{}",
    file?.get_parent() ?? Gio.File.new_for_path("/"),
  );
}

export function rewriteImport({ imports }, source, parse_info) {
  // ss is start of import statement
  // se is end of import statement
  // s is start of module path
  // e is end of module path
  // n is location
  // d > -1 means dynamic import
  // a is for assert
  const { ss, se, s, e, n: location } = parse_info;

  // statement
  const stmt = source.substring(ss, se);
  if (!location) return stmt;

  let new_stmt = "";
  new_stmt += stmt.substring(0, s - ss);

  const proto = location.indexOf("://");
  const folder_end_index = location.indexOf("/");

  if (folder_end_index > proto + 2) {
    const folderPath = location.substring(0, folder_end_index + 1);

    for (const [from, to] of Object.entries(imports)) {
      if (from === folderPath) {
        new_stmt += to;
        new_stmt += location.substring(folder_end_index + 1);
        new_stmt += stmt.substring(e - ss);
        return new_stmt;
      }
    }
    return stmt;
  } else {
    const mapped = imports[location];
    if (!mapped) return stmt;

    new_stmt += mapped;
    new_stmt += stmt.substring(e - ss);
    return new_stmt;
  }
}
