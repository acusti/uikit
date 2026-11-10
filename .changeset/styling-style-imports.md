---
'@acusti/styling': major
---

Render stylesheets from `?sheet` imports, optionally leaving their text out
of the client JS bundle

Using the `@acusti/styling/vite` plugin, you can
`import x from './x.css?sheet'` and render it with `<Style sheet={x} />` as
a hoisted `<style>` element. Each sheet goes through Vite’s CSS pipeline
like any other CSS import, with your PostCSS or Lightning CSS config, and
is minified in a build. If your app is server-rendered and you use the
plugin’s `stripClientCSS` option, the client JS build won’t duplicate the
CSS content. Instead, hydration uses the server-rendered `<style>` element
to derive the CSS content for each sheet. Sheets that weren’t server-side
rendered are fetched. `StyleProvider` names the document a portalled
subtree renders into and handles a failed fetch, and `RuntimeStyle` renders
CSS built at runtime under an `href` you give it.

Move static CSS strings into `.css` files imported with `?sheet`. For CSS
built at runtime, use `<RuntimeStyle href>`, and give it an `href` that
changes whenever the CSS does. React keeps the first text it inserts under
an `href`, so a fixed one freezes that initial CSS. To use the plugin in a
library, use the `prefix` option so its hrefs can’t collide with an app’s.
The plugin needs Vite 6 or later, while the components need React 19.2 or
later.

**Removed:** `minifyStyles`, and `SYSTEM_UI_FONT`; if you used it, inline
its value:
`system-ui, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, Helvetica, Arial, sans-serif`.
