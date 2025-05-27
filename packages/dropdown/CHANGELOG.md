# @acusti/dropdown

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
