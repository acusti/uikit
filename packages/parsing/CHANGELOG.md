# @acusti/parsing

## 0.22.0

### Minor Changes

- f5f4c3d: Find a root array whatever its first item is, and pass over
  brackets in prose

    An array that opens on a number, a literal or a line break was taken
    for preamble whenever the text needed a repair: `[1, 2]` with a line of
    text after it returned a `value` of `null`, and a pretty-printed array
    of objects lost its root. Both are now read. An empty array or object,
    or an array that opens on a number or literal, is only taken for the
    JSON if it starts a line or follows a colon, and nothing follows it on
    its line but a full stop, a comma or a semicolon. So `As in [1], …`, a
    list of references or `- [ ] todo` before the JSON stays in the
    `preamble`, and `The answer is [1, 2, 3].` now returns `null`.

- 39ab200: Take a brace for the start of the JSON only where it opens an
  object

    A `{` in a preamble (`Use {placeholders} like this: {"a": "b"}`, or
    code with braces) was taken for the start of the JSON, so the
    `preamble` was cut short at it, and a text with no JSON after it
    returned `{}`. Such a brace is now part of the preamble: the `preamble`
    runs up to the object, and a text with no JSON in it returns a `value`
    of `null`.

- 0ec100f: Read the JSON in a code block, whatever comes before the block

    If the text has a code block that starts with JSON, that JSON is now
    the `value`, also while the block is still open as the text streams in.
    An object or array before the block (in prose, in code, or on a line of
    its own) used to be returned in its place, as the first value in the
    text. The block’s fence has to have no language, or the language
    `json`, `jsonc`, `json5` or `jsonl`, and a code block inside one of the
    JSON’s own strings is not taken for it.

    Two things follow from this that can change a `value`:

    - If the JSON in a block with one of those languages can’t be read, the
      `value` is `null`, and not the object or array before the block.
    - JSON right after the fence that closes a block of code is read as
      JSON in a block, so it too takes the place of a value before it.

- 8f21d12: Read JSON that has comments in it

    `//` and `/* */` comments in the JSON are now left out when it is read.
    A comment after a member (`"timeout": 30, // seconds`) used to end the
    `value` at that member, with the rest of the JSON in the `postscript`,
    and one after the opening brace put the brace in the `preamble`. A `//`
    in a string, as in a URL, is not a comment.

- c3b4eab: Return the first JSON value in the text

    `parseAsJSON` could return a later value in place of the first: the
    larger of two objects, or a fragment from past a mistake in place of
    the document’s root (`{"a": ["b"\n-1, {"name": "Ann"` returned
    `{ name: 'Ann' }`). The first object or array in the text is now the
    `value`, and what follows it is the `postscript`. If you want a later
    value, call `parseAsJSON` on the `postscript`.

- 7b8e5d3: Stop reading a list of keys and values that has no braces

    A text of `"key": "value",` lines with no braces around them is no
    longer read as an object: the JSON now starts at a `{` or a `[`, never
    at a quote mark. A quoted word in a preamble was being taken for a key,
    which cut the `preamble` short or returned part of the preamble as the
    value.

- 0aa60f2: Stop converting markdown tables into objects

    A two-column markdown table is no longer read as an object of keys and
    values. The conversion ran over the whole text, so a table in a
    preamble was returned in place of the JSON after it, and one after the
    JSON was merged into it. If you need a table read, convert it before
    calling `parseAsJSON`.

- b7d5078: Stop returning a value from inside an object or array that can’t
  be read

    Where the JSON’s own opening bracket could not be read because its
    first member is not written as JSON allows (a key with no quote marks,
    or with single ones), `parseAsJSON` returned the first object or array
    nested in it. It now returns a `value` of `null`, also while the text
    streams in. A code block that follows such an object or array is still
    read. So is one inside it that starts with JSON that can be read, if
    its fence has no language or the language `json`, `jsonc`, `json5` or
    `jsonl`.

### Patch Changes

- f5f4c3d: Find the JSON after a long preamble quickly

    The time to get through a preamble with many brackets in it (citations,
    links, code) grew with the square of its length: 8,000 lines with a
    citation in each took over a second. It now takes a few milliseconds.

- 6a419c8: Parse valid JSON that follows a preamble as it is

    A whole, valid JSON value after a preamble went through the repairs,
    which misread spacing they don’t expect:
    `Here it is: {"a": "b" , "c": "d"}` returned a `value` of `null`. It is
    now parsed as it is.

- 359d933: Parse a valid JSON value as it is when text follows it

    A whole, valid object or array that a postscript or the end of a code
    block followed went through the repairs, which misread spacing they
    don’t expect: `{"a": "b" , "c": "d"}` followed by `Hope this helps!`
    returned a `value` of `null`. The value is now parsed as it is, and
    what follows it is the `postscript`.

## 0.21.1

### Patch Changes

- 8544247: Repair a string cut short before a nested object or array more
  reliably

    When a string is cut short by a line break and an object or array opens
    on the next line, the string’s last line (`Here is what we offer:`)
    becomes the key for it. That only worked with exactly one raw line
    break earlier in the text; otherwise the key had no value or the
    `value` was `null`.

- a88add3: Read a string that ends in an escaped backslash in text that
  needs repairs

    In a text that needs a repair, such as a missing comma, a string that
    ends in an escaped backslash (`"path": "C:\\"`) left `parseAsJSON`
    returning a `value` of `null`. Such a string is now read, and an
    escaped backslash before a raw line break is read correctly too.

- 7c66096: Read past trailing commas in arrays and objects

    A trailing comma in an array (`{"tags": ["a", "b",], "x": "y"}`) left
    `parseAsJSON` returning a `value` of `null`, and one in a nested object
    (`{"link": {"url": "/",}, "x": "y"}`) lost everything after it. Both
    are now read in full, as is a text with a comma after the end of its
    value (`{"a": "b"},`).

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
