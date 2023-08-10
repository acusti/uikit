// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import CSSValueInput from './CSSValueInput.js';

const noop = () => {};

afterEach(cleanup);

describe('CSSValueInput.tsx', async () => {
    it('renders a text input with the given props.value', async () => {
        const { getByRole } = render(<CSSValueInput onSubmitValue={noop} value="24px" />);
        expect(getByRole('textbox').value).toBe('24px');
    });

    it('handles ↑/↓ keys to increment/decrement by 1 and ⇧↑/⇧↓ to increment/decrement by 10 (preserving the CSS unit)', async () => {
        const user = userEvent.setup();
        const { getByRole } = render(<CSSValueInput onSubmitValue={noop} value="75%" />);
        const input = getByRole('textbox');
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

    it('supports custom props.step for ↑/↓ key handling', async () => {
        const user = userEvent.setup();
        const { getByRole } = render(
            <CSSValueInput onSubmitValue={noop} step={0.1} value="2rem" />,
        );
        const input = getByRole('textbox');
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
        const { getByRole } = render(
            <CSSValueInput allowEmpty onSubmitValue={noop} unit="px" value="" />,
        );
        const input = getByRole('textbox');
        expect(input.value).toBe('');
        await user.type(input, '14{Enter}');
        expect(input.value).toBe('14px');
    });

    it('preserves last entered unit if different from props.unit when unit is missing', async () => {
        const user = userEvent.setup();
        const { getByRole } = render(
            <CSSValueInput allowEmpty onSubmitValue={noop} unit="px" value="" />,
        );
        const input = getByRole('textbox');
        expect(input.value).toBe('');
        await user.type(input, '25vw{Enter}');
        expect(input.value).toBe('25vw');
        await user.type(input, '50{Enter}');
        expect(input.value).toBe('50vw');
    });

    it('treats value as numeric if props.unit is an empty string', async () => {
        const user = userEvent.setup();
        const { getByRole } = render(
            <CSSValueInput allowEmpty onSubmitValue={noop} unit="" value="100" />,
        );
        const input = getByRole('textbox');
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
        const { getByRole, rerender } = render(
            <CSSValueInput onSubmitValue={noop} unit="px" value="12px" />,
        );
        const input = getByRole('textbox');
        rerender(<CSSValueInput onSubmitValue={noop} unit="" value="4" />);
        expect(input.value).toBe('4');
        await user.type(input, '25{Enter}');
        expect(input.value).toBe('25');
        rerender(<CSSValueInput onSubmitValue={noop} unit="rad" value="3rad" />);
        expect(input.value).toBe('3rad');
        await user.type(input, '-4.1{Enter}');
        expect(input.value).toBe('-4.1rad');
    });
});
