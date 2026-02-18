# @acusti/dropdown

## 0.54.0

### Minor Changes

- 8a6fd7f: Refactor CSS handling to minify styles in the prod build via
  lightningcss and remove now useless @acusti/styling dependency (no
  benefit from its minification functionality)

## 0.53.0

### Minor Changes

- 48c735b: Use CSS anchor-scope to dramatically simplify Dropdown anchor
  positioning and avoid the need for custom styles for each Dropdown
  instance rendered on the page

### Patch Changes

- f578799: Remove auto-width constraints functionality that was causing
  buggy behavior in some edge cases

## 0.52.0

### Minor Changes

- 1f2f96f: **Breaking:** Dropdown now automatically invokes click events on
  buttons and links within dropdown items when triggered via keyboard
  navigation or mouse. When a dropdown item contains exactly one `button`,
  `a[href]`, `input[type="button"]`, or `input[type="submit"]` element,
  that element's click handler will be invoked in addition to the
  `onSubmitItem` callback. This ensures buttons and links within dropdown
  items work consistently whether activated by mouse or keyboard.

    This is considered breaking because the automatic click delegation may
    trigger navigation or other side effects in existing dropdowns that
    contain buttons or links, though in most cases this will be the desired
    behavior.

## 0.51.0

### Minor Changes

- c7e0e28: Add support for `onActiveItem` prop (mirroring the existing
  `onSubmitItem` prop) that is triggered whenever the active Dropdown item
  changes

### Patch Changes

- 0d6411e: Prevent theoretical edge cases when handling active item change
  that could clear active item state erroneously

## 0.50.1

### Patch Changes

- e4f91f3: Fix dropdown hydration errors by using react’s useId hook

## 0.50.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

### Patch Changes

- Updated dependencies [b587309]
    - @acusti/styling@2.1.0

## 0.49.0

### Minor Changes

- f16767f: Introduce optional `minHeightBody` and `minWidthBody` props to
  limit how small the automatically calculated max-width and max-height
  dimensions can be, and default them to 30 (min-height) and 100
  (min-width)
- adb5bc9: Round the dropdown body max-width and max-height to the nearest
  integer
- ed100d7: Improve positioning reliability and flexibility by explicitly
  setting the values for top, bottom, left, and right for all anchored
  positions
- c8f92a8: Improve type ergonomics by allowing Dropdown’s `props.children`
  to be a readonly array (enables `['trigger', 'body'] as const`)
- 86b1448: Pass-in an explicit `href` prop for the anchoring `<style>`
  element to avoid the need to dynamically calculate one based on the style
  contents

## 0.48.1

### Patch Changes

-   - Updated dependencies
        - @acusti/styling@2.0.1

## 0.48.0

### Minor Changes

- f87de22: Refactor @acusti/dropdown off of @acusti/use-is-out-of-bounds by
  implementing support for CSS anchor positioning as the way to support
  collision detection. This includes some fundamental changes to the base
  styles applied to `.uktdropdown`, including that it is no longer
  `position:relative` and no longer `display: inline-block`. All of the
  positioning and anchoring logic is implemented via plain CSS with useful
  defaults, so updating the behavior is as simple as providing your own
  styles to override the low-specificity styles rendered by the component.
  See `packages/docs/stories/Dropdown.stories.tsx` and
  `packages/docs/stories/Dropdown.css` for examples of how that works.

### Patch Changes

- Updated dependencies [3f2cee2]
    - @acusti/use-bounding-client-rect@2.0.1

## 0.47.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.
- d328a73: Adapt package to use react-compiler as part of vite build
  process and to remove all manual memoization. Also includes some small
  changes to strictly follow react-compiler’s rules of react and to
  workaround as-of-yet unimplemented features involving mutating
  destructured component props and the nullish coalescing assignment
  operator.

    **Note:** this is a breaking change because the packages now depend on
    react v19+ and are no longer compatible with anything before the
    introduction of the react/compiler-runtime.

### Patch Changes

- Updated dependencies [e42f474]
- Updated dependencies [d328a73]
    - @acusti/matchmaking@0.10.0
    - @acusti/styling@2.0.0
    - @acusti/use-is-out-of-bounds@0.15.0
    - @acusti/use-keyboard-events@0.11.0

## 0.46.1

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))
- Updated dependencies [29e79c3]
    - @acusti/styling@1.1.1
    - @acusti/use-is-out-of-bounds@0.14.1
    - @acusti/use-keyboard-events@0.10.1

## 0.46.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/matchmaking@0.9.0
    - @acusti/styling@1.1.0
    - @acusti/use-is-out-of-bounds@0.14.0
    - @acusti/use-keyboard-events@0.10.0

## 0.45.0

### Minor Changes

- 7e9f68d Allow @acusti/styling ^0.7.2 to support react previous react
  versions (less than v19)
- Upgrade @acusti/use-is-out-of-bounds dependency to latest v1.13.1
- Remove dependency on `@acusti/input-text` from `<Dropdown>` component by
  using a plain uncontrolled `<input>` as the trigger for searchable
  dropdowns when no trigger is passed in.

## 0.44.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
- Updated dependencies [3f3d39d]
    - @acusti/use-keyboard-events@0.9.1
    - @acusti/input-text@1.9.1
    - @acusti/styling@1.0.1
