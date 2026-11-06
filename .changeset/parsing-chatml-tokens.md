---
'@acusti/parsing': minor
---

Leave out the ChatML tokens of a raw completion

A raw completion from a Qwen model, which ends with `<|im_end|>` and may
start with `<|im_start|>` and the role on its own line (`assistant`), now
reads with neither token nor the role in its `preamble` or `postscript`,
whatever whitespace comes around them. The end token also shows that a
number right before it is whole, so `"rating": 4.5<|im_end|>\n` now reads
as `4.5`, not `4`. A token anywhere else in the text is kept as it is.
