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

The two repairs that find a key by its colon take the same spacing: a line
that starts with a key ends a string that was left open, and a key after an
object’s closing brace shows that the object was closed too early, with
spaces or tabs between the key and its colon too. So
`{"heading" : "Our Story"}, "subheading" : "About us"}` gives
`{ heading: 'Our Story', subheading: 'About us' }`.

Look out for prose with a quote mark left unescaped in it. Where a quoted
word is followed by a comma, with spaces or tabs around it, and another
quoted word, the string now ends at the first word’s closing quote mark,
and the rest of it is read as a key: `{"tip": "Pick "yes" , "no" or both"}`
gives `{ tip: 'Pick "yes', 'no" or both': '' }`. The same goes for a quoted
word followed by a tab or two spaces and then a colon (one space already
ended the string there). That can leave a `value` of `null`.

Look out too for a quoted word, then spaces or tabs and a colon, after a
bare answer with only whitespace between them
(`"Le Petit Prince" : un conte…` on a line after it): it is read into the
answer as a key holding `''`, as such a word without the spacing already
was.
