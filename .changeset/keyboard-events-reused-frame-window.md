---
'@acusti/use-keyboard-events': patch
---

Fix key events in a frame that has loaded a document of its own

A same-origin iframe in the page’s own document that loads a document of
its own (a `srcdoc`, for example) is now listened to when a component that
uses the hook mounts after the load. Before, in Chrome, no handler heard
keys pressed in such a frame if a hook had mounted while it was still
blank, so a `Dropdown` rendered into it with a portal ignored the keyboard.
A frame whose document loads after the last such mount is still not
listened to until the next.
