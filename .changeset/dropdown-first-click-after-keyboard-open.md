---
'@acusti/dropdown': patch
---

Submit the first item clicked after a dropdown opens without a press

If a dropdown first opened from the keyboard, or by focusing a searchable
dropdown’s input, before any click elsewhere on the page, the first click
on an item did nothing: the dropdown took its mouseup for the end of the
press that opened the menu, though no press had. It now submits the item.
