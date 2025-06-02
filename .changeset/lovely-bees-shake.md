---
'@acusti/dropdown': minor
---

Refactor @acusti/dropdown off of @acusti/use-is-out-of-bounds by
implementing support for CSS anchor positioning as the way to support
collision detection. This includes some fundamental changes to the base
styles applied to `.uktdropdown`, including that it is no longer
`position:relative` and no longer `display: inline-block`. All of the
positioning and anchoring logic is implemented via plain CSS with useful
defaults, so updating the behavior is as simple as providing your own
styles to override the low-specificity styles rendered by the component.
See `packages/docs/stories/Dropdown.stories.tsx` and
`packages/docs/stories/Dropdown.css` for examples of how that works.
