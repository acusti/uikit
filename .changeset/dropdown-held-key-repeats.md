---
'@acusti/dropdown': patch
---

Fix a held Enter or Space acting on a dropdown again and again

A dropdown now opens, closes, and submits on the press of Enter or Space,
and ignores the repeats that follow while the key is held. Holding either
key on a menu’s trigger used to open and close the menu over and over, and
holding Enter on a highlighted item submitted it once per repeat.
