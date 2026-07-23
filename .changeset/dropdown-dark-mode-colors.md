---
'@acusti/dropdown': patch
---

Make the default colors work equally well in light and dark mode. The
`--uktdd-body-bg-color`, `--uktdd-body-bg-color-hover`,
`--uktdd-body-color-hover`, `--uktdd-body-bg-color-selected`, and
`--uktdd-body-bg-color-path` now derive from CSS system colors (`Canvas`,
`CanvasText`, `Highlight`, `HighlightText`) and `color-mix()` blends
against `CanvasText`, instead of fixed light-mode values like `#fff`. The
body’s and submenu’s previously untokenized `box-shadow` declarations are
now exposed as `--uktdd-body-box-shadow`, kept as a fixed
`rgba(0, 0, 0, 0.25)` rather than a scheme-aware mix — mixing in
`CanvasText` turns it into a diffuse white glow in dark mode instead of a
shadow, so a fixed black (subtle in dark mode, conventional in light mode)
is the safer default in both. `--uktdd-menubar-trigger-bg-color-active`
blends against `currentColor` instead, so its tint follows the trigger’s
own authored foreground rather than the ambient color scheme.
`color-scheme` (via the new `--uktdd-color-scheme` custom property, default
`inherit`) is exposed so the popover can opt into `light dark` and follow
the browser/OS preference regardless of the host page — it defaults to
inheriting the host page’s own `color-scheme` instead, since the popover is
page content rather than OS chrome. The body’s text color now reads from
`--uktdd-body-color` instead of `color: inherit`, so it no longer picks up
a fixed, non-scheme-aware text color from a shared ancestor. This changes
the rendered colors of a dropdown using the defaults; override the custom
properties to keep a previous look.
