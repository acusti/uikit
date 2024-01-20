// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { afterEach, describe, expect, it } from 'vitest';

import InputText from './InputText.js';

afterEach(cleanup);

describe('CSSValueInput.tsx', () => {
    it('renders a text input with the given props.initialValue', () => {
        render(<InputText initialValue="foo Bar" />);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const input = screen.getByRole('textbox') as HTMLInputElement;
        expect(input.value).toBe('foo Bar');
    });

    it('allows value state to diverge from initialValue when updated by user but resets value state if initialValue changes', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<InputText initialValue="foo Bar" />);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
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
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea.value).toBe(longText);
        await user.type(textarea, '{Enter}New line');
        expect(textarea.value).toBe(longText + '\nNew line');
    });
});
