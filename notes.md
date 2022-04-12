# Pain points

## Resources

- Keep forgetting to add new `.js` files to `workbench.gresource.xml`
- Bundling/loading/using images/icons/... is a pain
- Loading `.ui` files is a pain

## GTKBuilder

Was never meant to write by hand

- verbose
  - way too much indent
  - 90% more characters than what is needed
  - translatable="yes" all over
- need to escape various stuff
  - new line in GtkLabel `&#10;` instead of `\n`
  - `&lt;Primary&gt;Return` instead of `<Primary>Return`
- `id` is confusing, `#id` select does not work - only `#name`

## menu/actions

hard to setup with variant and whatnot
