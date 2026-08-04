---
'@acusti/dropdown': minor
---

Implement the documented Home/End keys

The keyboard docs listed Home and End as “jump to first/last item in the
current level”, but the key handler had no branch for either, so both were
no-ops — the only way to reach a level’s ends was ⌥/⌘ + ↑/↓. Home and End
now jump to the same targets those modifiers do, operating on the current
level (the level of the deepest highlighted item) like every other
navigation key, and reporting the item they land on to
`props.onActiveItem`.

Like ←/→, they stand down while a text input has focus — a searchable
dropdown’s own input, or one inside a custom trigger — where Home/End are
caret movement rather than menu navigation. The ⌥/⌘ + ↑/↓ shortcut, which
was never documented, is now listed alongside them.
