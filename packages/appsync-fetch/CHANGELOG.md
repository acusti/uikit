# @acusti/appsync-fetch

## 0.18.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

### Patch Changes

- Updated dependencies [e42f474]
- Updated dependencies [a911fae]
    - @acusti/aws-signature-v4@2.0.0
    - @acusti/post@1.2.0

## 0.17.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/aws-signature-v4@1.1.0
    - @acusti/post@1.1.0

## 0.16.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
- Updated dependencies [3f3d39d]
    - @acusti/aws-signature-v4@1.0.1
    - @acusti/post@1.0.1
