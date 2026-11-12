---
'@acusti/dropdown': minor
---

Use the page’s font in dropdowns by default

Dropdowns, their triggers and the menu bar now inherit the font of the page
around them, where they used to set the system UI font stack. If your app
sets its font on `html` or `body`, dropdowns now match it without any
configuration. If your page sets no font of its own, dropdowns now use the
browser’s default font, like the rest of the page. To give dropdowns a font
of their own (such as the previous system stack), set `--uktdd-font-family`
on `:root`, an ancestor, or a dropdown’s class:

```css
:root {
    --uktdd-font-family: system-ui, sans-serif;
}
```
