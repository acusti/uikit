// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Dropdown, { Menubar } from './Dropdown.js';

afterEach(cleanup);

const renderMenubar = (props: { onSubmitItem?: (payload: unknown) => void } = {}) =>
    render(
        <Menubar>
            <Dropdown onSubmitItem={props.onSubmitItem}>
                File
                <ul data-testid="file-menu">
                    <li data-ukt-item>New</li>
                    <li data-ukt-item>Open…</li>
                </ul>
            </Dropdown>
            <Dropdown>
                Edit
                <ul data-testid="edit-menu">
                    <li data-ukt-item>Undo</li>
                    <li data-ukt-item>Redo</li>
                </ul>
            </Dropdown>
            <Dropdown>
                View
                <ul data-testid="view-menu">
                    <li data-ukt-item>Zoom In</li>
                </ul>
            </Dropdown>
        </Menubar>,
    );

describe('@acusti/dropdown Menubar', () => {
    it('renders its dropdowns inside a role="menubar" container', () => {
        renderMenubar();
        const menubar = screen.getByRole('menubar');
        expect(menubar.classList.contains('uktmenubar')).toBe(true);
        expect(screen.getByRole('button', { name: 'File' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    });

    it('keeps at most one menu open at a time', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // focusing + opening another member closes the open one
        const viewTrigger = screen.getByRole('button', { name: 'View' });
        act(() => viewTrigger.focus());
        await user.keyboard('{Enter}');
        expect(screen.getByTestId('view-menu')).toBeTruthy();
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('closes an open menu when its trigger is clicked again (hover pre-switches, click toggles)', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // Clicking another trigger hovers it first, which switches the open
        // menu to it (macOS behavior); the click then toggles it closed like
        // any click on an open menu’s trigger
        await user.click(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(screen.queryByTestId('edit-menu')).toBe(null);
    });

    it('switches the open menu on hover without a click', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        fireEvent.mouseOver(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('does not open a menu on hover when no menu is open', () => {
        renderMenubar();
        fireEvent.mouseOver(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.queryByTestId('edit-menu')).toBe(null);
    });

    const renderMenubarWithButton = () =>
        render(
            <Menubar>
                <Dropdown>
                    File
                    <ul data-testid="file-menu">
                        <li data-ukt-item>New</li>
                    </ul>
                </Dropdown>
                <button type="button">Run</button>
                <Dropdown>
                    Edit
                    <ul data-testid="edit-menu">
                        <li data-ukt-item>Undo</li>
                    </ul>
                </Dropdown>
            </Menubar>,
        );

    it('clears the open menu when the pointer moves onto a non-menu button, staying engaged', async () => {
        const user = userEvent.setup();
        renderMenubarWithButton();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // Hovering the plain button closes the open menu…
        fireEvent.mouseOver(screen.getByRole('button', { name: 'Run' }));
        expect(screen.queryByTestId('file-menu')).toBe(null);

        // …but the bar stays engaged, so hovering a trigger reopens a menu
        // without another click
        fireEvent.mouseOver(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
    });

    it('keeps the open menu when the pointer crosses the bar’s own padding', async () => {
        const user = userEvent.setup();
        renderMenubarWithButton();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // The gaps between triggers aren’t interactive controls, so sliding
        // across them leaves the open menu alone (seamless menu-to-menu hover)
        fireEvent.mouseOver(screen.getByRole('menubar'));
        expect(screen.getByTestId('file-menu')).toBeTruthy();
    });

    it('stops reopening menus on hover once the bar is dismissed with Escape', async () => {
        const user = userEvent.setup();
        renderMenubarWithButton();

        await user.click(screen.getByRole('button', { name: 'File' }));
        await user.keyboard('{Escape}');
        expect(screen.queryByTestId('file-menu')).toBe(null);

        // Escape is a deliberate dismissal, so it leaves menu-mode: hovering a
        // trigger no longer opens a menu until a click re-engages the bar
        fireEvent.mouseOver(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.queryByTestId('edit-menu')).toBe(null);
    });

    it('drops engagement when the dropdown that engaged the bar unmounts', async () => {
        const user = userEvent.setup();
        const Bar = ({ showFile }: { showFile: boolean }) => (
            <Menubar>
                {showFile ? (
                    <Dropdown>
                        File
                        <ul data-testid="file-menu">
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                ) : null}
                <Dropdown>
                    Edit
                    <ul data-testid="edit-menu">
                        <li data-ukt-item>Undo</li>
                    </ul>
                </Dropdown>
            </Menubar>
        );
        const { rerender } = render(<Bar showFile />);

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // Remove the engaged dropdown without dismissing it. With the engaging
        // member gone, the bar is no longer engaged, so hovering another
        // trigger doesn’t reopen a menu.
        rerender(<Bar showFile={false} />);
        fireEvent.mouseOver(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.queryByTestId('edit-menu')).toBe(null);
    });

    it('switches the open menu when focus moves to another trigger', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        act(() => screen.getByRole('button', { name: 'Edit' }).focus());
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('roves focus between triggers with ←/→ while no menu is open, wrapping at the ends', async () => {
        const user = userEvent.setup();
        renderMenubar();

        const fileTrigger = screen.getByRole('button', { name: 'File' });
        const editTrigger = screen.getByRole('button', { name: 'Edit' });
        const viewTrigger = screen.getByRole('button', { name: 'View' });

        fileTrigger.focus();
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(editTrigger);

        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(viewTrigger);

        // wraps from the last trigger back to the first
        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(fileTrigger);

        // and from the first back to the last
        await user.keyboard('{ArrowLeft}');
        expect(document.activeElement).toBe(viewTrigger);
    });

    it('slides the open menu to the adjacent trigger with ←/→', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('button', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        await user.keyboard('{ArrowRight}');
        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Edit' }));

        await user.keyboard('{ArrowLeft}');
        expect(screen.queryByTestId('edit-menu')).toBe(null);
        expect(screen.getByTestId('file-menu')).toBeTruthy();
    });

    it('slides to the previous menu with ← wrapping to the last menu', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('button', { name: 'File' }));
        await user.keyboard('{ArrowLeft}');

        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(screen.getByTestId('view-menu')).toBeTruthy();
    });

    it('still navigates items with ↑/↓ and submits with Enter inside the open menu', async () => {
        const handleSubmitItem = vi.fn();
        const user = userEvent.setup();
        renderMenubar({ onSubmitItem: handleSubmitItem });

        await user.click(screen.getByRole('button', { name: 'File' }));
        await user.keyboard('{ArrowDown}{ArrowDown}');
        await user.keyboard('{Enter}');

        expect(handleSubmitItem).toHaveBeenCalledTimes(1);
        expect(handleSubmitItem).toHaveBeenCalledWith(
            expect.objectContaining({ label: 'Open…', path: [], value: 'Open…' }),
        );
    });

    it('closes the open menu on Escape and returns focus to its trigger', async () => {
        const user = userEvent.setup();
        renderMenubar();

        const fileTrigger = screen.getByRole('button', { name: 'File' });
        await user.click(fileTrigger);
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        await user.keyboard('{Escape}');
        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(document.activeElement).toBe(fileTrigger);
    });
});
