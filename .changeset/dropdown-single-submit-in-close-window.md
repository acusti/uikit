---
'@acusti/dropdown': minor
---

Ignore a second submit while a Dropdown is closing from the first

A submit closes a Dropdown 90ms later, and a submit before then is now
ignored: two quick presses of Enter or Space on the active item call
`onSubmitItem` once and click an item’s button or link once. A
`hasItems={false}` Dropdown with `keepOpenOnSubmit={false}` closes 90ms
after its first submit, not its last. A Dropdown with `keepOpenOnSubmit` is
unchanged: every submit goes through.
