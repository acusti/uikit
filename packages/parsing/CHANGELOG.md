# @acusti/parsing

## 0.19.0

### Minor Changes

- 01ec060: Clean the preamble and postscript texts of code block syntax
  that is commonly used by LLMs to demarcate the boundaries of the JSON
  portion of the response

## 0.18.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

## 0.17.0

### Minor Changes

- **Breaking!** parseAsJSON now returns
  `{ preamble: string, postscript: string, value }`, where `value` is the
  parsed value that used to be the entire return value of the function, and
  the `preamble` and `postscript` properties are always strings and return
  the text (trimmed) that came before or after the stringified JSON value
  respectively (or an empty string if no text was returned).

## 0.16.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
