---
'@acusti/parsing': minor
---

Stop returning a value from inside an object or array that can’t be read

Where the JSON’s own opening bracket could not be read because its first
member is not written as JSON allows (a key with no quote marks, or with
single ones), `parseAsJSON` returned the first object or array nested in
it. It now returns a `value` of `null`, also while the text streams in. A
code block that follows such an object or array is still read. So is one
inside it that starts with JSON that can be read, if its fence has no
language or the language `json`, `jsonc`, `json5` or `jsonl`.
