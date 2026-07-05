// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { type MouseEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Dropdown, { type Props } from './Dropdown.js';

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

    it('renders dropdown items inside .uktdropdown-content', async () => {
        const user = userEvent.setup();
        render(
            <Dropdown minHeightBody={90}>
                Menu
                <ul data-testid="dropdown-list">
                    <li>Item</li>
                </ul>
            </Dropdown>,
        );

        await user.click(screen.getByRole('button', { name: 'Menu' }));

        expect(
            screen.getByText('Item', {
                selector: '.uktdropdown-body .uktdropdown-content li',
            }),
        ).toBeTruthy();
    });

    describe('ARIA attributes', () => {
        it('links the generated button trigger to the menu popup', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown>
                    Menu
                    <ul>
                        <li>New Window</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Menu' });
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
            expect(trigger.getAttribute('aria-controls')).toBeTruthy();

            await user.click(trigger);

            const popup = screen.getByRole('menu');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
        });

        it('uses listbox semantics for searchable dropdowns', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown isSearchable>
                    <ul>
                        <li>Arizona</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('textbox');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');

            await user.click(trigger);

            const popup = screen.getByRole('listbox');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
        });

        it('uses dialog semantics when the dropdown has no selectable items', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown hasItems={false}>
                    Settings
                    <form>
                        <label>
                            Full name
                            <input name="name" />
                        </label>
                    </form>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Settings' });
            expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

            await user.click(trigger);

            const popup = screen.getByRole('dialog');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
        });

        it('adds default ARIA props to custom triggers without replacing consumer values', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown>
                    <button
                        aria-controls="custom-popup"
                        aria-expanded
                        aria-haspopup="tree"
                    >
                        Custom
                    </button>
                    <ul>
                        <li>Custom Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Custom' });
            expect(trigger.getAttribute('aria-controls')).toBe('custom-popup');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(trigger.getAttribute('aria-haspopup')).toBe('tree');

            await user.click(trigger);

            expect(screen.getByRole('menu').id).not.toBe('custom-popup');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });

        it('fills missing ARIA props on custom triggers', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown>
                    <button>Custom</button>
                    <ul>
                        <li>Custom Item</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Custom' });
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(trigger.getAttribute('aria-haspopup')).toBe('menu');

            await user.click(trigger);

            const popup = screen.getByRole('menu');
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
            expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
        });
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

    describe('submitting with no active item', () => {
        it('does not call onSubmitItem when a non-searchable dropdown is submitted with nothing selected', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                        <li data-ukt-item data-ukt-value="two">
                            Two
                        </li>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            // Dropdown is open with nothing highlighted; submitting must be a
            // no-op, not an empty-valued onSubmitItem.
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).not.toHaveBeenCalled();
        });

        it('does not call onSubmitItem when the pointer is released on non-item menu chrome', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <div>
                        <h5 data-testid="menu-title">Pick one</h5>
                        <ul>
                            <li data-ukt-item data-ukt-value="one">
                                One
                            </li>
                        </ul>
                    </div>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.click(screen.getByTestId('menu-title'));

            expect(handleSubmitItem).not.toHaveBeenCalled();
        });

        it('does not call onSubmitItem when allowCreate is set but there is no input to source a value', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            // allowCreate has nothing to create from without a text input, so
            // submitting with nothing selected must still be a no-op rather
            // than bypassing the empty-submit guard.
            render(
                <Dropdown allowCreate onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).not.toHaveBeenCalled();
        });

        it('still submits an item whose value is explicitly empty', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="">
                            Clear
                        </li>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.click(screen.getByText('Clear'));

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Clear', value: '' }),
            );
        });

        it('still lets a searchable dropdown submit an empty (cleared) value', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown isSearchable onSubmitItem={handleSubmitItem}>
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                    </ul>
                </Dropdown>,
            );

            const input = screen.getByRole('textbox');
            await user.click(input);
            // Empty input + allowEmpty (default) → an explicit clear submit.
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({ value: '' }),
            );
        });

        it('still lets a custom text-input trigger submit an empty (cleared) value when not searchable', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            // No isSearchable, but the custom trigger contains a text input,
            // which Dropdown adopts as its value source. Clearing it and
            // submitting is a real empty value, not the value-less menu case.
            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    <input aria-label="amount" />
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                    </ul>
                </Dropdown>,
            );

            const input = screen.getByRole('textbox', { name: 'amount' });
            await user.click(input);
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({ value: '' }),
            );
        });

        it('enforces allowEmpty={false} on the allowCreate path (cleared input does not submit)', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown
                    allowCreate
                    allowEmpty={false}
                    isSearchable
                    onSubmitItem={handleSubmitItem}
                >
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                    </ul>
                </Dropdown>,
            );

            const input = screen.getByRole('textbox');
            await user.click(input);
            // Cleared input + no active item: an empty “creation” is a clear,
            // so allowEmpty must gate it even though allowCreate is set.
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).not.toHaveBeenCalled();
        });

        it('still lets allowCreate with default allowEmpty submit a cleared value', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();

            render(
                <Dropdown allowCreate isSearchable onSubmitItem={handleSubmitItem}>
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                    </ul>
                </Dropdown>,
            );

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({ value: '' }),
            );
        });
    });

    describe('mouseup submission targets the clicked item', () => {
        const renderMenu = (handleSubmitItem: (payload: unknown) => void) =>
            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item data-ukt-value="one">
                            One
                        </li>
                        <li aria-hidden className="separator" data-testid="separator" />
                        <li data-ukt-item data-ukt-value="two">
                            Two
                        </li>
                        <li aria-disabled="true" data-ukt-item data-ukt-value="three">
                            Three
                        </li>
                    </ul>
                </Dropdown>,
            );

        it('submits the clicked item, not a divergent keyboard-active item', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderMenu(handleSubmitItem);

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.keyboard('{ArrowDown}'); // “One” becomes active
            fireEvent.mouseUp(screen.getByText('Two'));

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({ value: 'two' }),
            );
        });

        it('does not submit the active item when the click lands on a separator', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderMenu(handleSubmitItem);

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.keyboard('{ArrowDown}'); // “One” becomes active
            fireEvent.mouseUp(screen.getByTestId('separator'));

            expect(handleSubmitItem).not.toHaveBeenCalled();
            // Like macOS, the click is a no-op: the menu stays open with
            // the active item unchanged
            expect(screen.getByText('One').hasAttribute('data-ukt-active')).toBe(true);
        });

        it('does not submit the active item when the click lands on a disabled item', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderMenu(handleSubmitItem);

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.keyboard('{ArrowDown}'); // “One” becomes active
            fireEvent.mouseUp(screen.getByText('Three'));

            expect(handleSubmitItem).not.toHaveBeenCalled();
            expect(screen.getByText('One').hasAttribute('data-ukt-active')).toBe(true);
        });
    });

    describe('submenus (nested Dropdowns)', () => {
        const renderFormatMenu = (
            props: Partial<Props> = {},
            submenuProps: Partial<Props> = {},
        ) => {
            const result = render(
                <Dropdown {...props}>
                    Format
                    <ul>
                        <li data-ukt-item>Bold</li>
                        <li data-ukt-item>Italic</li>
                        <Dropdown label={<span>Align</span>} {...submenuProps}>
                            <ul data-testid="align-submenu">
                                <li data-ukt-value="left">Left</li>
                                <li data-ukt-value="center">Center</li>
                                <li data-ukt-value="right">Right</li>
                            </ul>
                        </Dropdown>
                    </ul>
                </Dropdown>,
            );
            return result;
        };

        const getParentItem = () => {
            const item = screen.getByText('Align').closest('li');
            expect(item).toBeTruthy();
            return item as HTMLElement;
        };

        it('renders a nested Dropdown as a parent item using the data-ukt-submenu protocol with ARIA filled in', async () => {
            const user = userEvent.setup();
            renderFormatMenu();

            await user.click(screen.getByRole('button', { name: 'Format' }));

            const parentItem = getParentItem();
            expect(parentItem.hasAttribute('data-ukt-item')).toBe(true);
            expect(parentItem.getAttribute('aria-haspopup')).toBe('menu');
            expect(parentItem.getAttribute('aria-expanded')).toBe('false');

            const submenu = screen.getByTestId('align-submenu');
            expect(submenu.hasAttribute('data-ukt-submenu')).toBe(true);
            expect(submenu.getAttribute('role')).toBe('menu');
            expect(submenu.id).toBeTruthy();
            expect(parentItem.getAttribute('aria-controls')).toBe(submenu.id);
        });

        it('dives into and surfaces out of a submenu with →/← while the parent item stays active', async () => {
            const user = userEvent.setup();
            renderFormatMenu();

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

            const parentItem = getParentItem();
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(true);

            await user.keyboard('{ArrowRight}');
            expect(parentItem.getAttribute('aria-expanded')).toBe('true');
            const leftItem = screen.getByText('Left');
            expect(leftItem.hasAttribute('data-ukt-active')).toBe(true);
            // the parent item stays on the active path
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(true);

            // ↑/↓ navigate the submenu level, not the top level
            await user.keyboard('{ArrowDown}');
            expect(screen.getByText('Center').hasAttribute('data-ukt-active')).toBe(true);
            expect(leftItem.hasAttribute('data-ukt-active')).toBe(false);

            await user.keyboard('{ArrowLeft}');
            expect(parentItem.getAttribute('aria-expanded')).toBe('false');
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(true);
            expect(screen.getByText('Center').hasAttribute('data-ukt-active')).toBe(
                false,
            );
        });

        it('applies the flat item-detection heuristic within submenu bodies with no marked items', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Format
                    <ul>
                        <li data-ukt-item>Bold</li>
                        <Dropdown label={<span>Align</span>}>
                            <ul>
                                <li>Left</li>
                                <li>Center</li>
                            </ul>
                        </Dropdown>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');

            // Unmarked submenu items are detected heuristically per level
            const leftItem = screen.getByText('Left');
            expect(leftItem.hasAttribute('data-ukt-active')).toBe(true);

            await user.keyboard('{ArrowDown}');
            expect(screen.getByText('Center').hasAttribute('data-ukt-active')).toBe(true);

            // Hover resolves within the item’s own level, not the parent item
            // (mousemove first: pointer movement switches the input method
            // back to mouse after keyboard navigation)
            fireEvent.mouseMove(leftItem);
            fireEvent.mouseOver(leftItem);
            expect(leftItem.hasAttribute('data-ukt-active')).toBe(true);

            await user.keyboard('{Enter}');
            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Left',
                    path: [{ label: 'Align', value: 'Align' }],
                    value: 'Left',
                }),
            );
        });

        it('collapses expanded descendant submenus when surfacing with ←', async () => {
            const handleMoreClose = vi.fn();
            const user = userEvent.setup();
            render(
                <Dropdown>
                    Format
                    <ul>
                        <li data-ukt-item>Bold</li>
                        <Dropdown label={<span>Align</span>}>
                            <ul>
                                <li data-ukt-value="left">Left</li>
                                <Dropdown
                                    label={<span>More</span>}
                                    onClose={handleMoreClose}
                                >
                                    <ul>
                                        <li data-ukt-value="x">X</li>
                                    </ul>
                                </Dropdown>
                            </ul>
                        </Dropdown>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Format' }));
            // Dive into the Align submenu and land on its More parent item
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}{ArrowDown}');

            const alignItem = screen.getByText('Align').closest('li') as HTMLElement;
            const moreItem = screen.getByText('More').closest('li') as HTMLElement;
            // Pausing on More discloses its submenu (highlight stays on More)
            await waitFor(() =>
                expect(moreItem.getAttribute('aria-expanded')).toBe('true'),
            );

            await user.keyboard('{ArrowLeft}');
            expect(alignItem.getAttribute('aria-expanded')).toBe('false');
            expect(moreItem.getAttribute('aria-expanded')).toBe('false');
            expect(handleMoreClose).toHaveBeenCalledTimes(1);
        });

        it('opens the submenu on Enter instead of submitting (parent items never submit)', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu({ onSubmitItem: handleSubmitItem });

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).not.toHaveBeenCalled();
            const parentItem = getParentItem();
            expect(parentItem.getAttribute('aria-expanded')).toBe('true');
            expect(screen.getByText('Left').hasAttribute('data-ukt-active')).toBe(true);
            // the dropdown stays open
            expect(screen.getByTestId('align-submenu')).toBeTruthy();
        });

        it('submits leaf items with their ancestor path', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu({ onSubmitItem: handleSubmitItem });

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
            await user.keyboard('{ArrowRight}');
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    label: 'Left',
                    path: [{ label: 'Align', value: 'Align' }],
                    value: 'left',
                }),
            );
        });

        it('submits top-level leaf items with an empty path', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu({ onSubmitItem: handleSubmitItem });

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{Enter}');

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({ label: 'Bold', path: [], value: 'Bold' }),
            );
        });

        it('discloses the submenu after a short intent delay when pausing on a parent item', async () => {
            const user = userEvent.setup();
            renderFormatMenu();

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

            const parentItem = getParentItem();
            // not disclosed synchronously…
            expect(parentItem.getAttribute('aria-expanded')).toBe('false');
            // …but disclosed after the intent delay, highlight staying on the parent
            await waitFor(() =>
                expect(parentItem.getAttribute('aria-expanded')).toBe('true'),
            );
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(true);
            expect(screen.getByText('Left').hasAttribute('data-ukt-active')).toBe(false);
        });

        it('does not flash the submenu open when arrowing quickly past a parent item', async () => {
            const user = userEvent.setup();
            renderFormatMenu();

            await user.click(screen.getByRole('button', { name: 'Format' }));
            // Arrow onto the parent item and away again immediately
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowUp}');

            const parentItem = getParentItem();
            await new Promise((resolve) => setTimeout(resolve, 250));
            expect(parentItem.getAttribute('aria-expanded')).toBe('false');
        });

        it('scopes typeahead to the current level', async () => {
            const user = userEvent.setup();
            renderFormatMenu();

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
            await user.keyboard('ri');

            expect(screen.getByText('Right').hasAttribute('data-ukt-active')).toBe(true);
        });

        it('closes the whole menu on Escape and returns focus to the trigger', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu({ onSubmitItem: handleSubmitItem });

            const trigger = screen.getByRole('button', { name: 'Format' });
            await user.click(trigger);
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
            await user.keyboard('{Escape}');

            expect(handleSubmitItem).not.toHaveBeenCalled();
            expect(screen.queryByTestId('align-submenu')).toBe(null);
            expect(document.activeElement).toBe(trigger);
        });

        it('dispatches scoped onOpen/onClose/onSubmitItem to the nested Dropdown', async () => {
            const handleRootSubmitItem = vi.fn();
            const handleAlignClose = vi.fn();
            const handleAlignOpen = vi.fn();
            const handleAlignSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu(
                { onSubmitItem: handleRootSubmitItem },
                {
                    onClose: handleAlignClose,
                    onOpen: handleAlignOpen,
                    onSubmitItem: handleAlignSubmitItem,
                },
            );

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
            await user.keyboard('{ArrowRight}');
            expect(handleAlignOpen).toHaveBeenCalledTimes(1);

            await user.keyboard('{ArrowLeft}');
            expect(handleAlignClose).toHaveBeenCalledTimes(1);

            // a top-level submit doesn’t reach the nested dropdown
            await user.keyboard('{ArrowUp}{ArrowUp}');
            await user.keyboard('{Enter}');
            expect(handleRootSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleAlignSubmitItem).not.toHaveBeenCalled();
        });

        it('dispatches a submenu leaf submission to both the root and the nested Dropdown', async () => {
            const handleRootSubmitItem = vi.fn();
            const handleAlignSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu(
                { onSubmitItem: handleRootSubmitItem },
                { onSubmitItem: handleAlignSubmitItem },
            );

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}');
            await user.keyboard('{Enter}');

            const expectedPayload = expect.objectContaining({
                path: [{ label: 'Align', value: 'Align' }],
                value: 'left',
            });
            expect(handleRootSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleRootSubmitItem).toHaveBeenCalledWith(expectedPayload);
            expect(handleAlignSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleAlignSubmitItem).toHaveBeenCalledWith(expectedPayload);
        });

        it('toggles the submenu open on click without submitting or closing the menu', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu({ onSubmitItem: handleSubmitItem });

            await user.click(screen.getByRole('button', { name: 'Format' }));

            const parentItem = getParentItem();
            fireEvent.mouseOver(parentItem);
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(true);
            fireEvent.mouseUp(parentItem);

            expect(handleSubmitItem).not.toHaveBeenCalled();
            expect(parentItem.getAttribute('aria-expanded')).toBe('true');
            expect(screen.getByTestId('align-submenu')).toBeTruthy();
        });

        it('submits a hovered submenu leaf on mouseup with its path', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            renderFormatMenu({ onSubmitItem: handleSubmitItem });

            await user.click(screen.getByRole('button', { name: 'Format' }));

            const parentItem = getParentItem();
            fireEvent.mouseOver(parentItem);
            fireEvent.mouseUp(parentItem);

            const centerItem = screen.getByText('Center');
            fireEvent.mouseOver(centerItem);
            expect(centerItem.hasAttribute('data-ukt-active')).toBe(true);
            // the parent stays on the active path
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(true);
            fireEvent.mouseUp(centerItem);

            expect(handleSubmitItem).toHaveBeenCalledTimes(1);
            expect(handleSubmitItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    path: [{ label: 'Align', value: 'Align' }],
                    value: 'center',
                }),
            );
        });

        it('skips disabled nested Dropdowns during keyboard navigation', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown>
                    Format
                    <ul>
                        <li data-ukt-item>Bold</li>
                        <Dropdown disabled label={<span>Align</span>}>
                            <ul>
                                <li data-ukt-value="left">Left</li>
                            </ul>
                        </Dropdown>
                        <li data-ukt-item>Italic</li>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Format' }));
            await user.keyboard('{ArrowDown}{ArrowDown}');

            const parentItem = screen.getByText('Align').closest('li') as HTMLElement;
            expect(parentItem.getAttribute('aria-disabled')).toBe('true');
            expect(parentItem.hasAttribute('data-ukt-active')).toBe(false);
            expect(screen.getByText('Italic').hasAttribute('data-ukt-active')).toBe(true);
        });

        it('warns about props that are ignored on a nested Dropdown', async () => {
            const consoleErrorSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => undefined);
            const user = userEvent.setup();

            render(
                <Dropdown>
                    Format
                    <ul>
                        <li data-ukt-item>Bold</li>
                        <Dropdown isSearchable label={<span>Align</span>}>
                            <ul>
                                <li data-ukt-value="left">Left</li>
                            </ul>
                        </Dropdown>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Format' }));

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('ignored on a nested (submenu) Dropdown'),
            );
            consoleErrorSpy.mockRestore();
        });
    });

    it('skips aria-disabled items during keyboard navigation in flat (heuristic) bodies', async () => {
        const user = userEvent.setup();
        render(
            <Dropdown>
                Menu
                <ul>
                    <li>One</li>
                    <li aria-disabled="true">Two</li>
                    <li>Three</li>
                </ul>
            </Dropdown>,
        );

        await user.click(screen.getByRole('button', { name: 'Menu' }));
        await user.keyboard('{ArrowDown}{ArrowDown}');

        expect(screen.getByText('Two').hasAttribute('data-ukt-active')).toBe(false);
        expect(screen.getByText('Three').hasAttribute('data-ukt-active')).toBe(true);
    });

    it('stays closed when Escape restores focus to a searchable trigger input', async () => {
        const user = userEvent.setup();
        render(
            <Dropdown isSearchable>
                <ul>
                    <li data-ukt-item>
                        <button type="button">Action</button>
                    </li>
                </ul>
            </Dropdown>,
        );

        const input = screen.getByRole('textbox');
        await user.click(input);
        expect(screen.getByRole('listbox')).toBeTruthy();

        // Move focus into the body so Escape’s focus restore fires the
        // trigger input’s onFocus (which opens the dropdown on focus)
        const bodyButton = screen.getByRole('button', { name: 'Action' });
        act(() => bodyButton.focus());
        expect(screen.getByRole('listbox')).toBeTruthy();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('listbox')).toBe(null);
        expect(document.activeElement).toBe(input);
    });

    describe('nested non-menu dropdowns (hasItems={false})', () => {
        it('renders a nested hasItems={false} Dropdown as an independent anchored dropdown', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown hasItems={false}>
                    <button>Settings</button>
                    <div>
                        <label>
                            Full name <input />
                        </label>
                        <Dropdown hasItems={false}>
                            <button aria-label="About full name">ℹ️</button>
                            <p data-testid="info-popover">Used for your profile.</p>
                        </Dropdown>
                    </div>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Settings' }));
            expect(screen.getByRole('textbox')).toBeTruthy();
            expect(screen.queryByTestId('info-popover')).toBe(null);

            await user.click(screen.getByRole('button', { name: 'About full name' }));
            // the info popover opens and the outer dropdown stays open
            expect(screen.getByTestId('info-popover')).toBeTruthy();
            expect(screen.getByRole('textbox')).toBeTruthy();

            // Escape closes only the innermost open dropdown…
            await user.keyboard('{Escape}');
            expect(screen.queryByTestId('info-popover')).toBe(null);
            expect(screen.getByRole('textbox')).toBeTruthy();

            // …and a second Escape closes the outer one
            await user.keyboard('{Escape}');
            expect(screen.queryByRole('textbox')).toBe(null);
        });

        it('closes the nested popover when its trigger is clicked again, keeping the outer dropdown open', async () => {
            const user = userEvent.setup();
            render(
                <Dropdown hasItems={false}>
                    <button>Settings</button>
                    <div>
                        <label>
                            Full name <input />
                        </label>
                        <Dropdown hasItems={false}>
                            <button aria-label="About full name">ℹ️</button>
                            <p data-testid="info-popover">Used for your profile.</p>
                        </Dropdown>
                    </div>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Settings' }));
            const infoTrigger = screen.getByRole('button', {
                name: 'About full name',
            });
            await user.click(infoTrigger);
            expect(screen.getByTestId('info-popover')).toBeTruthy();

            await user.click(infoTrigger);
            expect(screen.queryByTestId('info-popover')).toBe(null);
            expect(screen.getByRole('textbox')).toBeTruthy();
        });

        it('does not submit the outer menu when opening a nested popover from an item', async () => {
            const handleSubmitItem = vi.fn();
            const user = userEvent.setup();
            render(
                <Dropdown onSubmitItem={handleSubmitItem}>
                    Menu
                    <ul>
                        <li data-ukt-item>
                            Alpha
                            <Dropdown hasItems={false}>
                                <button aria-label="About alpha">ℹ️</button>
                                <p data-testid="alpha-info">Alpha info.</p>
                            </Dropdown>
                        </li>
                        <li data-ukt-item>Beta</li>
                    </ul>
                </Dropdown>,
            );

            await user.click(screen.getByRole('button', { name: 'Menu' }));
            await user.click(screen.getByRole('button', { name: 'About alpha' }));

            expect(screen.getByTestId('alpha-info')).toBeTruthy();
            expect(handleSubmitItem).not.toHaveBeenCalled();
            // the outer menu stays open
            expect(screen.getByText('Beta')).toBeTruthy();
        });
    });
});
