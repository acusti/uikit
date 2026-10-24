---
'@acusti/css-value-input': patch
---

Fix `CSSValueInput` stepping its value on the arrow keys of an IME
composition

`CSSValueInput` now leaves the ↑/↓ keys that an IME uses to move through
its candidates (in Japanese, Chinese or Korean, say) to the IME: they no
longer step the value, and releasing them no longer submits it. Both keys
still reach `onKeyDown` and `onKeyUp`.
