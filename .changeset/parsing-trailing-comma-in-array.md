---
'@acusti/parsing': patch
---

Read past a trailing comma in an array or an object

A comma before the closing bracket of an array
(`{"tags": ["a", "b",], "x": "y"}`), right after an opening bracket
(`{"tags": [, "a"]}`), or after the end of the whole value (`{"a": "b"},`)
left `parseAsJSON` returning a `value` of `null`. One before the closing
brace of an object (`{"link": {"url": "/",}, "x": "y"}`) ended the read
there, so what followed it was lost. A trailing comma after a value is now
left out and the rest of the text is read; a text with a comma right after
an opening bracket is read up to that comma.
