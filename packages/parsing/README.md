# @acusti/parsing

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)

`@acusti/parsing` exports `parseAsJSON`, a function that takes a string and
attempts to parse it as JSON. It returns `{ preamble, value, postscript }`:
`value` is the resulting JS value, or `null` if the string defeated all
attempts at parsing it, and `preamble` and `postscript` are the text that
came before and after the JSON (each an empty string if there was none).
This is especially useful for generative AI when you prompt an LLM to
generate a response in JSON: `parseAsJSON` identifies any preamble and
postscript and separates them from the JSON data, and it can successfully
and usefully parse an incomplete response as it streams in (see
[Reading a response as it streams in](#reading-a-response-as-it-streams-in)).

The [unit tests][] show the kinds of LLM responses and syntax errors that
the package can fix and convert into a valid result.

## Usage

```
npm install @acusti/parsing
# or
yarn add @acusti/parsing
```

Import `parseAsJSON` (it’s a named export) and pass a string to it:

````js
import { parseAsJSON } from '@acusti/parsing';

// it might neglect to close the outer curly braces
const { preamble, value } =
    parseAsJSON(`  Sure, here's an example of a JSON response for the "Contact Form" page:
{
    "heading": "Get in Touch",
    "form": {
        "email": "info@example.net",
        "message": "Please enter your message or inquiry below"
    }
`);
/* value is:
{
    heading: 'Get in Touch',
    form: {
        email: 'info@example.net',
        message: 'Please enter your message or inquiry below',
    },
}
and preamble is:
'Sure, here\'s an example of a JSON response for the "Contact Form" page:'
*/

// it might prematurely close the outer JSON object even though the content continues
parseAsJSON(
    '```json\n{"heading":"Organic Produce","subheading":"The Benefits of Going Organic","description":"Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers."},"items":[{"heading":"Organic Fruits","subheading":"Nature\'s Sweet Treats"},{"heading":"Organic Vegetables","subheading":"Fresh from the Garden"}]}\n```',
).value;
/* results in:
{
    heading: 'Organic Produce',
    subheading: 'The Benefits of Going Organic',
    description: 'Organic produce is grown without the use of synthetic pesticides, herbicides, or fertilizers.',
    items: [
        {
            heading: 'Organic Fruits',
            subheading: "Nature's Sweet Treats",
        },
        {
            heading: 'Organic Vegetables',
            subheading: 'Fresh from the Garden',
        },
    ],
}
*/

// it might annotate the JSON with comments, which are left out
parseAsJSON(
    '{\n  // in seconds\n  "timeout": 30, // the default\n  "url": "https://example.com" /* the link */\n}',
).value;
/* results in:
{
    timeout: 30,
    url: 'https://example.com',
}
*/
````

## Where the JSON is in the text

`parseAsJSON` reads the first JSON object or array in the text, or the one
in a code block if the text has a code block with JSON in it. What comes
before it is the `preamble`, and what follows it is the `postscript`.

- The JSON in a code block is the value, whatever comes before the block:
  prose, code, or another object or array.
    - A code block is what follows a fence: a line of ` ``` ` and an
      optional language. It counts if its fence has no language, or the
      language is `json`, `jsonc`, `json5` or `jsonl`, and if JSON is what
      it starts with, after any comments. A block in another language is
      code, and never takes the place of a value before it.
    - It does not have to be closed, so this holds while the text streams
      in.
    - Fences are not counted to tell one that opens a block from one that
      closes one, so JSON right after the fence that closes a block of code
      is taken for JSON in a block.
    - If the JSON in a block with one of those languages can’t be read (see
      below), what comes before the block is not returned in its place.
      After a fence with no language, only JSON that can be read counts.
    - A code block inside one of the JSON’s own strings is part of the
      string, and is not taken for it.
- The JSON starts at the first `{` that opens an object or `[` that opens
  an array. A bracket in the preamble that is not JSON is passed over, such
  as `{placeholders}`, a citation (`[1]`), a task list (`- [ ]`) or a set
  (`{"a", "b"}`).
- An object or array that can’t be read is not read from one of its
  members. That is a `{` or `[` that starts a line or follows a colon, with
  a first member that JSON does not allow: a key with no quote marks or
  with single ones, or a comma. The `value` is `null`, also while the text
  streams in. What follows its closing bracket is still read, and so is a
  code block that starts before it is closed. A code block in one of its
  strings in double quote marks, or in one of its comments, is part of it,
  unless it is a block that counts (see above) and starts with JSON that
  can be read. That block ends it, and what follows is read like any other
  text.
- Prose has empty objects and arrays too, and arrays that open on a number
  or on `true`, `false` or `null`. One of those is only taken for the JSON
  if it starts a line or follows a colon, and nothing follows it on its
  line but a full stop, a comma or a semicolon, and a comment.
- If the value is valid JSON it is parsed as it is, unless a key follows an
  object’s closing brace (the object was closed too early, as above, and is
  repaired). Otherwise only a value that is unfinished or malformed is
  repaired.
- A second value in the text is left in the `postscript`. To read it, call
  `parseAsJSON` on the `postscript`.

````js
parseAsJSON(
    'As in [1], use {placeholders}: {"a": "b"} and then {"c": "d"}',
);
/* results in:
{
    preamble: 'As in [1], use {placeholders}:',
    value: { a: 'b' },
    postscript: 'and then {"c": "d"}',
}
*/

parseAsJSON('The sizes are: [1, 2]').value;
// [1, 2]

parseAsJSON('The sizes are [1, 2].').value;
// null

parseAsJSON('The sizes are: [1, 2] in inches').value;
// null

parseAsJSON('{ name: "Ann", "address": {"city": "Oslo"} }').value;
// null

parseAsJSON('Call go({"y": 1}) first:\n```json\n{"a": 1}\n```').value;
// { a: 1 }

parseAsJSON('Use {"y": 1} like so:\n```json\n{ a: "b" }\n```').value;
// null

parseAsJSON(
    '{"name": "Ann"}\nOr in Python:\n```python\n{"name": "Bo"}\n```',
).value;
// { name: 'Ann' }
````

A markdown table, and a list of `"key": "value"` lines with no braces
around it, are not JSON and are not read.

## Reading a response as it streams in

You can call `parseAsJSON` repeatedly on text as it streams in to support
UIs that show the response incrementally as it builds out. A text that is
JSON as far as it goes is read as far as it goes, and each reading is a
prefix of the finished value: what the text can’t yet be sure of is left
out, so a reading holds nothing that the finished one won’t. A text that
needs repairs is read as well as the repairs allow, which need not be a
prefix of what it goes on to read as.

- A string is read up to where it stops (less an escape sequence that the
  text ends partway through).
- A key, or a `true`, `false`, `null` or number, that the text ends partway
  through is left out until it is whole.
- A number that the text ends on is left out too, because more of it may be
  coming: `"rating": 4` could become `4.5` or `45`. It is read once a
  comma, a closing bracket or whitespace follows it.

The one placeholder is for a key that is whole but has no value yet, which
holds `''` until its value starts.

```js
parseAsJSON('{"heading": "Our Story", "rating": 4').value;
// { heading: 'Our Story' }

parseAsJSON('{"heading": "Our Story", "rating": 4.5, "isLive": tr').value;
// { heading: 'Our Story', rating: 4.5 }

parseAsJSON('{"heading": "Our Story", "items": [{"name": "A ta').value;
// { heading: 'Our Story', items: [{ name: 'A ta' }] }

parseAsJSON('{"heading": "Our Story", "subheading":').value;
// { heading: 'Our Story', subheading: '' }
```

`parseAsJSON` can’t tell a text that is still arriving from one that
finished without its closing brackets. If you know that a text is complete,
with nothing cut off its end, add a line break to it (any whitespace will
do) to say so, and a number that it ends on is read:

```js
parseAsJSON('{"count": 12').value;
// {}

parseAsJSON('{"count": 12' + '\n').value;
// { count: 12 }
```

## What it repairs, and what it doesn’t

Every repair and rule in `parseAsJSON` has a cost: bytes in your bundle,
code to maintain, and more surface for bugs. To be worth that cost, each
has to have a plausible story for when a response would look that way. The
goal is not to cover as many theoretical edge cases as possible, it’s to
cover as many plausible ones as possible.

So a text that no model is likely to write may come back as `null`, or be
read in a way you wouldn’t guess, even where a rule for it is easy to
imagine. If a response that a model did write is read wrongly, please [open
an issue][] with the text, or one shaped like it. That is the story that a
new repair needs.

Again, there are more examples of the kinds of things that the parser can
handle in the [unit tests][].

Also, if you’re wondering the best way to get an LLM to return JSON, I
found the few-shot prompting approach suggested in Pinecone’s [Llama 2: AI
Developers Handbook][] helpful with a variety of different models (Llama 2
7B, OpenChat 3.5, OpenHermes 2.5, Zephyr 7B).

[unit tests]:
    https://github.com/acusti/uikit/blob/main/packages/parsing/src/parse-as-json.test.ts
[open an issue]: https://github.com/acusti/uikit/issues
[llama 2: ai developers handbook]:
    https://www.pinecone.io/learn/llama-2/#Llama-2-Chat-Prompt-Structure
