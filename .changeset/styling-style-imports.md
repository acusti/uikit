---
'@acusti/styling': major
---

Render stylesheets from `?style` imports, and leave their text out of the
client bundle

`import sheet from './x.css?style'` with the new `@acusti/styling/vite`
plugin, then `<Style sheet={sheet} />`, renders the file as a hoisted
`<style>`. With the plugin’s `stripClientText` on, a client build leaves
the CSS text out: hydration adopts the server-rendered `<style>`, and a
sheet the page didn’t draw is fetched. `StyleProvider` names the document a
portalled subtree renders into and handles a failed fetch, and `StyleText`
renders CSS built at runtime under an href you give it.

Move static CSS strings into `.css` files imported with `?style`. For CSS
built at runtime, use `<StyleText href>`, and give it an href that changes
whenever the CSS does: React keeps the first text it inserts under an href,
so a fixed one freezes the first CSS. `StyleText` doesn’t minify, and
`minifyStyles` is gone. A library built with the plugin needs its own
`prefix` option, so its hrefs can’t collide with an app’s. The plugin needs
Vite 6 or later, and the components React 19.2 or later, below 20.
