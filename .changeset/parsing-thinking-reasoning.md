---
'@acusti/parsing': minor
---

Read the JSON after a thinking model’s reasoning

The reasoning that Qwen3, DeepSeek-R1 and other thinking models write
before their answer is now part of the `preamble`, so a draft of the JSON
in it is no longer read for the `value`. That is a `<think>` block that the
text starts with, or all of the text up to a `</think>` that starts a line
and has no `<think>` before it. While a leading `<think>` block is still
open, the `value` is `null`. Without a leading `<think>`, a reading taken
while the reasoning streams in still shows any draft in it, and switches to
the answer once `</think>` arrives.
