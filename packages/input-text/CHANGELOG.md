# @acusti/input-text

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
