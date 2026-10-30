// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import type { Props } from './InputText.js';

// Stub CSS.supports to return false for field-sizing to test fallback behavior
vi.stubGlobal('CSS', {
    supports: (property: string, value: string) => {
        if (property === 'field-sizing' && value === 'content') {
            return false;
        }
        return true;
    },
});

const { default: InputText, isIMEKeyEvent } = await import('./InputText.js');

vi.unstubAllGlobals();

// Passes each change back as initialValue, as a parent does with
// onChangeValue={setValue} and initialValue={value}
function EchoingInputText(props: Props) {
    const [value, setValue] = useState('');
    return <InputText {...props} initialValue={value} onChangeValue={setValue} />;
}

// happy-dom does no layout, so give each textarea a scrollHeight that grows
// with its value: 20px when empty, plus 1px per character
function stubTextareaScrollHeight() {
    const scrollHeight = vi
        .spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get')
        .mockImplementation(function (this: HTMLTextAreaElement) {
            return 20 + this.value.length;
        });
    onTestFinished(() => {
        scrollHeight.mockRestore();
    });
    return scrollHeight;
}

afterEach(cleanup);

describe('InputText.tsx', () => {
    it('renders a text input with the given props.initialValue', () => {
        render(<InputText initialValue="foo Bar" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('foo Bar');
    });

    it('allows value state to diverge from initialValue when updated by user but resets value state if initialValue changes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<InputText initialValue="foo Bar" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('foo Bar');
        await user.type(input, '{ArrowLeft}{ArrowLeft}{ArrowLeft}{Delete}b');
        expect(input.value).toBe('foo bar');
        // re-render with same initialValue, value state shouldn’t change
        rerender(<InputText initialValue="foo Bar" />);
        expect(input.value).toBe('foo bar');
        // re-render with different initialValue, value state should reset
        rerender(<InputText initialValue="foo Bar " />);
        expect(input.value).toBe('foo Bar ');
    });

    it('shows a new initialValue in the same commit as the rest of the render that sets it', async () => {
        // empties its input once a save resolves, so the update comes from a
        // timer rather than straight from the click
        function NoteForm() {
            const [note, setNote] = useState('');
            const [savedNote, setSavedNote] = useState<null | string>(null);
            const save = () => {
                setTimeout(() => {
                    setSavedNote(note);
                    setNote('');
                }, 0);
            };
            return (
                <>
                    <InputText initialValue={note} onChangeValue={setNote} />
                    <button onClick={save} type="button">
                        Save
                    </button>
                    {savedNote == null ? null : <p>{`Saved ${savedNote}`}</p>}
                </>
            );
        }
        const { container } = render(<NoteForm />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Buy milk' } });

        // A MutationObserver callback is a microtask, so it reads the input
        // right after the commit that shows the saved note and before that
        // commit’s passive effects, which React runs as a separate task
        let valueInGap: null | string = null;
        const observer = new MutationObserver(() => {
            if (screen.queryByText('Saved Buy milk') == null) return;
            observer.disconnect();
            valueInGap = input.value;
        });
        observer.observe(container, { childList: true, subtree: true });

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(valueInGap).not.toBeNull());
        expect(valueInGap).toBe('');
    });

    // A parent that passes each change back as initialValue gives the input
    // the value it already has. Writing it to the input anyway ends an IME
    // composition in progress (seen in Safari)
    it.each([false, true])(
        'leaves the value alone when initialValue changes to the value the input already has (multiLine: %s)',
        (multiLine) => {
            render(<EchoingInputText multiLine={multiLine} />);
            const input = screen.getByRole('textbox') as HTMLInputElement;
            const setInputValue = vi.spyOn(input, 'value', 'set');

            fireEvent.change(input, { target: { value: 'a' } });
            fireEvent.change(input, { target: { value: 'ab' } });
            expect(input.value).toBe('ab');
            expect(setInputValue).not.toHaveBeenCalled();
        },
    );

    it('resets to the latest initialValue on Escape with discardOnEscape, even if the input already had it', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<InputText discardOnEscape initialValue="" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        await user.type(input, 'ab');
        // e.g. a parent that saves what was typed while the input keeps focus
        rerender(<InputText discardOnEscape initialValue="ab" />);
        await user.type(input, 'c');
        expect(input.value).toBe('abc');
        await user.keyboard('{Escape}');
        expect(input.value).toBe('ab');
    });

    it('supports rendering multi-line inputs as a <textarea>', async () => {
        const user = userEvent.setup();
        const longText =
            'Lorem ipsum dolor sit amet. Consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi';
        render(<InputText initialValue={longText} multiLine />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.value).toBe(longText);
        await user.type(textarea, '{Enter}New line');
        expect(textarea.value).toBe(longText + '\nNew line');
    });

    it('triggers onPaste for text inputs and multi-line inputs', () => {
        const pasteTargets: Array<EventTarget | null> = [];
        const onPaste = vi.fn<(event: { currentTarget: EventTarget | null }) => void>(
            (event) => {
                pasteTargets.push(event.currentTarget);
            },
        );
        const { rerender } = render(<InputText onPaste={onPaste} />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.paste(input, {
            clipboardData: {
                getData: () => 'from clipboard',
            },
        });

        expect(onPaste).toHaveBeenCalledTimes(1);
        expect(pasteTargets[0]).toBe(input);

        rerender(<InputText multiLine onPaste={onPaste} />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

        fireEvent.paste(textarea, {
            clipboardData: {
                getData: () => 'from clipboard',
            },
        });

        expect(onPaste).toHaveBeenCalledTimes(2);
        expect(pasteTargets[1]).toBe(textarea);
    });

    it('triggers onChange and onChangeValue when discarding changes via Escape with discardOnEscape', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn<() => void>();
        const onChangeValue = vi.fn<() => void>();
        render(
            <InputText
                discardOnEscape
                initialValue="original"
                onChange={onChange}
                onChangeValue={onChangeValue}
            />,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;

        // Type some text to modify the value
        await user.type(input, ' modified');
        expect(input.value).toBe('original modified');

        // onChange and onChangeValue should be called for each character typed
        expect(onChange).toHaveBeenCalled();
        expect(onChangeValue).toHaveBeenCalled();

        // Clear the mock calls
        onChange.mockClear();
        onChangeValue.mockClear();

        // Press Escape to discard changes
        await user.keyboard('{Escape}');

        // Value should be reset to original
        expect(input.value).toBe('original');

        // onChange and onChangeValue should be called when value is reset
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChangeValue).toHaveBeenCalledTimes(1);
        expect(onChangeValue).toHaveBeenCalledWith('original');
    });

    it('does not trigger onChange when discarding via Escape if value has not changed', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn<() => void>();
        const onChangeValue = vi.fn<() => void>();
        render(
            <InputText
                discardOnEscape
                initialValue="original"
                onChange={onChange}
                onChangeValue={onChangeValue}
            />,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;

        // Focus the input without changing the value
        await user.click(input);

        // Clear any mock calls from focusing
        onChange.mockClear();
        onChangeValue.mockClear();

        // Press Escape without making changes
        await user.keyboard('{Escape}');

        // Value should still be original
        expect(input.value).toBe('original');

        // onChange and onChangeValue should NOT be called since value didn't change
        expect(onChange).not.toHaveBeenCalled();
        expect(onChangeValue).not.toHaveBeenCalled();
    });

    it('blurs the input by default when pressing Enter with submitOnEnter', async () => {
        const user = userEvent.setup();
        const onBlur = vi.fn<() => void>();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText initialValue="hello" onBlur={onBlur} submitOnEnter />
            </form>,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        await user.click(input);
        await user.keyboard('{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('keeps focus when pressing Enter with submitOnEnter and keepFocusOnSubmit', async () => {
        const user = userEvent.setup();
        const onBlur = vi.fn<() => void>();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText
                    initialValue="hello"
                    keepFocusOnSubmit
                    onBlur={onBlur}
                    submitOnEnter
                />
            </form>,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        await user.click(input);
        await user.keyboard('{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onBlur).not.toHaveBeenCalled();
    });

    // With submitOnEnter, Enter is only prevented where it has a default
    // action to stop: a form’s implicit submission (the component submits the
    // form itself) or a textarea’s line break. Everywhere else it reaches the
    // input’s ancestors as it would from a plain <input>, so that they can
    // tell it apart from an Enter that a handler took for something else.
    // fireEvent returns false if a handler prevented the event
    describe('preventing Enter with submitOnEnter', () => {
        it('leaves Enter alone in a single-line input that no form owns, and still blurs the input', async () => {
            const user = userEvent.setup();
            render(<InputText initialValue="hello" submitOnEnter />);
            const input = screen.getByRole('textbox') as HTMLInputElement;
            await user.click(input);
            expect(input.matches(':focus')).toBe(true);

            expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
            expect(input.matches(':focus')).toBe(false);
        });

        it('leaves Enter alone in a single-line input that no form owns, and keeps the focus with keepFocusOnSubmit', async () => {
            const user = userEvent.setup();
            render(<InputText initialValue="hello" keepFocusOnSubmit submitOnEnter />);
            const input = screen.getByRole('textbox') as HTMLInputElement;
            await user.click(input);

            expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(true);
            expect(input.matches(':focus')).toBe(true);
        });

        it.each([false, true])(
            'prevents Enter in a single-line input that a form owns, so the form is only submitted once (keepFocusOnSubmit: %s)',
            async (keepFocusOnSubmit) => {
                const user = userEvent.setup();
                const onSubmit = vi.fn<() => void>();
                render(
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit();
                        }}
                    >
                        <InputText
                            initialValue="hello"
                            keepFocusOnSubmit={keepFocusOnSubmit}
                            submitOnEnter
                        />
                    </form>,
                );
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.click(input);
                // user.keyboard submits the form as a browser does (implicit
                // submission) if the keydown isn’t prevented and the input
                // still has the focus, which would be a second submit
                await user.keyboard('{Enter}');
                expect(onSubmit).toHaveBeenCalledTimes(1);
                expect(input.matches(':focus')).toBe(keepFocusOnSubmit);

                expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);
            },
        );

        // The form that owns an input is the one the browser would submit:
        // the form named by the input’s form prop, wherever the input is, and
        // otherwise the form the input is inside. (An input inside one form
        // whose form prop names another form, or no form at all, can’t be
        // tested here: happy-dom reports the form it is inside as its owner.)
        it.each([false, true])(
            'prevents Enter in a single-line input tied to a form by its form prop, and submits that form once (keepFocusOnSubmit: %s)',
            async (keepFocusOnSubmit) => {
                const user = userEvent.setup();
                const onSubmit = vi.fn<() => void>();
                render(
                    <>
                        <form
                            id="owner"
                            onSubmit={(event) => {
                                event.preventDefault();
                                onSubmit();
                            }}
                        />
                        <InputText
                            form="owner"
                            initialValue="hello"
                            keepFocusOnSubmit={keepFocusOnSubmit}
                            submitOnEnter
                        />
                    </>,
                );
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.click(input);
                await user.keyboard('{Enter}');
                expect(onSubmit).toHaveBeenCalledTimes(1);
                expect(input.matches(':focus')).toBe(keepFocusOnSubmit);

                expect(fireEvent.keyDown(input, { key: 'Enter' })).toBe(false);
            },
        );

        it.each([
            { inForm: false, keepFocusOnSubmit: false },
            { inForm: false, keepFocusOnSubmit: true },
            { inForm: true, keepFocusOnSubmit: false },
            { inForm: true, keepFocusOnSubmit: true },
        ])(
            'prevents Enter in a multiLine input, so no line break is added (in a form: $inForm, keepFocusOnSubmit: $keepFocusOnSubmit)',
            async ({ inForm, keepFocusOnSubmit }) => {
                const user = userEvent.setup();
                const onSubmit = vi.fn<() => void>();
                const inputText = (
                    <InputText
                        initialValue="hello"
                        keepFocusOnSubmit={keepFocusOnSubmit}
                        multiLine
                        submitOnEnter
                    />
                );
                render(
                    inForm ? (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                onSubmit();
                            }}
                        >
                            {inputText}
                        </form>
                    ) : (
                        inputText
                    ),
                );
                const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
                await user.click(textarea);
                // user.keyboard adds the line break as a browser does if the
                // keydown isn’t prevented and the textarea still has the focus
                await user.keyboard('{Enter}');
                expect(textarea.value).toBe('hello');
                expect(onSubmit).toHaveBeenCalledTimes(inForm ? 1 : 0);
                expect(textarea.matches(':focus')).toBe(keepFocusOnSubmit);

                expect(fireEvent.keyDown(textarea, { key: 'Enter' })).toBe(false);
            },
        );
    });

    // A key that an IME is taking (the Enter that commits a composition, e.g.
    // of Japanese, Chinese or Korean, or the Escape that cancels it) is the
    // IME’s, so the component doesn’t act on it or prevent it. It comes while
    // the composition is under way (isComposing), or after the composition has
    // already ended, when only its keyCode gives it away
    describe('a key that an IME is taking', () => {
        const IME_KEYS = [
            { init: { isComposing: true }, label: 'isComposing' },
            { init: { keyCode: 229 }, label: 'keyCode 229' },
        ];
        const PLAIN_ENTER = { key: 'Enter', keyCode: 13 };
        const PLAIN_ESCAPE = { key: 'Escape', keyCode: 27 };

        it.each(
            ['Enter', 'Escape'].flatMap((key) =>
                IME_KEYS.map(({ init, label }) => ({
                    init: { ...init, key },
                    key,
                    label,
                })),
            ),
        )('still passes $key to onKeyDown ($label)', ({ init }) => {
            const onKeyDown = vi.fn<() => void>();
            render(<InputText discardOnEscape onKeyDown={onKeyDown} submitOnEnter />);

            fireEvent.keyDown(screen.getByRole('textbox'), init);
            expect(onKeyDown).toHaveBeenCalledTimes(1);
        });

        it.each(IME_KEYS)(
            'doesn’t submit or blur a single-line input that a form owns on Enter, and the next Enter does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                const onSubmit = vi.fn<() => void>();
                render(
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit();
                        }}
                    >
                        <InputText initialValue="hello" submitOnEnter />
                    </form>,
                );
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.click(input);

                expect(fireEvent.keyDown(input, { ...init, key: 'Enter' })).toBe(true);
                expect(onSubmit).not.toHaveBeenCalled();
                expect(input.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(input, PLAIN_ENTER)).toBe(false);
                expect(onSubmit).toHaveBeenCalledTimes(1);
                expect(input.matches(':focus')).toBe(false);
            },
        );

        it.each(IME_KEYS)(
            'doesn’t blur a single-line input that no form owns on Enter, and the next Enter does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                render(<InputText initialValue="hello" submitOnEnter />);
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.click(input);

                expect(fireEvent.keyDown(input, { ...init, key: 'Enter' })).toBe(true);
                expect(input.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(input, PLAIN_ENTER)).toBe(true);
                expect(input.matches(':focus')).toBe(false);
            },
        );

        it.each(IME_KEYS)(
            'doesn’t submit or blur a multiLine input on Enter, and the next Enter does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                const onSubmit = vi.fn<() => void>();
                render(
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit();
                        }}
                    >
                        <InputText initialValue="hello" multiLine submitOnEnter />
                    </form>,
                );
                const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
                await user.click(textarea);

                expect(fireEvent.keyDown(textarea, { ...init, key: 'Enter' })).toBe(true);
                expect(onSubmit).not.toHaveBeenCalled();
                expect(textarea.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(textarea, PLAIN_ENTER)).toBe(false);
                expect(onSubmit).toHaveBeenCalledTimes(1);
                expect(textarea.matches(':focus')).toBe(false);
            },
        );

        it.each(IME_KEYS)(
            'doesn’t submit or blur a multiLine input on the primary modifier plus Enter, and the next one does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                const onSubmit = vi.fn<() => void>();
                render(
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit();
                        }}
                    >
                        <InputText initialValue="hello" multiLine />
                    </form>,
                );
                const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
                await user.click(textarea);
                // eslint-disable-next-line typescript/no-deprecated
                const isApple = /mac|iphone|ipad|ipod/i.test(
                    globalThis.navigator?.platform ?? '',
                );
                const modifier = isApple ? { metaKey: true } : { ctrlKey: true };

                expect(
                    fireEvent.keyDown(textarea, { ...init, ...modifier, key: 'Enter' }),
                ).toBe(true);
                expect(onSubmit).not.toHaveBeenCalled();
                expect(textarea.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(textarea, { ...PLAIN_ENTER, ...modifier })).toBe(
                    false,
                );
                expect(onSubmit).toHaveBeenCalledTimes(1);
                expect(textarea.matches(':focus')).toBe(false);
            },
        );

        it.each(IME_KEYS)(
            'doesn’t finish editing a doubleClickToEdit input on Enter, and the next Enter does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                render(<InputText doubleClickToEdit initialValue="hello" />);
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.dblClick(input);
                expect(input.readOnly).toBe(false);

                expect(fireEvent.keyDown(input, { ...init, key: 'Enter' })).toBe(true);
                expect(input.readOnly).toBe(false);
                expect(input.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(input, PLAIN_ENTER)).toBe(true);
                expect(input.readOnly).toBe(true);
                expect(input.matches(':focus')).toBe(false);
            },
        );

        it.each(IME_KEYS)(
            'doesn’t discard the changes to a discardOnEscape input or blur it on Escape, and the next Escape does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                render(<InputText discardOnEscape initialValue="hello" />);
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.type(input, ' world');
                expect(input.value).toBe('hello world');

                expect(fireEvent.keyDown(input, { ...init, key: 'Escape' })).toBe(true);
                expect(input.value).toBe('hello world');
                expect(input.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(input, PLAIN_ESCAPE)).toBe(true);
                expect(input.value).toBe('hello');
                expect(input.matches(':focus')).toBe(false);
            },
        );

        it.each(IME_KEYS)(
            'doesn’t finish editing a doubleClickToEdit input on Escape, and the next Escape does ($label)',
            async ({ init }) => {
                const user = userEvent.setup();
                render(<InputText doubleClickToEdit initialValue="hello" />);
                const input = screen.getByRole('textbox') as HTMLInputElement;
                await user.dblClick(input);
                expect(input.readOnly).toBe(false);

                expect(fireEvent.keyDown(input, { ...init, key: 'Escape' })).toBe(true);
                expect(input.readOnly).toBe(false);
                expect(input.matches(':focus')).toBe(true);

                expect(fireEvent.keyDown(input, PLAIN_ESCAPE)).toBe(true);
                expect(input.readOnly).toBe(true);
                expect(input.matches(':focus')).toBe(false);
            },
        );
    });

    it('allows Shift+Enter to insert a newline for multiLine submitOnEnter inputs with doubleClickToEdit', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText
                    doubleClickToEdit
                    initialValue="hello"
                    multiLine
                    submitOnEnter
                />
            </form>,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

        await user.dblClick(textarea);
        textarea.selectionStart = textarea.value.length;
        textarea.selectionEnd = textarea.value.length;
        await user.keyboard('{Shift>}{Enter}{/Shift}');
        await user.type(textarea, 'world');

        expect(textarea.value).toBe('hello\nworld');
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('enters edit mode when pressing Enter on a focused readOnly doubleClickToEdit input', async () => {
        const user = userEvent.setup();
        render(<InputText doubleClickToEdit initialValue="hello" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;

        expect(input.readOnly).toBe(true);

        await user.click(input);
        await user.keyboard('{Enter}');

        expect(input.readOnly).toBe(false);
        expect(input.matches(':focus')).toBe(true);
    });

    it('enters edit mode instead of submitting when pressing Enter on a focused readOnly multiLine input with submitOnEnter and doubleClickToEdit', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText
                    doubleClickToEdit
                    initialValue="hello"
                    multiLine
                    submitOnEnter
                />
            </form>,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

        expect(textarea.readOnly).toBe(true);

        await user.click(textarea);
        await user.keyboard('{Enter}');

        expect(textarea.readOnly).toBe(false);
        expect(textarea.matches(':focus')).toBe(true);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits when pressing the primary modifier plus Enter while editing a multiLine input with submitOnEnter and doubleClickToEdit', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText
                    doubleClickToEdit
                    initialValue="hello"
                    multiLine
                    submitOnEnter
                />
            </form>,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

        await user.dblClick(textarea);

        // Use the current platform's primary modifier so this test is stable
        // on both macOS and non-Apple environments.
        // eslint-disable-next-line typescript/no-deprecated
        if (/mac|iphone|ipad|ipod/i.test(globalThis.navigator?.platform ?? '')) {
            await user.keyboard('{Meta>}{Enter}{/Meta}');
        } else {
            await user.keyboard('{Control>}{Enter}{/Control}');
        }

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(textarea.readOnly).toBe(true);
        expect(textarea.matches(':focus')).toBe(false);
    });

    it('submits when pressing Enter while already editing a multiLine input with submitOnEnter and doubleClickToEdit', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText
                    doubleClickToEdit
                    initialValue="hello"
                    multiLine
                    submitOnEnter
                />
            </form>,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

        await user.dblClick(textarea);
        await user.keyboard('{Enter}');

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(textarea.readOnly).toBe(true);
        expect(textarea.matches(':focus')).toBe(false);
    });

    it('discards changes when pressing Escape while editing a multiLine input with submitOnEnter and doubleClickToEdit', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <InputText
                    discardOnEscape
                    doubleClickToEdit
                    initialValue="hello"
                    multiLine
                    submitOnEnter
                />
            </form>,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

        await user.dblClick(textarea);
        await user.type(textarea, ' world');
        await user.keyboard('{Escape}');

        expect(textarea.value).toBe('hello');
        expect(textarea.readOnly).toBe(true);
        expect(textarea.matches(':focus')).toBe(false);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('respects minHeight prop for multiLine inputs', async () => {
        const user = userEvent.setup();
        render(<InputText initialValue="" minHeight={100} multiLine rows={1} />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        // Focus the textarea to trigger height calculation
        await user.click(textarea);
        // Initial height should be at least minHeight
        expect(parseFloat(textarea.style.height)).toBe(100);
        // Type some text
        await user.type(textarea, 'Line 1\nLine 2\nLine 3');
        // Height should still be at least minHeight
        expect(parseFloat(textarea.style.height)).toBe(100);
    });

    // NOTE cannot test maxHeight prop for multiLine inputs in happy-dom
    // due to limitations in how it calculates layout and dimensions

    it('respects both minHeight and maxHeight props together', async () => {
        const user = userEvent.setup();
        render(
            <InputText
                initialValue=""
                maxHeight={100}
                minHeight={50}
                multiLine
                rows={1}
            />,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        // Focus the textarea to trigger height calculation
        await user.click(textarea);
        // Initial height should be between minHeight and maxHeight
        const height = parseFloat(textarea.style.height);

        expect(height).toBeGreaterThanOrEqual(50);
        expect(height).toBeLessThanOrEqual(100);
    });

    it('keeps the transition timings from the style prop when a multiLine input is fitted twice in one task', () => {
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const style = { transitionDuration: '200ms' };
        // an inline callback ref is a new function each render, so each
        // render runs the ref callback again, which fits the textarea
        const { rerender } = render(
            <InputText multiLine ref={vi.fn<() => void>()} style={style} />,
        );
        rerender(<InputText multiLine ref={vi.fn<() => void>()} style={style} />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.style.transitionDuration).toBe('0s');
        vi.runAllTimers();
        expect(textarea.style.transitionDuration).toBe('200ms');
    });

    it.each([
        ['fitted again by an inline callback ref', () => vi.fn<() => void>()],
        ['not fitted again', () => undefined],
    ])(
        'keeps a transition timing that the style prop changes before the restore (a multiLine input %s)',
        (_, getRef) => {
            vi.useFakeTimers();
            onTestFinished(() => {
                vi.useRealTimers();
            });
            const { rerender } = render(
                <InputText
                    multiLine
                    ref={getRef()}
                    style={{ transitionDuration: '200ms' }}
                />,
            );
            rerender(
                <InputText
                    multiLine
                    ref={getRef()}
                    style={{ transitionDuration: '300ms' }}
                />,
            );
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            vi.runAllTimers();
            expect(textarea.style.transitionDuration).toBe('300ms');
        },
    );

    it('resizes a multiLine input to fit a new initialValue', () => {
        stubTextareaScrollHeight();
        // e.g. a note field that its parent empties once the note is saved
        const { rerender } = render(
            <InputText initialValue={'x'.repeat(200)} multiLine />,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.style.height).toBe('220px');
        rerender(<InputText initialValue="" multiLine />);
        expect(textarea.value).toBe('');
        expect(textarea.style.height).toBe('20px');
    });

    it('resizes a multiLine input that hasn’t been typed in to fit a new initialValue', () => {
        stubTextareaScrollHeight();
        // e.g. an edit form that mounts empty and gets its record once it loads
        const { rerender } = render(<InputText initialValue="" multiLine />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.style.height).toBe('20px');
        rerender(<InputText initialValue={'x'.repeat(200)} multiLine />);
        expect(textarea.value).toBe('x'.repeat(200));
        expect(textarea.style.height).toBe('220px');
    });

    it('keeps the transition timings from the style prop when a new initialValue and minHeight resize a multiLine input', () => {
        stubTextareaScrollHeight();
        vi.useFakeTimers();
        onTestFinished(() => {
            vi.useRealTimers();
        });
        const style = { transitionDuration: '200ms' };
        const { rerender } = render(
            <InputText
                initialValue={'x'.repeat(200)}
                minHeight={10}
                multiLine
                style={style}
            />,
        );
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        vi.runAllTimers();
        // the new minHeight gives the ref callback a new identity, so it fits
        // the old value, and the new initialValue is fitted in the same commit
        rerender(<InputText initialValue="" minHeight={15} multiLine style={style} />);
        expect(textarea.style.height).toBe('20px');
        vi.runAllTimers();
        expect(textarea.style.transitionDuration).toBe('200ms');
    });

    it('measures a multiLine input once per keystroke when its parent passes each change back as initialValue', () => {
        const scrollHeight = stubTextareaScrollHeight();
        render(<EchoingInputText multiLine />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        scrollHeight.mockClear();
        fireEvent.input(textarea, { target: { value: 'a' } });
        fireEvent.input(textarea, { target: { value: 'ab' } });
        fireEvent.input(textarea, { target: { value: 'abc' } });
        expect(textarea.style.height).toBe('23px');
        expect(scrollHeight).toHaveBeenCalledTimes(3);
    });

    it('resizes a multiLine input to fit the value that Escape restores with discardOnEscape', async () => {
        stubTextareaScrollHeight();
        const user = userEvent.setup();
        render(<InputText discardOnEscape multiLine />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        await user.click(textarea);
        fireEvent.input(textarea, { target: { value: 'x'.repeat(100) } });
        expect(textarea.style.height).toBe('120px');
        await user.keyboard('{Escape}');
        expect(textarea.value).toBe('');
        expect(textarea.style.height).toBe('20px');
    });

    it('forwards aria-* attributes and role to the input', () => {
        render(
            <InputText
                aria-controls="listbox-id"
                aria-expanded={false}
                aria-label="City"
                initialValue="Toronto"
                role="combobox"
            />,
        );
        const input = screen.getByRole('combobox');
        expect(input.tagName).toBe('INPUT');
        expect(input.getAttribute('aria-label')).toBe('City');
        expect(input.getAttribute('aria-controls')).toBe('listbox-id');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('forwards the inputMode prop to the input and to the textarea when multiLine', () => {
        const { rerender } = render(<InputText inputMode="numeric" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.inputMode).toBe('numeric');

        rerender(<InputText inputMode="search" multiLine />);
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.inputMode).toBe('search');
    });

    it('gives the forwarded ref the element it renders', () => {
        // Typing the ref as the textarea only compiles because props.ref takes
        // InputElement, so this covers the prop type as well as the behavior
        const textareaRef = createRef<HTMLTextAreaElement>();
        render(<InputText multiLine ref={textareaRef} />);
        expect(textareaRef.current?.tagName).toBe('TEXTAREA');

        // …and a narrowly typed input ref still works for the single-line case
        const inputRef = createRef<HTMLInputElement>();
        render(<InputText ref={inputRef} />);
        expect(inputRef.current?.tagName).toBe('INPUT');
    });

    it('forwards aria-* attributes to the textarea when multiLine', () => {
        render(<InputText aria-describedby="hint-id" aria-label="Notes" multiLine />);
        const textarea = screen.getByRole('textbox');
        expect(textarea.tagName).toBe('TEXTAREA');
        expect(textarea.getAttribute('aria-label')).toBe('Notes');
        expect(textarea.getAttribute('aria-describedby')).toBe('hint-id');
    });

    it('doesn’t let a forwarded prop override the props the component owns', async () => {
        const user = userEvent.setup();
        // Props models no prop that collides, but an untyped consumer can pass
        // one anyway. The rest is spread first, so the component’s own props
        // win: doubleClickToEdit’s handler survives a consumer’s onDoubleClick
        // (which is dropped) rather than being replaced by it.
        const onDoubleClick = vi.fn<() => void>();
        render(<InputText {...({ onDoubleClick } as Props)} doubleClickToEdit />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.readOnly).toBe(true);
        await user.dblClick(input);
        expect(input.readOnly).toBe(false);
        expect(onDoubleClick).not.toHaveBeenCalled();
    });
});

describe('isIMEKeyEvent', () => {
    // Whether isIMEKeyEvent says that the key event is an IME’s, for a keydown
    // (or a keyup) that reaches an input
    const isIMEKey = (
        init: { isComposing?: boolean; key: string; keyCode?: number },
        type: 'keyDown' | 'keyUp' = 'keyDown',
    ) => {
        const verdicts: Array<boolean> = [];
        const onKey = (event: Parameters<typeof isIMEKeyEvent>[0]) => {
            verdicts.push(isIMEKeyEvent(event));
        };
        render(<input onKeyDown={onKey} onKeyUp={onKey} />);
        fireEvent[type](screen.getByRole('textbox'), init);
        expect(verdicts).toHaveLength(1);
        return verdicts[0];
    };

    it('is true for a key while a composition is under way', () => {
        expect(isIMEKey({ isComposing: true, key: 'ArrowUp' })).toBe(true);
    });

    it('is true for a key with the keyCode 229 of an IME that has already ended its composition', () => {
        expect(isIMEKey({ key: 'Enter', keyCode: 229 })).toBe(true);
    });

    it('is true for a keyup while a composition is under way, with its real keyCode', () => {
        expect(
            isIMEKey({ isComposing: true, key: 'ArrowUp', keyCode: 38 }, 'keyUp'),
        ).toBe(true);
    });

    it('is false for a keyup of a key that ended the composition before it', () => {
        expect(isIMEKey({ key: 'ArrowUp', keyCode: 38 }, 'keyUp')).toBe(false);
    });

    it('is true for a key that has both', () => {
        expect(isIMEKey({ isComposing: true, key: 'Escape', keyCode: 229 })).toBe(true);
    });

    it.each([
        { key: 'ArrowUp', keyCode: 38 },
        { key: 'a', keyCode: 65 },
    ])('is false for $key, which has neither', (init) => {
        expect(isIMEKey(init)).toBe(false);
    });
});
