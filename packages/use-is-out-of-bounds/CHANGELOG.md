# @acusti/use-is-out-of-bounds

## 0.15.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

### Patch Changes

- Updated dependencies [e42f474]
- Updated dependencies [d328a73]
    - @acusti/use-bounding-client-rect@2.0.0

## 0.14.1

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))
- Updated dependencies [29e79c3]
    - @acusti/use-bounding-client-rect@1.5.1

## 0.14.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/use-bounding-client-rect@1.5.0

## 0.13.1

### Patch Changes

- 6cd771f: Upgrade @acusti/use-bounding-client-rect dependency to latest
  v1.4.1
