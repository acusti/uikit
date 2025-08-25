# @acusti/date-picker

## 0.14.0

### Minor Changes

- 316e8a3: Increase selected date range background color contrast (a11y).
- b335084: Scope range styles to only apply to `MonthCalendar` components
  when `isRange` to prevent range styles from affecting single date
  selection.
- 571dbaa: Distinguish today in `MonthCalendar` as having a red day number,
  which is simpler and more intuitive. The visual UI vocabulary is now
  completely distinct from the rest of the UI, which uses border for
  hovered date and background for selected days and date ranges.

## 0.13.0

### Minor Changes

- d583745: Parse (validate) `props.month` in `MonthCalendar` by adding
  checks to ensure that it’s a finite number within the safe integer range.
  If invalid, it defaults to the current month or clamps the value,
  improving robustness against incorrect prop values. Prevents error: Array
  length must be a positive integer of safe magnitude.
- 91ebab9: 🐞 Clamp initialMonth within monthLimit bounds, ensuring that
  the `initialMonth` value is constrained between `monthLimitFirst` and
  `monthLimitLast`, accounting for two-up mode. This prevents the date
  picker from initializing outside allowed month limits.
- 5e1b41c: Replace month navigation divs with buttons for accessibility
- d3a2908: Highlight today’s date in MonthCalendar by adding a new
  `.is-today` class.

## 0.12.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

### Patch Changes

- Updated dependencies [b587309]
    - @acusti/styling@2.1.0

## 0.11.1

### Patch Changes

-   - Updated dependencies
        - @acusti/styling@2.0.1

## 0.11.0

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
    - @acusti/styling@2.0.0

## 0.10.1

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))
- Updated dependencies [29e79c3]
    - @acusti/styling@1.1.1

## 0.10.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/styling@1.1.0

## 0.9.0

### Minor Changes

- 7e9f68d Allow @acusti/styling ^0.7.2 to support react previous react
  versions (less than v19)

## 0.8.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
- Updated dependencies [3f3d39d]
    - @acusti/styling@1.0.1
