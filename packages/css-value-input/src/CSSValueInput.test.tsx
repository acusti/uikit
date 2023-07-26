// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import CSSValueInput from './CSSValueInput.js';

afterEach(cleanup);

describe('CSSValueInput.tsx', async () => {
    it('renders a text input with the given props.value', async () => {
        const { getByRole } = render(
            <CSSValueInput onSubmitValue={() => {}} value="24px" />,
        );
        expect(getByRole('textbox').value).toBe('24px');
    });
});
