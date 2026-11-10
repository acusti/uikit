# @acusti/styling

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![minzip size](https://bundlebadge.acusti.ca/minzip/@acusti/styling)](https://bundlebadge.acusti.ca/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/styling)](https://npmx.dev/package/@acusti/styling)

Colocated component styles for a server-rendered React 19 app built with
[Vite][], without duplicating them in your JS bundle.

```tsx
import { Style } from '@acusti/styling';

import cardSheet from './card.css?sheet';

export default function Card() {
    return (
        <>
            <Style sheet={cardSheet} />
            <div className="card">…</div>
        </>
    );
}
```

`<Style>` renders the sheet as a `<style>` element that React hoists into
the `<head>` and de-duplicates across all instances of that sheet, in
render order alongside the other sheets with the same precedence. A server
render carries the CSS text in its HTML, and with `stripClientCSS` on, the
client build leaves the text out of the JS bundle. On hydration, React
adopts the `<style>` the server rendered, and with stripping, a sheet the
page didn’t render initially (e.g. a component that first appears on a
client navigation) is fetched as a `.css` file.

It was extracted from [Outlyne][], where it runs in production.

[vite]: https://vite.dev
[outlyne]: https://outlyne.com

## What it saves

Inlined CSS ships twice on a server-rendered page: once in the HTML and
again as strings in the JavaScript that hydrates it. On Outlyne’s published
pages, stripping that text took **41 KB gzip** off the JavaScript each page
preloads, and another 47 KB gzip off the lazy layout chunks. Every
element’s computed style and full-page screenshots were identical before
and after.

The runtime adds about 540 bytes gzip to a client bundle.

## Installation

```bash
npm install @acusti/styling
```

It needs React 19.2 or later and, for the plugin, Vite 6 or later.

## Setup

Add the plugin to your Vite config. Turn on `stripClientCSS` for an app
whose pages are all server-rendered:

```ts
// vite.config.ts
import styleSheets from '@acusti/styling/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [styleSheets({ stripClientCSS: true })],
});
```

To get the TypeScript types of `?sheet` imports, add
`@acusti/styling/client` to `compilerOptions.types` in your
`tsconfig.json`, or reference it from a `.d.ts` file:

```ts
/// <reference types="@acusti/styling/client" />
```

### Plugin options

- **`prefix`** (string, default `''`): put ahead of every href. A library
  built with this plugin needs one, such as its package name
  (`@scope/ui/`), so its hrefs can’t match an app’s or another library’s
  (see [Caveats](#caveats)).
- **`root`** (string): the directory each sheet’s href is relative to,
  resolved against the Vite root (the default). Left out, a sheet’s href is
  its path from the Vite root, e.g. `src/card.css`. The server and client
  builds must agree on it, since the client finds a server-rendered sheet
  by its href.
- **`stripClientCSS`** (boolean, default `false`): leave the CSS text out
  of the client build. It applies only to `vite build` in an environment
  whose consumer is the client; the server build and the dev server always
  keep the text.

## How a `?sheet` import works

`import cardSheet from './card.css?sheet'` gives a `StyleSheet`:

- **`{ href, css }`** in the server build, in dev, and in a client build
  without `stripClientCSS`. `css` is Vite’s own `?inline` output for the
  file, processed and minified as any inlined CSS is.
- **`{ href, url }`** in a client build with `stripClientCSS`. `url` is
  Vite’s `?url` asset of the same processed CSS.

The href is `prefix` and the file’s path from `root` (`src/card.css`), so
it is the same in every build and unique to the file within the build.

`<Style sheet={cardSheet} />` then finds the text in one of three places:

1. **The sheet** when it carries `css`.
2. **The document** when a server render already put the sheet there. React
   adopts a hoisted `<style>` whose `data-href` lists the href and never
   reads the children, so `<Style>` renders it without any. A server render
   merges the sheets of each precedence into one `<style>`, and the client
   never needs to split it.
3. **The sheet’s `.css` asset,** fetched if not available in those first
   two places. The render suspends until it arrives, then the text goes in
   as a `<style>`, in render order.

A fetch is made once per URL. One that fails leaves the content unstyled
(rather than throwing to an error boundary), calls the `onError` handler,
and is not retried, so a sheet a deploy removed isn’t asked for on every
render.

In dev, each `?sheet` module gets Hot Module Replacement: it accepts
updates to its CSS file and swaps the new contents into the `<style>` that
holds them (including in same-origin iframes). Without it, an edit only
shows after a reload, since React never updates the text of a hoisted
`<style>` it has already rendered.

## API

### `Style`

```ts
type StyleProps = {
    precedence?: string; // defaults to 'medium'
    sheet: StyleSheet; // a ./x.css?sheet import
};
```

### `StyleProvider`

Tells each `<Style>` below it which document it renders into and what to do
when a stripped sheet fails to load. Each prop it leaves out comes from its
parent provider.

```ts
type StyleProviderProps = {
    children?: ReactNode;
    document?: Document;
    onError?: (
        error: unknown,
        sheet: { readonly href: string; readonly url: string },
    ) => void;
};
```

- **`document`:** the document the subtree renders into, for content
  portalled into an iframe. A sheet the page has but the frame lacks is
  then fetched for the frame. A provider covers its whole React subtree,
  portals included, so content in the frame that portals back out to the
  page (e.g. a popover in the page’s `<body>`) needs a provider of its own
  with the page’s `document`.
- **`onError`:** called once for each sheet whose text fails to load.
  Defaults to [`reportError`][reporterror], which logs it as an uncaught
  error and passes it to any `error` event listener, such as an error
  monitor’s.

[reporterror]:
    https://developer.mozilla.org/docs/Web/API/Window/reportError

```tsx
import { StyleProvider } from '@acusti/styling';
import { type ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';

function Frame({ children }: { children: ReactNode }) {
    const [body, setBody] = useState<HTMLElement | null>(null);
    return (
        <>
            {body == null
                ? null
                : createPortal(
                      <StyleProvider document={body.ownerDocument}>
                          {children}
                      </StyleProvider>,
                      body,
                  )}
            <iframe
                onLoad={(event) =>
                    setBody(
                        event.currentTarget.contentDocument?.body ?? null,
                    )
                }
                srcDoc="<!doctype html><html><head></head><body></body></html>"
                title="preview"
            />
        </>
    );
}
```

### `RuntimeStyle`

For CSS you can only build while the app runs, e.g. from a user’s theme or
a component’s props. Anything you can write in a `.css` file belongs in a
`<Style>`: the plugin sees it at build time, so it minifies the text, names
the sheet after its path and, with `stripClientCSS`, keeps the text out of
client JavaScript. None of that happens here: `RuntimeStyle` renders its
CSS as given, and the text ships in client JavaScript like any other
string. Like a `<Style>`, it renders a `<style>` that React hoists into the
`<head>` and de-duplicates across all instances with the same href, in
render order among the other sheets with the same precedence. If it isn’t
used, it will be tree-shaken out of the JS bundle.

```tsx
import { RuntimeStyle } from '@acusti/styling';

<RuntimeStyle href={`theme-${theme.id}`}>
    {`:root { --accent: ${theme.accent}; }`}
</RuntimeStyle>;
```

React keeps one stylesheet per href and never updates its text, so CSS that
changes needs an href that changes with it. A server render merges the
sheets of each precedence into one `<style>`, listing their hrefs in its
`data-href` separated by spaces, so the href is URI-encoded: React can’t
hydrate a hoisted `<style>` whose href has a space.

## Caveats

- **The server must render with the same plugin.** A stripped client finds
  a sheet’s text in the server-rendered HTML, so every page it hydrates
  must have been rendered by a build that uses this plugin with the same
  `root`. Any sheet missing from the server-provided HTML is individually
  fetched, which also applies for a client-only app.
- **A fetch suspends.** Render a component whose sheet may be fetched in a
  transition (e.g. from a router navigation) or below a `<Suspense>`
  boundary, as you would a lazy component.
- **A fetched sheet waits on its chunk.** Its request starts only once the
  component that renders it does, after the component’s chunk has loaded,
  so a client navigation to that component takes one round trip more than
  loading the chunk alone.
- **It relies on how React handles resources.** In React, hydration adopts
  a server-rendered `<style>` by `data-href` without reading its children,
  and a fetched sheet’s `<style>` goes into the `<head>` in render order.
  Neither is documented API, and if either changed, this package wouldn’t
  work properly, so the package’s tests check both, and CI runs them
  against React canary to catch a change before a release ships it.
- **Hrefs must be unique across a document, not just a build.** React keeps
  one stylesheet per href, and `<Style>` takes any `<style>` that lists its
  href as the sheet already being there. So when separately built bundles
  render into one document (an app and a component library built with this
  plugin, two such libraries, or a host page and an embedded widget), two
  files at the same relative path collide, and only the first one’s CSS
  ever reaches the page. Give each library its own `prefix`.

## Upgrading from v2

v3 is a clean break from v2. `<Style>` takes a `sheet` from a `?sheet`
import instead of a CSS string as `children`. Move static CSS strings into
`.css` files. For CSS built at runtime, use `<RuntimeStyle>`, and give it
an href that changes whenever the CSS does: v2 derived an href from the
CSS, but React keeps the first text it inserts under an href, so a fixed
one freezes the first CSS. v3 removes `minifyStyles`, since Vite minifies
`?sheet` imports and `RuntimeStyle` renders its CSS as given, and
`SYSTEM_UI_FONT`. If you used it, inline its value:
`system-ui, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, Helvetica, Arial, sans-serif`.
