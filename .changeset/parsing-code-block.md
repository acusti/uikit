---
'@acusti/parsing': minor
---

Read the JSON in a code block, whatever comes before the block

If the text has a code block that starts with JSON, that JSON is now the
`value`, also while the block is still open as the text streams in. An
object or array before the block (in prose, in code, or on a line of its
own) used to be returned in its place, as the first value in the text. The
block’s fence has to have no language, or the language `json`, `jsonc`,
`json5` or `jsonl`, and a code block inside one of the JSON’s own strings
is not taken for it.

Two things follow from this that can change a `value`:

- If the JSON in a block with one of those languages can’t be read, the
  `value` is `null`, and not the object or array before the block.
- JSON right after the fence that closes a block of code is read as JSON in
  a block, so it too takes the place of a value before it.
