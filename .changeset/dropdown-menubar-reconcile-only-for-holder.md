---
'@acusti/dropdown': patch
---

Reconcile the menubar’s tab stop only when its holder actually leaves

Menubar members re-register on every render, so the cleanup that removes a
member from the set runs far more often than a member actually leaves. It
bumped the reconcile reducer unconditionally, which scheduled a Menubar
state update and re-render each time, and the effect it woke almost always
early-returned because the tab stop was still held by an eligible member.

Only the holder really going can strand the tab stop, and by the time the
cleanup runs React has already detached its element — which is what
distinguishes a departure from a re-render. Losing eligibility without
leaving (a holder that becomes disabled, or stops being a menu) is now
settled where the member re-registers, against the props that changed.

Measured on the compiled build, opening and closing the tab stop holder’s
own menu three times: 19 Menubar commits before, 9 after.
