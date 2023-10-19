import * as React from 'react';

import useKeyboardEvents from '../../use-keyboard-events/src/useKeyboardEvents.js';

import './useKeyboardEvents.css';

import type { Meta, StoryObj } from '@storybook/react';

const { Fragment, useState } = React;

function Demo() {
    const [event, setEvent] = useState<KeyboardEvent | null>(null);

    useKeyboardEvents({ onKeyDown: setEvent, onKeyUp: setEvent });

    const modifiers = [
        event?.shiftKey ? '⇧ ' : '',
        event?.ctrlKey ? '⌃ ' : '',
        event?.altKey ? '⌥ ' : '',
        event?.metaKey ? '⌘ ' : '',
    ].join('');

    return (
        <Fragment>
            <p className="keyboard-event-row">
                <span className="label">Event:</span>
                <input className="code" disabled value={event?.type} />
            </p>
            <p className="keyboard-event-row">
                <span className="label">Key:</span>
                <input className="code" disabled value={event?.key} />
            </p>
            <p className="keyboard-event-row">
                <span className="label">Modifiers:</span>
                <input disabled value={modifiers} />
            </p>
        </Fragment>
    );
}

const meta: Meta<typeof Demo> = {
    argTypes: {
        ignoreUsedKeyboardEvents: {
            control: 'boolean',
            description:
                'If the prop is true, the keyboard event target is an input, textarea, or contenteditable element, and the keyboard event is usable by the element, your keyboard event listeners will not be triggered',
            table: {
                defaultValue: { summary: true },
                type: { summary: 'boolean' },
            },
        },
        priority: {
            control: 'number',
            description:
                'Priority defines what order handlers should be invoked and defaults to 0. It can be any number between -50 (lowest priority) and 50 (highest priority).',
            table: {
                defaultValue: { summary: 0 },
                type: { summary: 'number' },
            },
        },
        onKeyDown: {
            action: 'onKeyDown',
            description: 'A function that will be called when a key is pressed down',
            table: {
                type: { summary: 'function' },
            },
        },
        onKeyPress: {
            action: 'onKeyPress',
            description:
                'A function that will be called when a key that produces a character value is pressed down',
            table: {
                type: { summary: 'function' },
            },
        },
        onKeyUp: {
            action: 'onKeyUp',
            description: 'A function that will be called when a key is released',
            table: {
                type: { summary: 'function' },
            },
        },
    },
    component: Demo,
    parameters: {
        docs: {
            description: {
                component:
                    '`useKeyboardEvents` is a React hook that uses keyboard event listeners on the document to trigger the onKey(Down|Press|Up) functions in order to ensure that all key events are captured regardless of whether there is currently a focused element in the DOM (i.e. `document.activeElement` is set). This solves the problem where keyboard event handlers attached via React’s `onKey(Down|Press|Up)` props miss any keyboard events that occur when the target element and its descendants aren’t focused.',
            },
        },
    },
    // https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Hooks/useKeyboardEvents',
};

export default meta;

type Story = StoryObj<typeof Demo>;

export const UseKeyboardEvents: Story = {
    args: {},
};
