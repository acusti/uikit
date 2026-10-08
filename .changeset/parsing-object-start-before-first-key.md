---
'@acusti/parsing': patch
---

Read an unfinished object before its first key is whole

A text that opened an object, then had whitespace, then ended partway
through its first key or before that key’s colon (`{\n  "sec`) was taken
for preamble, so the `value` that `parseAsJSON` returned was `''` or `null`
until the first key and its colon had arrived. It is now read as the object
it opens, the way `{"sec` already was.
