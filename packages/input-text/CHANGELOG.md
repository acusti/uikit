# @acusti/input-text

## 2.1.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

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

## 1.11.0

### Minor Changes

- c9d2af3: Use `field-sizing: content;` when supported in the current
  browser (progressive enhancement) instead of custom height logic and
  event listeners to automatically resize mutliLine InputText elements to
  fit their contents.

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))

## 1.10.1

### Patch Changes

- 80326c9: Auto-resize multiline input height on getting layout (i.e. when
  going from `display: none` to `display: <anything-else>`). This fixes the
  behavior of multiline inputs in, for example, an HTML popover. When the
  `<textarea>` renders initially in a popover, it doesn’t get layout
  because it is in a `display: none` ancestor, so it has no dimensions when
  the initial `useEffect` runs. With this change, when the `InputText`
  component gains dimensions, we recalculate the height to fit the text
  contents. It also fires if there is, for example, a `whileInView`
  transition that takes it from collapsed to visible, or any other scenario
  where it initially renders without dimensions.

## 1.10.0

### Minor Changes

- ebcfff5: Update the flowgen command to translate the
  `InputHTMLAttributes<HTMLInputElement>` type to `React.PropsOf<'input'>`
  ([reference](https://flow-typed.github.io/flow-typed/#/env-definitions?id=jsx))
- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

## 1.9.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
