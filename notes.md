Issues with GTK Builder UI

Was never meant to write by hand

- verbose
  - way too much indent
  - 90% more characters than what is needed
  - translatable="yes" all over
- need to escape various stuff
  - new line in GtkLabel `&#10;` instead of `\n`
  - `&lt;Primary&gt;Return` instead of `<Primary>Return`
- `id` is confusing, `#id` select does not work - only `#name`
