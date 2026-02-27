// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type MouseEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Dropdown from './Dropdown.js';

afterEach(cleanup);

describe('@acusti/dropdown', () => {
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

    it('renders a non-string label value', () => {
        render(
            <Dropdown label={0}>
                <ul data-testid="dropdown-list">
                    <li>Item</li>
                </ul>
            </Dropdown>,
        );

        expect(screen.getByText('0')).toBeTruthy();
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

    describe('click delegation to buttons and links', () => {
        it('invokes click on a button when the item contains exactly one button', async () => {
            const handleButtonClick = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li
                            data-testid="button-item"
                            data-ukt-item
                            data-ukt-value="action"
                        >
                            <button onClick={handleButtonClick}>Action</button>
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click on the item containing the button
            const item = screen.getByTestId('button-item');
            await user.click(item);

            // Both the button click and the submit item should be called
            expect(handleButtonClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Action',
                    value: 'action',
                }),
            );
        });

        it('invokes click on a link when the item contains exactly one link', async () => {
            const handleLinkClick = vi.fn((e: MouseEvent) => e.preventDefault());
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-testid="link-item" data-ukt-item data-ukt-value="test">
                            <a href="/test" onClick={handleLinkClick}>
                                Go to Test
                            </a>
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click on the item containing the link
            const item = screen.getByTestId('link-item');
            await user.click(item);

            // Both the link click and the submit item should be called
            expect(handleLinkClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Go to Test',
                    value: 'test',
                }),
            );
        });

        it('does not invoke click when item contains multiple buttons', async () => {
            const handleButton1Click = vi.fn();
            const handleButton2Click = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li
                            data-testid="multiple-buttons-item"
                            data-ukt-item
                            data-ukt-value="actions"
                        >
                            <button onClick={handleButton1Click}>Edit</button>
                            <button onClick={handleButton2Click}>Delete</button>
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click on the item containing multiple buttons
            const item = screen.getByTestId('multiple-buttons-item');
            await user.click(item);

            // Neither button's click should be invoked automatically
            expect(handleButton1Click).not.toHaveBeenCalled();
            expect(handleButton2Click).not.toHaveBeenCalled();
            // Instead, onSubmitItem should be called
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: 'actions',
                }),
            );
        });

        it('does not invoke click when item contains both button and link', async () => {
            const handleButtonClick = vi.fn();
            const handleLinkClick = vi.fn((e: MouseEvent) => e.preventDefault());
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-testid="mixed-item" data-ukt-item data-ukt-value="mixed">
                            <button onClick={handleButtonClick}>Button</button>
                            <a href="/link" onClick={handleLinkClick}>
                                Link
                            </a>
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click on the item containing both button and link
            const item = screen.getByTestId('mixed-item');
            await user.click(item);

            // Neither should be invoked automatically
            expect(handleButtonClick).not.toHaveBeenCalled();
            expect(handleLinkClick).not.toHaveBeenCalled();
            // Instead, onSubmitItem should be called
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    value: 'mixed',
                }),
            );
        });

        it('uses normal onSubmitItem behavior when item has no buttons or links', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="plain">
                            Plain Text Item
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click on the plain text item
            const item = screen.getByText('Plain Text Item');
            await user.click(item);

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Plain Text Item',
                    value: 'plain',
                }),
            );
        });

        it('invokes button click via keyboard navigation', async () => {
            const handleButtonClick = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="keyboard-action">
                            <button onClick={handleButtonClick}>Action</button>
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Navigate with keyboard and submit
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{Enter}');

            // Both handlers should be called
            expect(handleButtonClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Action',
                    value: 'keyboard-action',
                }),
            );
        });

        it('invokes click on input[type="button"] when the item contains exactly one', async () => {
            const handleInputClick = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li
                            data-testid="input-button-item"
                            data-ukt-item
                            data-ukt-value="input-action"
                        >
                            <input
                                onClick={handleInputClick}
                                type="button"
                                value="Input Button"
                            />
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            const item = screen.getByTestId('input-button-item');
            await user.click(item);

            expect(handleInputClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    // Note: input elements don't have innerText, so label will be empty
                    label: '',
                    value: 'input-action',
                }),
            );
        });

        it('invokes click on input[type="submit"] when the item contains exactly one', async () => {
            const handleInputClick = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li
                            data-testid="input-submit-item"
                            data-ukt-item
                            data-ukt-value="submit-action"
                        >
                            <input
                                onClick={handleInputClick}
                                type="submit"
                                value="Submit Button"
                            />
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            const item = screen.getByTestId('input-submit-item');
            await user.click(item);

            expect(handleInputClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    // Note: input elements don't have innerText, so label will be empty
                    label: '',
                    value: 'submit-action',
                }),
            );
        });

        it('does not invoke button click twice when clicking the button directly', async () => {
            const handleButtonClick = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="action">
                            <button onClick={handleButtonClick}>Action</button>
                        </li>
                        <li data-ukt-item>Other Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click directly on the button (not the parent li)
            const button = screen.getByRole('button', { name: 'Action' });
            await user.click(button);

            // Button click should only fire once (not twice from delegation)
            expect(handleButtonClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
        });

        it('works when buttons themselves are the dropdown items', async () => {
            const handleSaveClick = vi.fn();
            const handleCancelClick = vi.fn();
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <div>
                        <button data-ukt-value="save" onClick={handleSaveClick}>
                            Save
                        </button>
                        <button data-ukt-value="cancel" onClick={handleCancelClick}>
                            Cancel
                        </button>
                    </div>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click the save button (which is itself the item)
            const saveButton = screen.getByRole('button', { name: 'Save' });
            await user.click(saveButton);

            // Button click should fire once, onSubmitItem should be called
            expect(handleSaveClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Save',
                    value: 'save',
                }),
            );

            // Wait for dropdown to close
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Try with keyboard navigation
            await user.click(trigger);
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowDown}'); // Move to Cancel
            await user.keyboard('{Enter}');

            // Cancel button should fire once
            expect(handleCancelClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(2);
            expect(handleSubmitItem).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    label: 'Cancel',
                    value: 'cancel',
                }),
            );
        });

        it('does not invoke link click when controlled dropdown selects already-active item', async () => {
            const handleHomeClick = vi.fn((e: MouseEvent) => e.preventDefault());
            const handleAboutClick = vi.fn((e: MouseEvent) => e.preventDefault());
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            // Controlled dropdown showing current page (home)
            render(
                <Dropdown onSubmitItem={handleSubmitItem} value="home">
                    Menu
                    <ul>
                        <li data-testid="home-item" data-ukt-item data-ukt-value="home">
                            <a href="/home" onClick={handleHomeClick}>
                                Home
                            </a>
                        </li>
                        <li data-testid="about-item" data-ukt-item data-ukt-value="about">
                            <a href="/about" onClick={handleAboutClick}>
                                About
                            </a>
                        </li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            await user.click(trigger);

            // Click the home item (which is already the current value)
            const homeItem = screen.getByTestId('home-item');
            await user.click(homeItem);

            // Neither onSubmitItem nor the link click should fire (no-op since value unchanged)
            expect(handleHomeClick).not.toHaveBeenCalled();
            expect(handleSubmitItem).not.toHaveBeenCalled();

            // Wait for dropdown to close (90ms timeout + buffer)
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Now click a different item
            await user.click(trigger); // Reopen dropdown
            const aboutItem = screen.getByTestId('about-item');
            await user.click(aboutItem);

            // This should trigger both handlers (value is changing)
            expect(handleAboutClick).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'About',
                    value: 'about',
                }),
            );
        });
    });
});
