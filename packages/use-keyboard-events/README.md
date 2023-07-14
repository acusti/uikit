# @acusti/use-keyboard-events

[![latest version](https://img.shields.io/npm/v/@acusti/use-keyboard-events?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-keyboard-events)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/use-keyboard-events?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fuse-keyboard-events)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/use-keyboard-events?style=for-the-badge)](https://bundlephobia.com/package/@acusti/use-keyboard-events)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/use-keyboard-events?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-keyboard-events)

`useKeyboardEvents` is a React hook that takes an object keyed by the
[KeyboardEvent][] type (`keydown`, `keypress`, or `keyup`). It will attach
those events to the document in order to ensure that all key events are
captured regardless of whether there is currently a focused element in the
DOM (i.e. `document.activeElement` is set). This solves the problem where
keyboard events attached via React’s `onKey(Down|Press|Up)` props miss any
keyboard events that occur while your app doesn’t have a focused element.

[keyboardevent]:
    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent

In addition, you can pass the boolean prop `ignoreUsedKeyboardEvents`,
which defaults to `true`. If the prop is true and the keyboard event target
is an input, textarea, or contenteditable element, your keyboard event
listeners will not be triggered. This makes it trivial to avoid erroneously
handling keyboard shortcuts when the keyboard event is intended by the user
to apply to the currently focused text editing U. For example: you have a
“todo” application that has a delete key handler for deleting the currently
selected todo item when. If editing the text of a todo item also means the
todo item is selected, a keydown handler that deletes the todo item would
be triggered when the user is editing the text of the todo item and hits
the delete key. If you use this package and `ignoreUsedKeyboardEvents` is
true (it defaults to true), the hook will not trigger your handler if an
input or textarea or contenteditable element is the target of the event.

The hook exposes two more methods for controlling how events are handled:
first, you can pass `priority`, which can be any number between -50 and 50.
A higher number means a higher priority, and handlers will be executed in
order from highest priority to lowest priority. In addition, you can return
a boolean `handled` value from your handler. If you do so, this value will
tell the hook that this event has been handled and that no other handler
should be triggered for the same event.
