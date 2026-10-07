---
'@acusti/date-picker': patch
---

Fix today’s date highlight mismatching after server rendering

`MonthCalendar` read the current date during render, so server-rendered
markup could mark a different day as today than the client (the server’s
clock and timezone differ from the user’s), and React doesn’t repair
mismatched attributes when hydrating. Today’s date is now read with
`useSyncExternalStore`, so server and hydration renders omit the `is-today`
class and the client adds it right after hydrating.
