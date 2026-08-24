# @acusti/use-keyboard-events

## 0.13.0

### Minor Changes

- f329612: Rebuild with a new React Compiler toolchain

    The published build now runs through a different React Compiler
    toolchain internally. Output is verified equivalent to the previous
    build: React Compiler memoization is unchanged, with zero compiler
    bailouts. No API or behavior changes.

## 0.12.0

### Minor Changes

- fb483ea: Export NON_TEXT_INPUT_TYPES

    The input types that hold no user-entered text — the ones behind
    `isEventTargetUsingKeyEvent` — are now exported, so consumers can share
    that notion of what counts as a text input instead of keeping a copy in
    sync by hand. It’s a frozen `readonly string[]`, since every consumer
    shares the one instance.

## 0.11.1

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

## 0.10.1

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))

## 0.10.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

## 0.9.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
