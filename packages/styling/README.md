# @acusti/styling

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/styling)](https://npmx.dev/package/@acusti/styling)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/styling)](https://npmx.dev/package/@acusti/styling)

Component stylesheets for a server-rendered React 19 app built with
[Vite][], without shipping each one twice.

```tsx
import { Style } from '@acusti/styling';

import sheet from './card.css?style';

export default function Card() {
    return (
        <>
            <Style sheet={sheet} />
            <div className="card">…</div>
        </>
    );
}
```

`<Style>` renders the sheet as a hoisted `<style>`: React puts it in the
`<head>` once, in render order among the sheets of its precedence. A server
render carries the CSS text in its HTML. With `stripClientText` on, the
client build leaves the text out of its JavaScript: on hydration React
adopts the `<style>` the server rendered, and a sheet the page didn’t draw
(a component that first appears on a client navigation) is fetched as a
`.css` file.

It was extracted from [Outlyne][], where it runs in production.

[vite]: https://vite.dev
[outlyne]: https://outlyne.com

## What it saves

Inlined CSS ships twice on a server-rendered page: once in the HTML and
again as strings in the JavaScript that hydrates it. On Outlyne’s published
pages, stripping that text took **41 KB gzip (10%)** off the JavaScript
each page preloads (410,618 → 369,325 bytes), and the lazy layout chunks
lost another 47 KB between them. Every element’s computed style and
full-page screenshots were identical before and after.

The runtime adds about 540 bytes gzip to a client bundle.

## Installation

```bash
npm install @acusti/styling
```

It needs React 19.2 or later (and below 20) and, for the plugin, Vite 6 or
later.

## Setup

Add the plugin to your Vite config. Turn on `stripClientText` only for an
app whose pages are all server-rendered by a build with the same plugin:

```ts
// vite.config.ts
import styleSheets from '@acusti/styling/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [styleSheets({ stripClientText: true })],
});
```

For the types of `?style` imports, add `@acusti/styling/client` to
`compilerOptions.types` in your `tsconfig.json`, or reference it from a
`.d.ts` file:

```ts
/// <reference types="@acusti/styling/client" />
```

### Plugin options

- **`prefix`** (string, default `''`): put ahead of every href. A library
  built with this plugin needs one, such as its package name
  (`@scope/ui/`), so its hrefs can’t match an app’s or another library’s
  (see [Caveats](#caveats)).
- **`root`** (string): the directory each sheet’s href is relative to,
  resolved against the Vite root, which it defaults to. The server and
  client builds must agree on it, since the client finds a server-rendered
  sheet by its href.
- **`stripClientText`** (boolean, default `false`): leave the CSS text out
  of the client build. It applies only to `vite build` in an environment
  whose consumer is the client; the server build and the dev server always
  keep the text.

## How a `?style` import works

`import sheet from './card.css?style'` gives a `StyleSheet`:

- **`{ href, css }`** in the server build, in dev, and in a client build
  without `stripClientText`. `css` is Vite’s own `?inline` output for the
  file, processed and minified as any inlined CSS is.
- **`{ href, url }`** in a client build with `stripClientText`. `url` is
  Vite’s `?url` asset of the same processed CSS.

The href is `prefix` and the file’s path from `root` (`src/card.css`), so
it is the same in every build and unique to the file within the build.

`<Style sheet={sheet} />` then finds the text in one of three places:

1. **The sheet**, when it carries `css`.
2. **The document**, when a server render already put the sheet there.
   React adopts a hoisted `<style>` whose `data-href` lists the href and
   never reads the children, so `<Style>` renders it without any. A server
   render merges the sheets of each precedence into one `<style>`, and the
   client never needs to split it.
3. **The sheet’s `.css` asset**, fetched otherwise. The render suspends
   until it arrives, then the text goes in as a `<style>`, in render order.
   A `<link rel="stylesheet">` would not keep that order: React inserts a
   new `<link>` ahead of every `<style>` new in the same commit.

A fetch is made once per URL. One that fails leaves the content unstyled
rather than throwing to an error boundary, calls the `onError` handler, and
is not retried, so a sheet a deploy removed isn’t asked for on every
render.

In dev, each `?style` module accepts updates to its CSS file and swaps the
new text into the `<style>` that holds it, in the page and in same-origin
iframes, since React never updates the text of a hoisted `<style>` it has
already inserted.

## API

### `Style`

```ts
type StyleProps = {
    precedence?: string; // defaults to 'medium'
    sheet: StyleSheet; // a ./x.css?style import
};
```

### `StyleProvider`

Tells each `<Style>` below it which document it renders into and what to do
when a stripped sheet fails to load. Each prop it leaves out comes from the
provider above it.

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

- **`document`**: the document the subtree renders into, for content
  portalled into an iframe. A sheet the page has but the frame lacks is
  then fetched for the frame. Context passes through portals, so a portal
  from the frame back into the page needs a provider of its own.
- **`onError`**: called once for each sheet whose text fails to load.
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

### `StyleText`

Renders CSS generated at runtime as a hoisted `<style>`, among the sheets
of its precedence in render order. It is a separate export, so a bundle
that doesn’t use it leaves it out.

```tsx
import { StyleText } from '@acusti/styling';

<StyleText href={`theme-${theme.id}`}>
    {`:root { --accent: ${theme.accent}; }`}
</StyleText>;
```

React keeps one stylesheet per href and never updates its text, so CSS that
changes needs an href that changes with it. A server render may merge
several into one `<style>`, listing every href in its `data-href`. The href
is URI-encoded, since React can’t hydrate a hoisted `<style>` whose href
has a space.

### `SYSTEM_UI_FONT`

A cross-platform system UI font stack, for `font-family`.

## Caveats

- **The server must render with the same plugin.** A stripped client finds
  a sheet’s text in the server-rendered HTML, so every page it hydrates
  must have been rendered by a build that uses this plugin with the same
  `root`. A sheet missing from the HTML still works, at the cost of a
  fetch. A client-rendered app gains nothing from stripping: every sheet
  would be fetched.
- **A fetch suspends.** Render a component whose sheet may be fetched in a
  transition (as router navigations are) or below a `<Suspense>` boundary,
  as you would a lazy component.
- **A fetched sheet costs a round trip.** A sheet the page lacks is
  requested only once the component that renders it does, after its chunk
  loads.
- **It relies on how React handles resources.** That hydration adopts a
  server-rendered `<style>` by `data-href` without reading its children,
  and that a fetched sheet’s `<style>` goes into the `<head>` in render
  order, are React behaviour, not documented API. The package’s tests check
  both, and CI runs them against React canary to catch a change before a
  release ships it.
- **Hrefs must be unique across a document, not just a build.** React keeps
  one stylesheet per href, and `<Style>` takes any `<style>` that lists its
  href as the sheet already being there. So when separately built bundles
  render into one document (an app and a component library built with this
  plugin, two such libraries, or a host page and an embedded widget), two
  files at the same relative path collide: the second sheet is dropped, or,
  stripped, never fetched. Give each library its own `prefix`.
- **Hrefs are file paths.** Each one appears in the server-rendered HTML,
  so a deep path costs a few bytes per sheet.

## Upgrading from v2

v3 is a new API. `<Style>` takes a `sheet` from a `?style` import instead
of a CSS string as `children`. Move static CSS strings into `.css` files.
For CSS built at runtime, use `<StyleText>`, and give it an href that
changes whenever the CSS does: v2 derived an href from the CSS, but React
keeps the first text it inserts under an href, so a fixed one freezes the
first CSS. `minifyStyles` is gone: Vite minifies `?style` imports, and
`StyleText` renders its CSS as given.
