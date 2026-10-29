---
'@acusti/parsing': minor
---

Start the `postscript` after a comma that ends the JSON

Where the JSON stops at a comma that no item or key follows, the
`postscript` now starts after that comma, as it already did after the
JSON’s closing bracket: `["a", "b",\nHope this helps!` gives the
`postscript` `'Hope this helps!'`. Only postscripts that started with a
comma change; the `value` is the same for every input.
