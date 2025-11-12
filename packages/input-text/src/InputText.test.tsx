// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import InputText from './InputText.js';

afterEach(cleanup);

describe('CSSValueInput.tsx', () => {
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

    it('triggers onChange and onChangeValue when discarding changes via Escape with discardOnEscape', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onChangeValue = vi.fn();
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
        const onChange = vi.fn();
        const onChangeValue = vi.fn();
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
});
