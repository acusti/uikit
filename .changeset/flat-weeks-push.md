---
'@acusti/dropdown': minor
---

**Breaking:** Dropdown now automatically invokes click events on buttons
and links within dropdown items when triggered via keyboard navigation or
mouse. When a dropdown item contains exactly one `button`, `a[href]`,
`input[type="button"]`, or `input[type="submit"]` element, that element's
click handler will be invoked in addition to the `onSubmitItem` callback.
This ensures buttons and links within dropdown items work consistently
whether activated by mouse or keyboard.

This is considered breaking because the automatic click delegation may
trigger navigation or other side effects in existing dropdowns that contain
buttons or links, though in most cases this will be the desired behavior.
