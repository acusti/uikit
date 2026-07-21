---
'@acusti/dropdown': minor
---

Add the opt-in `--uktdd-fill-cover` last-resort placement (in no default
list): where the block-side fills loosen the inline axis and keep the body
beside the trigger, the cover fill keeps the strict start-aligned inline
edge (compose `--uktdd-fill-cover flip-inline` for end alignment) and
loosens the block axis instead, sizing the body to the viewport’s full
block size — covering the trigger — so a too-tall menu gets the whole
viewport to scroll in rather than one side of it. It is rejected whenever
the body is too wide for the trigger-to-viewport-edge inline region, so
listing it before the guaranteed pair
(`--uktdd-body-fill-fallbacks: --uktdd-fill-cover, --uktdd-fill-bottom, --uktdd-fill-top`)
applies it only when the body already fits horizontally, with the pair
still rescuing corner triggers. Three fills leaves room for at most two
author fallback slots — six position options total, within the limit every
current engine evaluates (Chromium caps at six; Safari and Firefox go well
beyond). Drop to one author fallback to keep the whole list within the
spec’s guaranteed floor of five. Avoid it on searchable dropdowns — the
body overlays the trigger’s input while open.
