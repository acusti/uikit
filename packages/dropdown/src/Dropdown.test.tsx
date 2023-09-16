// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import Dropdown from './Dropdown.js';

const noop = () => {};

afterEach(cleanup);

describe('Dropdown.js', async () => {
    it('renders its contents as a dropdown menu with an empty button to trigger it when it’s rendered with a single child', async () => {
        const user = userEvent.setup();
        const { getByRole, getByTestId } = render(
            <Dropdown>
                <ul data-testid="dropdown-list">
                    <li>0px</li>
                    <li>4px</li>
                    <li>9px</li>
                    <li>18px</li>
                    <li>36px</li>
                    <li>54px</li>
                    <li>72px</li>
                    <li>144px</li>
                    <li>167px</li>
                    <li>198px</li>
                </ul>
            </Dropdown>,
        );

        const trigger = getByRole('button');
        expect(trigger.innerHTML).toBe('');
        await user.click(trigger);
        expect(getByTestId('dropdown-list')).toBeTruthy();
    });

    it('renders the first child as a trigger and the second child as a dropdown when given two children', async () => {
        const user = userEvent.setup();
        const { getByRole, getByTestId } = render(
            <Dropdown>
                File
                <ul data-testid="file-menu">
                    <li>New Window</li>
                    <li>New Private Window</li>
                    <li>New Tab</li>
                    <li>New Empty Tab Group</li>
                    <li>Open File…</li>
                    <li>Open Location…</li>
                    <li className="separator" />
                    <li>Close Window</li>
                    <li>Close All Window</li>
                    <li>Close Tab</li>
                    <li>Save As…</li>
                    <li className="separator" />
                    <li>Print…</li>
                </ul>
            </Dropdown>,
        );

        const trigger = getByRole('button');
        expect(trigger.innerHTML).toBe('File');
        await user.click(trigger);
        expect(getByTestId('file-menu')).toBeTruthy();
    });
});
