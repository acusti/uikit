# @acusti/parsing

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
