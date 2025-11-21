---
'@acusti/css-value-input': patch
---

Track last submitted value as a ref that can be referred to in event
handlers, not as a state value that triggers re-renders. This addresses a
violation related to the
[`set-state-in-effect`](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)
part of the Rules of React.
