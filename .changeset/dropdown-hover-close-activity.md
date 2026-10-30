---
'@acusti/dropdown': patch
---

Keep an `openOnHover` Dropdown closed when `<Activity>` hides it

A Dropdown that `<Activity mode="hidden">` hides within 150ms of the
pointer leaving it now stays closed when it’s shown again (previously it
came back open). Its `onClose` is called when it’s shown again, not when
it’s hidden, because Activity pauses effects while its content is hidden.
