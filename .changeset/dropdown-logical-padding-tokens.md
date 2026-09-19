---
'@acusti/dropdown': major
---

Name the padding tokens for logical sides, and space the label with a gap

The placement tokens went logical in 1.0.0-alpha.4 so recipes stay correct
in RTL, but the content region’s padding was still four physical-side
tokens, and the label’s spacing was a `padding-right` that landed on the
wrong side of the label text in RTL.

- `--uktdd-body-pad-top`, `-right`, `-bottom`, `-left` are now
  `--uktdd-body-pad-block-start`, `-inline-end`, `-block-end`,
  `-inline-start`, applied with `padding-block`/`padding-inline`
- `--uktdd-label-pad-right` is now `--uktdd-label-gap`, applied as the
  `gap` of the flex `.uktdropdown-label` rather than as padding on
  `.uktdropdown-label-text`

The defaults are unchanged, so a dropdown that sets none of these renders
identically.

**Migration:** rename any of the five tokens you set. In a horizontal LTR
page, `--uktdd-body-pad-top` and `-bottom` become
`--uktdd-body-pad-block-start` and `-block-end`, `--uktdd-body-pad-left`
and `-right` become `--uktdd-body-pad-inline-start` and `-inline-end`, and
`--uktdd-label-pad-right` becomes `--uktdd-label-gap`. A rule that padded
`.uktdropdown-label-text` directly should set `--uktdd-label-gap` (or `gap`
on `.uktdropdown-label`) instead.
