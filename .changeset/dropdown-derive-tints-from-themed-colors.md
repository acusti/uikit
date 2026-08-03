---
'@acusti/dropdown': patch
---

Derive the body’s layered tints from its own themed colors instead of from
the system colors directly, so overriding the surface carries them with it.
`--uktdd-body-bg-color-selected` and `--uktdd-body-border-color` now
`color-mix()` against `currentColor` rather than `CanvasText`, and
`--uktdd-body-bg-color-path` — which has to mix the body’s foreground into
its background, and so can’t use `currentColor` for both halves — moves its
default out of `:root` and onto the `[data-ukt-active]` path rule as a
`var()` fallback. A `var()` inside a custom property is substituted where
that property is declared, so the previous `:root` defaults resolved
against the ambient color scheme before a consumer’s override on the body
could reach them: a dropdown themed with `--uktdd-body-color` and
`--uktdd-body-bg-color` alone still got a light-mode hairline, selected
tint, and path step, which on a dark-surfaced menu meant a black border it
couldn’t show and a near-white path step. All three remain plain custom
properties that override the derived default when set directly, and all
three compute to their previous values while `--uktdd-body-color` and
`--uktdd-body-bg-color` are at their defaults, so a dropdown that themes
nothing renders identically.
