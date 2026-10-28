---
'@acusti/parsing': minor
---

Read spaces and tabs around a comma or colon in a text that needs a repair

In a text that needs a repair (a trailing comma, say), a string now ends at
its closing quote mark whatever the spaces or tabs around the comma or
colon after it. And where the text ends after a key and its colon, the key
holds `''` whatever the spacing before the colon. So
`{"a": "b" , "c": "d",}` gives `{ a: 'b', c: 'd' }`, `["a" , "b",]` gives
`['a', 'b']`, and `{"tags": ["a",], "rating" :` gives
`{ tags: ['a'], rating: '' }`.

Look out for prose with a quote mark left unescaped in it. Where a quoted
word is followed by a comma, with spaces or tabs around it, and another
quoted word, the string now ends at the first word’s closing quote mark,
and the rest of it is read as a key: `{"tip": "Pick "yes" , "no" or both"}`
gives `{ tip: 'Pick "yes', 'no" or both': '' }`. The same goes for a quoted
word followed by a tab or two spaces and then a colon (one space already
ended the string there). That can leave a `value` of `null`.
