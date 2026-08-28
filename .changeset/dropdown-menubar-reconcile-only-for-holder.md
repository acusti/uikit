---
'@acusti/dropdown': patch
---

Reconcile the menubar’s tab stop only when its holder leaves

Menubar members re-register on every render, so the cleanup that removes a
member from the set runs far more often than a member actually leaves. It
bumped the reconcile reducer unconditionally, which scheduled a Menubar
state update and re-render for every member render — and the effect it woke
almost always early-returned, because the tab stop was still held by an
eligible member.

Only the holder going (or becoming ineligible, which re-registers it here
too) can strand the tab stop, so only that case now reconciles. On a
four-member bar, engaging it and hover-switching around it three times went
from 27 Menubar renders to 12.
