---
'@acusti/dropdown': patch
---

Apply `--uktdd-*` tokens set on `html` or `:root` in any order

The dropdown’s default tokens now have zero specificity, so a value you set
on `html` or `:root` always applies. Before, a value on `html` always lost
to the package’s defaults, and one on `:root` lost whenever your stylesheet
came before the package’s.
