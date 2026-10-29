---
'@acusti/dropdown': patch
---

Fix a dropdown’s delayed close running after it unmounts

A Dropdown that unmounts within 90ms of an item being submitted no longer
runs its delayed close afterward. In a test run, that close could land
after the test environment was torn down and fail the run with an uncaught
`ReferenceError: window is not defined`, even when every test passed.
