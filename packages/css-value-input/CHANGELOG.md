# @acusti/css-value-input

## 2.6.0

### Minor Changes

- fe8cfaa: Hitting ↑/↓ keys on an empty input with a numeric placeholder
  sets the value from that placeholder, preserving the unit if present

### Patch Changes

- Updated dependencies [950c1c7]
    - @acusti/input-text@2.6.0

## 2.5.0

### Minor Changes

- f647dc2: Forward aria-\* attributes and role to the underlying input

    `Props` didn’t include any of the ARIA attributes, so annotating the
    input — `aria-describedby` for a hint, `aria-invalid` on a rejected
    value — wasn’t possible. The only name the input could get came from
    `label` or, for the icon-only case, the `aria-label` the component puts
    on its wrapping `<label>` from `title`, neither of which the consumer
    could override.

    `Props` now intersects React’s `AriaAttributes` and adds `role`, and
    any of those props not consumed by the component are spread onto the
    nested input. An `aria-label` passed in names the input and, by the
    accessible name precedence, wins over the wrapper’s label text or
    title.

### Patch Changes

- Updated dependencies [9e12c44]
- Updated dependencies [6afc8d4]
    - @acusti/input-text@2.5.0

## 2.4.1

### Patch Changes

- 09f3ea5: Compile with React Compiler

    This package’s build now runs through React Compiler, so its internals
    are automatically memoized for better runtime performance. This is its
    first published release built with the compiler. No API or behavior
    changes.

- Updated dependencies [f329612]
    - @acusti/input-text@2.4.4

## 2.4.0

### Minor Changes

- f86e693: Type CSSValueInput's event handler props with InputText's
  `InputElement` union instead of `HTMLInputElement`

    `onBlur`, `onChange`, `onFocus`, `onKeyDown` and `onKeyUp` now receive
    events typed as `InputElement`
    (`HTMLInputElement | HTMLTextAreaElement`, exported by
    `@acusti/input-text`), matching what the underlying InputText component
    declares. Runtime behavior is unchanged — CSSValueInput always renders
    a single-line input, so events only ever originate from an
    `HTMLInputElement`.

    Handlers with inferred parameter types (inline arrow functions) are
    unaffected. Handlers explicitly annotated with `HTMLInputElement` event
    types (e.g. `(event: FocusEvent<HTMLInputElement>) => ...`) will no
    longer typecheck under TypeScript 6+ (which enables
    `strictFunctionTypes` by default); annotate them with `InputElement`
    instead.

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

- Updated dependencies [f86e693]
    - @acusti/input-text@2.4.3

## 2.3.2

### Patch Changes

- Updated dependencies [6c9ccff8]
    - @acusti/input-text@2.4.2

## 2.3.1

### Patch Changes

- 3ae0da5: Adapt `CSSValueInput` to use the latest `InputText`
  `submitOnEnter` behavior, plus added regression test coverage for
  Enter-driven normalization and form submission.
- Updated dependencies [eeb8097]
    - @acusti/input-text@2.4.1

## 2.3.0

### Minor Changes

- Updated dependencies
    - @acusti/input-text@2.4.0

## 2.2.3

### Patch Changes

- Updated dependencies [1574b856] - @acusti/input-text@2.3.0

## 2.2.2

### Patch Changes

- b6dfcb8: Remove defunct ref tracking and forward refs directly to
  `<InputText>`
- 01da0b4: Add support for React 19 ref callback cleanup functions. Ref
  callbacks can now return cleanup functions that will be called when the
  element is removed or the ref changes, matching React 19’s native ref
  behavior.
- Updated dependencies [01da0b4]
    - @acusti/input-text@2.2.2

## 2.2.1

### Patch Changes

- 7fd6663: Track last submitted value as a ref that can be referred to in
  event handlers, not as a state value that triggers re-renders. This
  addresses a violation related to the
  [`set-state-in-effect`](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)
  part of the Rules of React.
- Updated dependencies [dcb8377]
    - @acusti/input-text@2.2.1

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
