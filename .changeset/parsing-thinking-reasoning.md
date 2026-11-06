---
'@acusti/parsing': minor
---

Read the JSON after a thinking model’s reasoning

Make the reasoning that Qwen3, DeepSeek-R1 and other thinking models write
before their answer part of the `preamble`, so that a draft of the JSON in
it is no longer read for the `value`. The answer after the reasoning reads
as it would on its own, and while a `<think>` block is still streaming in,
the `value` is `null`.
