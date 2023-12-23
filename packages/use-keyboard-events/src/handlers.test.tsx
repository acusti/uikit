// @vitest-environment happy-dom
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { addHandler, handlersData, isEventTargetUsingKeyEvent } from './handlers.js';

const noop = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

describe('@acusti/use-keyboard-events', () => {
    describe('handlers', () => {
        describe('addHandler', () => {
            it('adds the passed-in handler based on eventType and priority', () => {
                const cleanupKeyDownHandler = addHandler({
                    eventType: 'keydown',
                    handler: noop,
                });
                // priority should default to 0, which gets normalized to 50
                expect(handlersData.keydown[50].has(noop)).toBe(true);
                expect(handlersData.keydown[0]).toBe(undefined);
                const cleanupKeyPressHandler = addHandler({
                    eventType: 'keypress',
                    handler: noop,
                    priority: 10,
                });
                // priority of 10 normalizes to 60
                expect(handlersData.keypress[60].has(noop)).toBe(true);
                expect(handlersData.keypress[50]).toBe(undefined);
                const cleanupKeyUpHandler = addHandler({
                    eventType: 'keyup',
                    handler: noop,
                    priority: -50,
                });
                // minimum priority (-50) normalizes to 0
                expect(handlersData.keyup[0].has(noop)).toBe(true);
                expect(handlersData.keyup[50]).toBe(undefined);
                cleanupKeyDownHandler();
                cleanupKeyPressHandler();
                cleanupKeyUpHandler();
            });

            it('returns a cleanup function that removes the added handler from handlersData', () => {
                addHandler({ eventType: 'keydown', handler: noop })();
                addHandler({ eventType: 'keypress', handler: noop, priority: 10 })();
                addHandler({ eventType: 'keyup', handler: noop, priority: -50 })();
                expect(handlersData.keydown[50]).toBe(undefined);
                expect(handlersData.keypress[60]).toBe(undefined);
                expect(handlersData.keyup[0]).toBe(undefined);
            });

            it('resizes the handler arrays on removing a handler when possible to avoid unnecessary iteration', () => {
                const cleanupKeyDownHandler = addHandler({
                    eventType: 'keydown',
                    handler: noop,
                });
                expect(handlersData.keydown.length).toBe(51);
                const cleanupKeyUpHandler = addHandler({
                    eventType: 'keyup',
                    handler: noop,
                    priority: -50,
                });
                expect(handlersData.keyup.length).toBe(1);
                cleanupKeyDownHandler();
                expect(handlersData.keydown.length).toBe(0);
                cleanupKeyUpHandler();
                expect(handlersData.keyup.length).toBe(0);
            });

            it('bounds priority to a minimum of -50 and a maximum of 50', () => {
                const cleanupKeyDownHandler = addHandler({
                    eventType: 'keydown',
                    handler: noop,
                    priority: -1000,
                });
                expect(handlersData.keydown.length).toBe(1);
                const cleanupKeyPressHandler = addHandler({
                    eventType: 'keypress',
                    handler: noop,
                    priority: Infinity,
                });
                expect(handlersData.keypress.length).toBe(101);
                const cleanupKeyUpHandler = addHandler({
                    eventType: 'keyup',
                    handler: noop,
                    priority: 299,
                });
                expect(handlersData.keyup.length).toBe(101);
                cleanupKeyDownHandler();
                expect(handlersData.keydown.length).toBe(0);
                cleanupKeyPressHandler();
                expect(handlersData.keypress.length).toBe(0);
                cleanupKeyUpHandler();
                expect(handlersData.keyup.length).toBe(0);
            });
        });

        describe('isEventTargetUsingKeyEvent', () => {
            let isUsingKeyEvent: null | boolean = null;
            const handleKeyEvent = (event: React.KeyboardEvent<HTMLElement>) => {
                isUsingKeyEvent = isEventTargetUsingKeyEvent(event.nativeEvent);
            };

            beforeEach(() => {
                isUsingKeyEvent = null;
            });

            afterEach(cleanup);

            it('detects that textual <input>s are using key events triggered on them', async () => {
                const user = userEvent.setup();
                const { rerender } = render(
                    <input onKeyDown={handleKeyEvent} type="text" />,
                );
                const input = screen.getByRole('textbox');
                expect(isUsingKeyEvent).toBe(null);
                await user.type(input, 'A');
                expect(isUsingKeyEvent).toBe(true);
                isUsingKeyEvent = null;

                rerender(<input onKeyUp={handleKeyEvent} type="password" />);
                expect(isUsingKeyEvent).toBe(null);
                await user.type(input, ' ');
                expect(isUsingKeyEvent).toBe(true);
            });

            it('detects that <textarea>s are using key events triggered on them', async () => {
                const user = userEvent.setup();
                const { rerender } = render(<textarea onKeyDown={handleKeyEvent} />);
                const textarea = screen.getByRole('textbox');
                expect(isUsingKeyEvent).toBe(null);
                await user.type(textarea, 'z');
                expect(isUsingKeyEvent).toBe(true);
                isUsingKeyEvent = null;

                rerender(<textarea onKeyUp={handleKeyEvent} />);
                expect(isUsingKeyEvent).toBe(null);
                await user.type(textarea, '{Enter}');
                expect(isUsingKeyEvent).toBe(true);
            });

            it('detects that contenteditable elements are using key events triggered on them', async () => {
                const user = userEvent.setup();
                // const text = 'Lorem ipsum dolor sit amet.';
                const { rerender } = render(
                    <div
                        contentEditable
                        data-testid="contenteditable"
                        onKeyDown={handleKeyEvent}
                    />,
                );
                const element = screen.getByTestId('contenteditable');
                // Add missing property http://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/isContentEditable
                (element as any).isContentEditable = true; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                expect(isUsingKeyEvent).toBe(null);
                await user.type(element, 'z');
                expect(isUsingKeyEvent).toBe(true);
                isUsingKeyEvent = null;

                rerender(<div contentEditable onKeyUp={handleKeyEvent} />);
                expect(isUsingKeyEvent).toBe(null);
                await user.type(element, '{Enter}');
                expect(isUsingKeyEvent).toBe(true);
            });
            // eslint-disable-next-line @typescript-eslint/require-await
            it('detects that non-interactive elements aren’t using key events triggered on them', async () => {
                const text = 'Lorem ipsum dolor sit amet.';
                render(<p onKeyDown={handleKeyEvent}>{text}</p>);
                expect(isUsingKeyEvent).toBe(null);
                fireEvent.keyDown(screen.getByText(text), { code: 'KeyA', key: 'A' });
                expect(isUsingKeyEvent).toBe(false);
            });

            it('detects that range <input>s use arrow key events', async () => {
                const user = userEvent.setup();
                render(
                    <input defaultValue="1" onKeyDown={handleKeyEvent} type="range" />,
                );
                const input = screen.getByRole('slider');
                expect(isUsingKeyEvent).toBe(null);
                await user.type(input, 'A');
                expect(isUsingKeyEvent).toBe(false);
                isUsingKeyEvent = null;
                await user.type(input, '{ArrowDown}');
                expect(isUsingKeyEvent).toBe(true);
                isUsingKeyEvent = null;
                expect(isUsingKeyEvent).toBe(null);
                await user.type(input, '{ArrowRight}');
                expect(isUsingKeyEvent).toBe(true);
            });

            it('detects that checkbox <input>s use spacebar and enter events', async () => {
                const user = userEvent.setup();
                render(<input onKeyDown={handleKeyEvent} type="checkbox" />);
                const input = screen.getByRole('checkbox');
                expect(isUsingKeyEvent).toBe(null);
                await user.type(input, 'A');
                expect(isUsingKeyEvent).toBe(false);
                isUsingKeyEvent = null;
                await user.type(input, ' ');
                expect(isUsingKeyEvent).toBe(true);
            });
        });
    });
});
