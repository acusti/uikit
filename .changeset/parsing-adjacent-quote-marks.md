---
'@acusti/parsing': minor
---

Read a string with empty attribute values left unescaped in it

A pair of unescaped quote marks side by side in a string (`hidden=""` or
`content: ""` in HTML whose other quote marks are escaped) is now repaired:
the string carries on past it, through the CSS, scripts and line breaks
after it, unless the string ends there. So a page that a model writes with
a few of its quote marks left bare now reads whole (previously cut short or
`null`), and so does a string that ends in a quoted word
(`"The team voted "yes""`), in a pretty-printed object, with a trailing
comma after it, or before the root’s closing bracket with a closing code
fence or text after it. Look out for a comma left out between two strings
with nothing between them: `["a""b"]` is now one string, though
`{"a": "x""b": 1}` still reads as two members.
