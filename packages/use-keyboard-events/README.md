# @acusti/use-keyboard-events

[![latest version](https://img.shields.io/npm/v/@acusti/use-keyboard-events?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-keyboard-events)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/use-keyboard-events?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fuse-keyboard-events)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/use-keyboard-events?style=for-the-badge)](https://bundlephobia.com/package/@acusti/use-keyboard-events)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/use-keyboard-events?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-keyboard-events)

`useKeyboardEvents` is a React hook that takes the following payload:

```ts
{
    ignoreUsedKeyboardEvents?: boolean;
    onKeyDown?: (event: KeyboardEvent) => unknown;
    onKeyPress?: (event: KeyboardEvent) => unknown;
    onKeyUp?: (event: KeyboardEvent) => unknown;
    priority?: number;
}
```

The hook uses [keyboard event] listeners on the document to trigger the
onKey(Down|Press|Up) functions in order to ensure that all key events are
captured regardless of whether there is currently a focused element in the
DOM (i.e. `document.activeElement` is set). This solves the problem where
keyboard event handlers attached via React’s `onKey(Down|Press|Up)` props
miss any keyboard events that occur when the target element and its
descendants aren’t focused.

[keyboard event]:
    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent

In addition to keyboard event handlers, you can pass the boolean prop
`ignoreUsedKeyboardEvents`, which defaults to `true`. If the prop is true,
the keyboard event target is an input, textarea, or contenteditable
element, and the keyboard event is usable by the element, your keyboard
event listeners will not be triggered. This makes it trivial to avoid
erroneously handling keyboard shortcuts when the keyboard event is intended
by the user to apply to the currently focused text editing UI. For example:
you have a “todo” application that has a delete key handler for deleting
the currently selected todo item when. If editing the text of a todo item
also means the todo item is selected, a keydown handler that deletes the
todo item would be triggered when the user is editing the text of the todo
item and hits the delete key. If you use this package and
`ignoreUsedKeyboardEvents` is true (it defaults to true), the hook will not
trigger your handler if the target of the keyboard event is using it for
input.

The hook exposes two more methods for controlling how events are handled:
first, you can pass `priority`, which can be any number between -50 and 50.
A higher number means a higher priority, and handlers will be executed in
order from highest priority to lowest priority. In addition, you can return
boolean `false` from your handler to indicate that no other handler should
be triggered for this same event (akin to calling
`event.stopPropagation()`).
