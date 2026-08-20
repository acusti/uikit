---
'@acusti/dropdown': major
---

Replace the `--uktdd-body-position-try-fallbacks` list with two fixed
slots, `--uktdd-body-position-try-fallback-1` and
`--uktdd-body-position-try-fallback-2`, and rename the submenu’s list to
the singular `--uktdd-submenu-position-try-fallback`

The author fallbacks sit between the primary placement and the appended
fills, and the component’s budget is exactly two of them (two author
fallbacks + two fills = four, plus the base = the spec’s guaranteed
five-option floor). As a comma-separated list, that limit was only
documented, and a third entry silently pushed a fill past the floor,
letting a trigger near a viewport edge open off-screen. Splitting the list
into two named slots makes the two-option budget structural: there is no
third slot to overflow into. The submenu, which affords a single author
fallback, likewise becomes a single named slot.

Migration: set `--uktdd-body-position-try-fallback-1` and `-2` where you
previously set the two entries of `--uktdd-body-position-try-fallbacks`
(the direction-recipe table in the README lists the per-direction values),
and `--uktdd-submenu-position-try-fallback` (singular) where you set the
submenu list.

Also adds a shipped no-op placement, `--uktdd-noop`, for a recipe with a
single meaningful fallback (a centered menu, say): set slot 1 and leave
slot 2 as `--uktdd-noop` so it doesn’t inherit the default’s flip. It
applies no overrides, so it evaluates as the primary placement and is
skipped.
