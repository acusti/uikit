# @acusti/aws-signature-v4

## 2.0.0

### Major Changes

- a911fae: Updated engines to require node v20+ and updated the use of
  webcrypto from depending on @acusti/webcrypto (which exposed the built-in
  webcrypto differently depending on the runtime) to the built-in
  globalThis.crypto module.

    **Note:** this is only a breaking change because previous versions of
    the package were compatible with node v18, whereas this new version
    requires v19 or higher. The API contract and usage is unchanged.

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

## 1.1.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/webcrypto@1.2.0

## 1.0.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
