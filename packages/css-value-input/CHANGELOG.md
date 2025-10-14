# @acusti/css-value-input

## 2.2.0

### Minor Changes

- ab0dff5: Upgrade to @acusti/input-text v2.2.0 and use `InputText`
  component’s new `discardOnEscape` prop to simplify internal
  `CSSValueInput` logic

### Patch Changes

- Updated dependencies [80a69bf]
- Updated dependencies [b01d978]
- Updated dependencies [056a91f]
    - @acusti/input-text@2.2.0

## 2.1.2

### Patch Changes

- 046a34a: Upgraded dependencies (missed in last patch version bump)

## 2.1.1

### Patch Changes

-   - Updated dependencies [75d5c35]
        - @acusti/input-text@2.1.1

## 2.1.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

### Patch Changes

- Updated dependencies [b587309]
    - @acusti/input-text@2.1.0

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

### Patch Changes

- Updated dependencies [e42f474]
- Updated dependencies [d328a73]
    - @acusti/css-values@1.2.0
    - @acusti/input-text@2.0.0

## 1.1.2

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))
- Updated dependencies [c9d2af3]
- Updated dependencies [29e79c3]
    - @acusti/input-text@1.11.0

## 1.1.1

### Patch Changes

-   - Updated dependencies
        - @acusti/input-text@1.10.1

## 1.1.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/css-values@1.1.0
    - @acusti/input-text@1.10.0

## 1.0.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
- Updated dependencies [3f3d39d]
    - @acusti/css-values@1.0.4
    - @acusti/input-text@1.9.1
