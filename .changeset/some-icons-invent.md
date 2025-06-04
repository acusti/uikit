---
'@acusti/dropdown': minor
---

- Introduce optional `minHeightBody` and `minWidthBody` props to limit how
  small the automatically calculated max-width and max-height dimensions
  can be, and default them to 30 (min-height) and 100 (min-width)
- Round the dropdown body max-width and max-height to the nearest integer
- Improve positioning reliability and flexibility by explicitly setting the
  values for top, bottom, left, and right for all anchored positions
- Improve type ergonomics by allowing Dropdown’s `props.children` to be a
  readonly array (enables `['trigger', 'body'] as const`)
- Pass-in an explicit `href` prop for the anchoring `<style>` element to
  avoid the need to dynamically calculate one based on the style contents
