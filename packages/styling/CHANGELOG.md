# @acusti/styling

## 3.0.0-rc.0

### Major Changes

- dd9b9f9: Render stylesheets from `?sheet` imports, optionally leaving
  their text out of the client JS bundle

    Using the `@acusti/styling/vite` plugin, you can
    `import x from './x.css?sheet'` and render it with
    `<Style sheet={x} />` as a hoisted `<style>` element. Each sheet goes
    through Vite’s CSS pipeline like any other CSS import, with your
    PostCSS or Lightning CSS config, and is minified in a build. If your
    app is server-rendered and you use the plugin’s `stripClientCSS`
    option, the client JS build won’t duplicate the CSS content. Instead,
    hydration uses the server-rendered `<style>` element to derive the CSS
    content for each sheet. Sheets that weren’t server-side rendered are
    fetched. `StyleProvider` names the document a portalled subtree renders
    into and handles a failed fetch, and `RuntimeStyle` renders CSS built
    at runtime under an `href` you give it.

    Move static CSS strings into `.css` files imported with `?sheet`. For
    CSS built at runtime, use `<RuntimeStyle href>`, and give it an `href`
    that changes whenever the CSS does. React keeps the first text it
    inserts under an `href`, so a fixed one freezes that initial CSS. To
    use the plugin in a library, use the `prefix` option so its hrefs can’t
    collide with an app’s. The plugin needs Vite 6 or later, while the
    components need React 19.2 or later.

    **Removed:** `minifyStyles`, and `SYSTEM_UI_FONT`; if you used it,
    inline its value:
    `system-ui, Segoe UI, Roboto, Oxygen-Sans, Ubuntu, Cantarell, Helvetica Neue, Helvetica, Arial, sans-serif`.

## 2.1.5

### Patch Changes

- e1af9d3: Require React 19.2 or later in the `react` and `react-dom` peer
  ranges

    `useStyles` (and so `Style`) has called React’s `useEffectEvent` since
    2.1.1, but stable React only exports that hook from 19.2 onward, while
    the peer ranges still accepted React 19.1.x and 19.0.x.

## 2.1.4

### Patch Changes

- f329612: Rebuild with a new React Compiler toolchain

    The published build now runs through a different React Compiler
    toolchain internally. Output is verified equivalent to the previous
    build: React Compiler memoization is unchanged, with zero compiler
    bailouts. No API or behavior changes.

## 2.1.3

### Patch Changes

- f86e693: Rebuild with the modernized build pipeline

    The published artifacts are now built with @vitejs/plugin-react v6 (oxc
    JSX transform) with the React Compiler applied via
    @rolldown/plugin-babel and `reactCompilerPreset`, replacing the
    previous plugin-react v5 Babel pipeline; type declarations are emitted
    by the native TypeScript 7 compiler instead of unplugin-dts. Output is
    verified equivalent: React Compiler memoization is present with zero
    compiler bailouts, and declarations are unchanged apart from preserving
    inline `type` qualifiers on imports. No API or behavior changes.

## 2.1.2

### Patch Changes

- f15b75d: Modernize the font stack for the SYSTEM_UI_FONT constant

## 2.1.1

### Patch Changes

- f69a491: Extract useEffect logic into useEffectEvent handler to resolve
  react-hooks/set-state-in-effect linting error

## 2.1.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

## 2.0.1

### Patch Changes

- ad59acd: Strip spaces out of the auto-generated `href` prop for `<style>`
  elements to prevent hydration mismatch failures on the client.

## 2.0.0

### Major Changes

- d328a73: Adapt package to use react-compiler as part of vite build
  process and to remove all manual memoization. Also includes some small
  changes to strictly follow react-compiler’s rules of react and to
  workaround as-of-yet unimplemented features involving mutating
  destructured component props and the nullish coalescing assignment
  operator.

    **Note:** this is a breaking change because the packages now depend on
    react v19+ and are no longer compatible with anything before the
    introduction of the react/compiler-runtime.

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

## 1.1.1

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))

## 1.1.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

## 1.0.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
