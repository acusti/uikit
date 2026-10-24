// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CSSValueInput from './CSSValueInput.js';

const noop = () => {}; // eslint-disable-line no-empty-function

afterEach(cleanup);

describe('CSSValueInput.tsx', () => {
    it('renders a text input with the given props.value', () => {
        render(<CSSValueInput onSubmitValue={noop} value="24px" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('24px');
    });

    it('handles ↑/↓ keys to increment/decrement by 1 and ⇧↑/⇧↓ to increment/decrement by 10 (preserving the CSS unit)', async () => {
        const user = userEvent.setup();
        render(<CSSValueInput onSubmitValue={noop} value="75%" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('75%');
        await user.type(input, '{ArrowUp}');
        expect(input.value).toBe('76%');
        await user.type(input, '{Shift>}{ArrowUp}{/Shift}');
        expect(input.value).toBe('86%');
        await user.type(input, '{Shift>}{ArrowUp}{/Shift}');
        expect(input.value).toBe('96%');
        await user.type(input, '{ArrowUp}');
        expect(input.value).toBe('97%');
        await user.type(input, '{Shift>}{ArrowDown}{/Shift}');
        expect(input.value).toBe('87%');
        await user.type(input, '{Shift>}{ArrowDown}{/Shift}');
        expect(input.value).toBe('77%');
    });

    it('steps from a numeric props.placeholder when the input is empty', async () => {
        const user = userEvent.setup();
        render(
            <CSSValueInput
                allowEmpty
                onSubmitValue={noop}
                placeholder="100vw"
                value=""
            />,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('');
        await user.type(input, '{ArrowUp}');
        expect(input.value).toBe('101vw');
    });

    it('supports custom props.step for ↑/↓ key handling', async () => {
        const user = userEvent.setup();
        render(<CSSValueInput onSubmitValue={noop} step={0.1} value="2rem" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('2rem');
        await user.type(input, '{ArrowUp}');
        expect(input.value).toBe('2.1rem');
        await user.type(input, '{Shift>}{ArrowUp}{/Shift}');
        expect(input.value).toBe('3.1rem');
        await user.type(input, '{Shift>}{ArrowUp}{/Shift}');
        expect(input.value).toBe('4.1rem');
        await user.type(input, '{ArrowUp}');
        expect(input.value).toBe('4.2rem');
        await user.type(input, '{Shift>}{ArrowDown}{/Shift}');
        expect(input.value).toBe('3.2rem');
        await user.type(input, '{Shift>}{ArrowDown}{/Shift}');
        expect(input.value).toBe('2.2rem');
    });

    it('uses props.unit as default unit when unit is missing', async () => {
        const user = userEvent.setup();
        render(<CSSValueInput allowEmpty onSubmitValue={noop} unit="px" value="" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('');
        await user.type(input, '14{Enter}');
        expect(input.value).toBe('14px');
    });

    it('preserves last entered unit if different from props.unit when unit is missing', async () => {
        const user = userEvent.setup();
        render(<CSSValueInput allowEmpty onSubmitValue={noop} unit="px" value="" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('');
        await user.type(input, '25vw{Enter}');
        expect(input.value).toBe('25vw');
        await user.type(input, '50{Enter}');
        expect(input.value).toBe('50vw');
    });

    it('treats value as numeric if props.unit is an empty string', async () => {
        const user = userEvent.setup();
        render(<CSSValueInput allowEmpty onSubmitValue={noop} unit="" value="100" />);
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('100');
        await user.type(input, '1{Enter}');
        expect(input.value).toBe('1');
        await user.type(input, '{Shift>}{ArrowUp}{/Shift}');
        expect(input.value).toBe('11');
        await user.clear(input);
        expect(input.value).toBe('');
        await user.type(input, '200{Enter}');
        expect(input.value).toBe('200');
    });

    it('updates default unit as props.unit and props.value changes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(
            <CSSValueInput onSubmitValue={noop} unit="px" value="12px" />,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;
        rerender(<CSSValueInput onSubmitValue={noop} unit="" value="4" />);
        expect(input.value).toBe('4');
        await user.type(input, '25{Enter}');
        expect(input.value).toBe('25');
        rerender(<CSSValueInput onSubmitValue={noop} unit="rad" value="3rad" />);
        expect(input.value).toBe('3rad');
        await user.type(input, '-4.1{Enter}');
        expect(input.value).toBe('-4.1rad');
    });

    it('submits the ancestor form and normalizes the value on Enter', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn<() => void>();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
            >
                <CSSValueInput allowEmpty onSubmitValue={noop} unit="px" value="" />
            </form>,
        );
        const input = screen.getByRole('textbox') as HTMLInputElement;

        await user.type(input, '14{Enter}');

        expect(input.value).toBe('14px');
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    // The arrows that move through an IME’s candidates (e.g. of Japanese
    // or Chinese) are the IME’s, so they don’t step the value, aren’t
    // prevented or stopped, and their keyup doesn’t submit. A keydown of one
    // comes while the composition is under way (isComposing), or after it has
    // already ended, when only its keyCode gives it away. A keyup has no such
    // keyCode: it reports the key’s real one, and only isComposing marks it
    describe('an arrow key that an IME is taking', () => {
        const IME_KEYS = [
            { init: { isComposing: true }, label: 'isComposing' },
            { init: { keyCode: 229 }, label: 'keyCode 229' },
        ];
        const ARROWS = [
            { key: 'ArrowDown', keyCode: 40, stepped: '9px' },
            { key: 'ArrowUp', keyCode: 38, stepped: '11px' },
        ];
        const CASES = ARROWS.flatMap((arrow) =>
            IME_KEYS.map(({ init, label }) => ({ ...arrow, init, label })),
        );

        it.each(CASES)(
            'still passes $key to onKeyDown and onKeyUp ($label)',
            ({ init, key, keyCode }) => {
                const onKeyDown = vi.fn<(event: { key: string }) => void>();
                const onKeyUp =
                    vi.fn<(event: { key: string; keyCode: number }) => void>();
                render(
                    <CSSValueInput
                        onKeyDown={onKeyDown}
                        onKeyUp={onKeyUp}
                        onSubmitValue={noop}
                        value="10px"
                    />,
                );
                const input = screen.getByRole('textbox');

                fireEvent.keyDown(input, { ...init, key });
                expect(onKeyDown).toHaveBeenCalledTimes(1);
                expect(onKeyDown).toHaveBeenCalledWith(expect.objectContaining({ key }));
                fireEvent.keyUp(input, { isComposing: true, key, keyCode });
                expect(onKeyUp).toHaveBeenCalledTimes(1);
                expect(onKeyUp).toHaveBeenCalledWith(
                    expect.objectContaining({ key, keyCode }),
                );
            },
        );

        it.each(CASES)(
            'doesn’t stop $key from reaching an ancestor’s onKeyDown ($label)',
            ({ init, key }) => {
                const onAncestorKeyDown = vi.fn<(event: { key: string }) => void>();
                render(
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                    <div onKeyDown={onAncestorKeyDown}>
                        <CSSValueInput onSubmitValue={noop} value="10px" />
                    </div>,
                );

                fireEvent.keyDown(screen.getByRole('textbox'), { ...init, key });
                expect(onAncestorKeyDown).toHaveBeenCalledTimes(1);
                expect(onAncestorKeyDown).toHaveBeenCalledWith(
                    expect.objectContaining({ key }),
                );
            },
        );

        it.each(CASES)(
            'doesn’t step the value, prevent $key, or submit on its keyup ($label)',
            ({ init, key, keyCode }) => {
                const onSubmitValue = vi.fn<() => void>();
                render(<CSSValueInput onSubmitValue={onSubmitValue} value="10px" />);
                const input = screen.getByRole('textbox') as HTMLInputElement;

                expect(fireEvent.keyDown(input, { ...init, key })).toBe(true);
                expect(input.value).toBe('10px');
                // the keyup reports the key’s real keyCode, and isComposing
                fireEvent.keyUp(input, { isComposing: true, key, keyCode });
                expect(input.value).toBe('10px');
                expect(onSubmitValue).not.toHaveBeenCalled();
            },
        );

        it.each(ARROWS)(
            'doesn’t submit on a keyup of $key that carries isComposing',
            ({ key, keyCode }) => {
                const onSubmitValue = vi.fn<() => void>();
                render(<CSSValueInput onSubmitValue={onSubmitValue} value="10px" />);
                const input = screen.getByRole('textbox') as HTMLInputElement;

                fireEvent.keyUp(input, { isComposing: true, key, keyCode });
                expect(onSubmitValue).not.toHaveBeenCalled();
            },
        );

        it.each(CASES)(
            'steps and submits on a plain $key afterwards ($label)',
            ({ init, key, keyCode, stepped }) => {
                const onSubmitValue = vi.fn<() => void>();
                render(<CSSValueInput onSubmitValue={onSubmitValue} value="10px" />);
                const input = screen.getByRole('textbox') as HTMLInputElement;

                fireEvent.keyDown(input, { ...init, key });
                fireEvent.keyUp(input, { isComposing: true, key, keyCode });
                expect(onSubmitValue).not.toHaveBeenCalled();

                expect(fireEvent.keyDown(input, { key, keyCode })).toBe(false);
                expect(input.value).toBe(stepped);
                expect(onSubmitValue).not.toHaveBeenCalled();
                fireEvent.keyUp(input, { key, keyCode });
                expect(onSubmitValue).toHaveBeenCalledTimes(1);
                expect(onSubmitValue).toHaveBeenCalledWith(stepped);
            },
        );
    });

    it('forwards aria-* attributes and role to the input, not the wrapper label', () => {
        render(
            <CSSValueInput
                aria-describedby="hint-id"
                aria-invalid
                onSubmitValue={noop}
                role="spinbutton"
                title="Width"
                value="24px"
            />,
        );
        const input = screen.getByRole('spinbutton');
        expect(input.tagName).toBe('INPUT');
        expect(input.getAttribute('aria-describedby')).toBe('hint-id');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        const wrapper = input.closest('label')!;
        expect(wrapper.hasAttribute('aria-describedby')).toBe(false);
        expect(wrapper.hasAttribute('role')).toBe(false);
    });

    it('names the input by props aria-label ahead of props.label and props.title', () => {
        render(
            <CSSValueInput
                aria-label="Width"
                label="W"
                onSubmitValue={noop}
                title="Element width"
                value="24px"
            />,
        );
        expect(screen.getByRole('textbox', { name: 'Width' })).toBeTruthy();
    });
});
