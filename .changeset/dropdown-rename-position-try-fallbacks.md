---
'@acusti/dropdown': major
---

Rename the body’s `@position-try` fallback blocks from `--uktdd-top-left` /
`--uktdd-top-right` / `--uktdd-bottom-left` / `--uktdd-bottom-right` to
`--uktdd-top-start` / `--uktdd-top-end` / `--uktdd-bottom-start` /
`--uktdd-bottom-end`, and switch their `position-area` values (and the
default `--uktdd-body-position-area`) from physical `top`/`bottom` +
`span-left`/`span-right` to logical `block-start`/`block-end` +
`span-inline-start`/`span-inline-end`.

The old names described the direction the body extends toward, which reads
backwards from what they actually mean: each block is named for the edge
that stays flush with the trigger, not the direction the body grows —
`top-left` opened above the trigger with their **left** edges flush, so the
body extended toward the right. Renaming to `start`/`end` removes that
ambiguity and matches the submenu’s fallback
(`--uktdd-submenu-inline-start`), which already used logical keywords.

Switching to logical values also makes the default direction (and all four
named recipes) RTL-correct: the body now opens toward the trigger’s actual
inline-end edge in RTL instead of always opening toward the physical right.
This is a no-op for LTR documents, where `inline-end` is `right`.
`block-start`/`block-end` replace `top`/`bottom` rather than mixing with
the logical inline keywords — `position-area` doesn’t allow pairing a
physical keyword on one axis with a logical one on the other — and read as
`top`/`bottom` in the near-universal horizontal-tb writing mode.

**Migration:** if you referenced any of the renamed `@position-try` block
names in `--uktdd-body-position-try-fallback-1`/`-2`, or set
`--uktdd-body-position-area`/`--uktdd-submenu-position-area` directly with
`top`/`bottom`/`span-left`/`span-right`, update them:

```css
/* before */
.my-dropdown {
    --uktdd-body-position-area: bottom span-left;
    --uktdd-body-position-try-fallbacks:
        --uktdd-top-right, --uktdd-bottom-left;
}

/* after (the fallback list is now two fixed slots) */
.my-dropdown {
    --uktdd-body-position-area: block-end span-inline-start;
    --uktdd-body-position-try-fallback-1: --uktdd-top-end;
    --uktdd-body-position-try-fallback-2: --uktdd-bottom-start;
}
```

See the README’s
[Changing the Default Direction](https://github.com/acusti/uikit/blob/main/packages/dropdown/README.md#changing-the-default-direction)
section for the full cheatsheet of the four direction pairs.
