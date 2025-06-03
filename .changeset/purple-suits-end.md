---
'@acusti/styling': patch
---

Strip spaces out of the auto-generated `href` prop for `<style>` elements
to prevent hydration mismatch failures on the client.
