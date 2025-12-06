// import { readFileSync } from "fs";
import { join, extname, resolve, basename } from "path";
// import { createFilter } from "@rollup/pluginutils";

// const defaults = {};

function codeTemplate({ id }) {
  return `
    export default "${id}";
    `;
}

const codeTemplates = {
  uri: ({ url }) => `
  export default "resource://${url}"
  `,
  json: ({ url }) => {
    return `
      export default JSON.parse(new TextDecoder().decode(imports.gi.Gio.resources_lookup_data("${url}", null).toArray()))
      `;
  },
  string: ({ url }) => `
    export default new TextDecoder().decode(imports.gi.Gio.resources_lookup_data("${url}", null).toArray())
  `,
  css: ({ url }) => `
  (() => { imports.gi.Gtk.init(); const provider = new imports.gi.Gtk.CssProvider(); provider.load_from_resource("${url}"); return provider; })()
  `,
  icon: ({ url }) => {
    const icon_name = basename(url.pathname);
    // const [file_name, icon_name] = basename(resource.path);
    // resource.prefix = GLib.build_filenamev([prefix, "icons/scalable/actions"]);
    // resource.alias = file_name;
    return `export default "${icon_name}"`;
  },
  bytes: ({ url }) => `
  export default imports.gi.Gio.resources_lookup_data("${url}", null)
  `,
  resource: ({ url }) => `
  export default "${url}"`,
  filename: ({ url }) => ``,
};

export default function gjspack(/*opts = {}*/) {
  // const options = Object.assign({}, defaults, opts);
  // const filter = createFilter(options.include, options.exclude);

  return {
    name: "gjspack",

    resolveId(source, importer, options) {
      console.log(source, importer, options);
      if (
        [
          "uri",
          "json",
          "string",
          "css",
          "icon",
          "bytes",
          "resource",
          "filename",
        ].includes(options.attributes.type)
      ) {
        const url = new URL("file:///");
        url.pathname = resolve(importer, "..", source);
        url.search = `?gjspack=${options.attributes.type}`;
        return url.toString();
      }
      return null; // other ids should be handled as usually
    },

    load(id) {
      console.log("id", id);

      // console.log(...args, this);
      // if (!filter(id)) {
      //   return null;
      // }

      if (extname(id) === ".js") return null;

      // const ext =
      // const mime = mimeTypes[extname(id)];
      // if (!mime) {
      //   // not an image
      //   return null;
      // }
      //
      let url;
      try {
        url = new URL(id);
      } catch {
        return null;
      }

      console.log(url);

      const pathname = url.pathname;

      console.log(gjspack);
      this.addWatchFile(pathname);
      // const isSvg = mime === mimeTypes[".svg"];
      // const format = isSvg ? "utf-8" : "base64";
      // const source = readFileSync(id, format).replace(/[\r\n]+/gm, "");
      // const dataUri = getDataUri({ format, isSvg, mime, source });
      // const code = options.dom
      //   ? domTemplate({ dataUri })
      //   : constTemplate({ dataUri });

      // return "youi";
      //
      const code = codeTemplates[url.searchParams.gjspack]?.({ id });
      return code?.trim() || null;

      // return code.trim();
    },

    // transform(code, id) {
    //   console.log({ code, id });
    //   // if (filter(id)) {
    //   //   return {
    //   //     code: `export default ${JSON.stringify(code)};`,
    //   //     map: { mappings: "" }
    //   //   };
    //   // }
    // },

    // load(id) {
    //   if (id === "virtual-module") {
    //     // the source code for "virtual-module"
    //     return 'export default "This is virtual!"';
    //   }
    //   return null; // other ids should be handled as usually
    // },
  };
}
