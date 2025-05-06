---
'@acusti/input-text': patch
---

Auto-resize multiline input height on getting layout (i.e. when going from
`display: none` to `display: <anything-else>`). This fixes the behavior of
multiline inputs in, for example, an HTML popover. When the `<textarea>`
renders initially in a popover, it doesn’t get layout because it is in a
`display: none` ancestor, so it has no dimensions when the initial
`useEffect` runs. With this change, when the `InputText` component gains
dimensions, we recalculate the height to fit the text contents. It also
fires if there is, for example, a `whileInView` transition that takes it
from collapsed to visible, or any other scenario where it initially renders
without dimensions.
