---
'@acusti/input-text': patch
---

Submit the form an input is tied to by its `form` prop on Enter

With `submitOnEnter`, Enter now submits the form that owns the input: the
one named by its `form` prop, wherever the input is, and otherwise the
`<form>` it is inside. A form that the input was tied to from outside was
not submitted before. An input inside a form whose `form` prop names an id
that matches no form has no form owner, as in a browser, so Enter no longer
submits the form it is inside.
