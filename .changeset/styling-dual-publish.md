---
'@acusti/styling': minor
---

Publish a component library that works with or without `@acusti/styling`

A component library can import its sheets with `?sheet`, render them with
`<Style>`, and publish two builds with the plugin’s new `library` option.
The default build renders plain `<style>` elements and imports nothing from
`@acusti/styling`, so it works in any React 19 app. The raw build,
published under the `acusti-styling` export condition, is the one the
client of a Vite app with the plugin loads, so the app’s `stripClientCSS`
strips the library’s CSS like its own. The README’s “Building a component
library” section has the build config and the manifest.
