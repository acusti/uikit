// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { afterEach, describe, expect, it } from 'vitest';

import Dropdown from './Dropdown.js';

afterEach(cleanup);

describe('Dropdown.js', () => {
    it('renders its contents as a dropdown menu with an empty button to trigger it when it’s rendered with a single child', async () => {
        const user = userEvent.setup();
        render(
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

        const trigger = screen.getByRole('button');
        expect(trigger.innerHTML).toBe('');
        await user.click(trigger);
        expect(screen.getByTestId('dropdown-list')).toBeTruthy();
    });

    it('renders the first child as a trigger and the second child as a dropdown when given two children', async () => {
        const user = userEvent.setup();
        render(
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

        const trigger = screen.getByRole('button');
        expect(trigger.innerHTML).toBe('File');
        await user.click(trigger);
        expect(screen.getByTestId('file-menu')).toBeTruthy();
    });

    it('triggers props.onClose and props.onOpen at the appropriate times', async () => {
        let closedCount = 0;
        const handleClose = () => closedCount++;
        let openedCount = 0;
        const handleOpen = () => openedCount++;

        const user = userEvent.setup();
        render(
            <Dropdown onClose={handleClose} onOpen={handleOpen}>
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

        const trigger = screen.getByRole('button');
        expect(closedCount).toBe(0);
        expect(openedCount).toBe(0);
        await user.click(trigger);
        expect(closedCount).toBe(0);
        expect(openedCount).toBe(1);
        expect(screen.getByTestId('file-menu')).toBeTruthy();
        await user.type(trigger, '{Esc}');
        expect(closedCount).toBe(1);
        expect(openedCount).toBe(1);
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('triggers props.onOpen immediately if props.isOpenOnMount', async () => {
        let closedCount = 0;
        const handleClose = () => closedCount++;
        let openedCount = 0;
        const handleOpen = () => openedCount++;

        const user = userEvent.setup();
        render(
            <Dropdown isOpenOnMount onClose={handleClose} onOpen={handleOpen}>
                <p data-testid="dropdown-body">this is the dropdown contents</p>
            </Dropdown>,
        );

        const trigger = screen.getByRole('button');
        expect(screen.getByTestId('dropdown-body')).toBeTruthy();
        expect(openedCount).toBe(1);
        await user.click(trigger);
        expect(closedCount).toBe(1);
        expect(openedCount).toBe(1);
        expect(screen.queryByTestId('dropdown-body')).toBe(null);
    });
});
