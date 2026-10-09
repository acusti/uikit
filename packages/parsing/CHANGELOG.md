# @acusti/parsing

## 0.21.0

### Minor Changes

- 2439f14: Read `true`, `false`, `null`, and numbers in unfinished and
  invalid JSON

    When `JSON.parse` fails, `parseAsJSON` walks the text to repair it, and
    that walk stopped at the first bare literal. The literal’s key was
    given `''`, everything after it became the postscript, and whichever of
    the two parsed to more keys was returned. For a text read as it streams
    in, that meant nothing past the first `"enabled": true` was read until
    the text was complete, and once enough text followed the literal, the
    value returned was a fragment from the middle of the document.

    Bare literals are now read wherever a value is due, as their JSON
    values, including negative, decimal, and exponent numbers.

    A literal that the text ends partway through (`tr`, `nul`, `-`, `1.`)
    is left out, along with its key. The same goes for a number that the
    text ends on: `"rating": 4` could still become `4.5` or `45`, so it is
    read once a comma, a closing bracket, or whitespace follows it. If you
    parse complete responses that may be missing their closing brackets,
    end the text with a line break to have a number that it ends on read
    (see “Reading a response as it streams in” in the README).

- 7b78c3d: Read partial text as JSON far more efficiently by closing
  anything left incomplete before attempting repairs

    `parseAsJSON` now reads a text that is JSON as far as it goes in one
    pass: it closes what the text leaves open and parses the result, and
    only goes on to its repairs when that doesn’t work. This makes it way
    more performant when being used to read a stream incrementally as it
    arrives.

    `parseAsJSON` also reads unfinished text that the repairs got wrong:
    unusual spacing (`{"a": "b" , "c": "d`), an array at the root that
    opens on a literal (`[true, "a`), a string that ends in an escaped
    backslash, and a key that holds an escaped quote mark.

- 4581701: Leave out a key that the text ends partway through

    A text that ended inside an object key (`{"heading": "News", "descr`)
    had that key closed where it stopped and given `''`, so the value held
    a key the text never meant to write: `descr`, or `''` when only the
    opening quote mark had arrived. Where the part that had arrived spelled
    an earlier key in the same object (`"button` on the way to
    `"buttonLink"`), that key’s value was replaced by `''`. The unfinished
    key is now left out until it is whole.

    A key that is whole but has no value yet (`"description"` or
    `"description":`) still holds `''`.

### Patch Changes

- 51fa1f1: Read a string in an array as over when a non-string item follows
  it

    In an unfinished or otherwise invalid text, the closing quote mark of a
    string in an array was taken for an unescaped quote mark inside that
    string when the next item was not a string (`["a", true, "b"]`,
    `["a", {"b": 1}]`). The items were merged into one string, and the
    document could lose its root. A comma followed by a bare literal, an
    object, or an array now ends the string.

- 59940b3: Improve performance on long unfinished or invalid text

    At a comma that follows a string in an object, `parseAsJSON` now
    searches back only as far as the end of the last key, rather than
    through everything it has read so far. A long unfinished or invalid
    text is read in much less time, and returns the same values.

- f940dc9: Read on past a number, object, or array that follows a string
  value

    In an unfinished or otherwise invalid text, a comma after a number,
    object, or array (`"heading":"Hi","rating":5,`) could be mistaken for
    the end of a key with no value, which left `parseAsJSON` returning a
    `value` of `null`. It now only treats a string as a key that is missing
    its value.

- 9b69ad3: Read a string that ends after a comma and an escaped quote mark

    A text that ended inside a string with a comma and then an escaped
    quote mark in it (`"quote": "Honestly, \"the best`) made `parseAsJSON`
    return a `value` of `null`, as did one that ended on a key with an
    escaped quote mark in it (`"q\"k"`). Both are now read.

- 7d338ea: Read an unfinished object before its first key is whole

    A text that opened an object, then had whitespace, then ended partway
    through its first key or before that key’s colon (`{\n  "sec`) was
    taken for preamble, so the `value` that `parseAsJSON` returned was `''`
    or `null` until the first key and its colon had arrived. It is now read
    as the object it opens, the way `{"sec` already was.

- 901c87e: Read a string that ends partway through an escape sequence

    A text that ended inside a string on a backslash (as a stream can,
    between the `\` and the `n` of a line break), or partway through a
    `\uXXXX` escape, had that string closed on the unfinished escape. That
    can’t be parsed, so `parseAsJSON` returned a `value` of `null` for the
    whole text. It now leaves the unfinished escape out and reads the
    string as far as it goes.

## 0.20.2

### Patch Changes

- 0bfa690: Prefer direct JSON.parse for fully fenced code-block responses
  before repair heuristics

## 0.20.1

### Patch Changes

- 19052b1: Improve parseAsJSON’s handling of empty inputs

## 0.20.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

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
