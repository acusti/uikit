---
'@acusti/parsing': minor
---

Read a string with a backslash in it that starts no JSON escape

A backslash before an apostrophe (`don\'t`) is now left out, and one before
anything else is kept as a backslash (`C:\Users`, `\d+`, `{\ margin: 0 }`),
where `value` was `null`. Look out for code in a string: `'it\'s'` now
reads `'it's'`.
