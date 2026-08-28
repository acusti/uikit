// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Activity, useState } from 'react';
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
        expect(screen.getByRole('menuitem', { name: 'File' })).toBeTruthy();
        expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeTruthy();
    });

    describe('menubar semantics', () => {
        // aria-required-children: a menubar owns its menu items, the menu an
        // open member discloses (the canonical APG shape puts a menuitem and
        // its menu inside the same presentational wrapper), and the
        // neutralized wrappers, which are transparent. Nothing else.
        //
        // Checking ancestors alone isn’t enough — a presentational wrapper
        // promotes *all* its children to the bar, so an un-roled sibling of
        // the trigger (props.label’s text div) is owned by the menubar too.
        const ALLOWED_OWNED_ROLES = ['menu', 'menuitem', 'none'];

        const expectMenubarOwnsOnlyAllowedRoles = () => {
            const menubar = screen.getByRole('menubar');
            expect(screen.getAllByRole('menuitem').length).toBeGreaterThan(0);

            for (const element of Array.from(menubar.querySelectorAll('*'))) {
                // an element is owned by the bar when the nearest roled
                // ancestor is the bar itself or a transparent wrapper;
                // anything deeper belongs to that menuitem or open menu
                const owner = element.parentElement?.closest('[role]');
                if (owner && owner !== menubar && owner.getAttribute('role') !== 'none') {
                    continue;
                }
                expect({
                    html: element.outerHTML.slice(0, 100),
                    role: element.getAttribute('role'),
                }).toMatchObject({
                    role: expect.stringMatching(
                        new RegExp(`^(${ALLOWED_OWNED_ROLES.join('|')})$`),
                    ),
                });
            }
        };

        it('owns its triggers as menuitems with nothing generic in between', () => {
            renderMenubar();
            expectMenubarOwnsOnlyAllowedRoles();
        });

        it('still owns only allowed roles once a menu is open', async () => {
            const user = userEvent.setup();
            renderMenubar();

            // the open body mounts inside the member’s neutralized wrapper, so
            // the bar owns it directly — the state this is really about, and
            // the one a closed-bar assertion never reaches
            await user.click(screen.getByRole('menuitem', { name: 'File' }));
            expect(screen.getByTestId('file-menu')).toBeTruthy();

            expectMenubarOwnsOnlyAllowedRoles();
        });

        it('neutralizes the label wrapper and its text for a labelled member', () => {
            render(
                <Menubar>
                    <Dropdown label="File">
                        <ul>
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                    <Dropdown label="Edit">
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            // props.label is the documented way to build a Menubar, and it
            // puts a text div beside the trigger inside a presentational
            // label — which the bar would otherwise own as a generic
            expectMenubarOwnsOnlyAllowedRoles();
            for (const labelText of Array.from(
                document.querySelectorAll('.uktdropdown-label-text'),
            )) {
                expect(labelText.getAttribute('role')).toBe('none');
            }
        });

        it('keeps a single tab stop, moving it to the focused trigger', () => {
            renderMenubar();

            const [file, edit, view] = screen.getAllByRole('menuitem');
            expect(file.getAttribute('tabindex')).toBe('0');
            expect(edit.getAttribute('tabindex')).toBe('-1');
            expect(view.getAttribute('tabindex')).toBe('-1');

            act(() => edit.focus());

            expect(file.getAttribute('tabindex')).toBe('-1');
            expect(edit.getAttribute('tabindex')).toBe('0');
        });

        it('gives the tab stop to the first enabled member', () => {
            render(
                <Menubar>
                    <Dropdown disabled>
                        File
                        <ul>
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                    <Dropdown>
                        Edit
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            const [file, edit] = screen.getAllByRole('menuitem');
            expect(file.getAttribute('tabindex')).toBe('-1');
            expect(edit.getAttribute('tabindex')).toBe('0');
        });

        it('hands the tab stop on when the holder unmounts', () => {
            const { rerender } = render(
                <Menubar>
                    <Dropdown>
                        File
                        <ul>
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                    <Dropdown>
                        Edit
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            expect(screen.getByRole('menuitem', { name: 'File' })).toBeTruthy();

            rerender(
                <Menubar>
                    <Dropdown>
                        Edit
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            // the bar would otherwise be left with no tab stop at all
            expect(
                screen.getByRole('menuitem', { name: 'Edit' }).getAttribute('tabindex'),
            ).toBe('0');
        });

        it('leaves a standalone dropdown’s trigger a plain tabbable button', () => {
            render(
                <Dropdown>
                    Standalone
                    <ul>
                        <li data-ukt-item>New</li>
                    </ul>
                </Dropdown>,
            );

            const trigger = screen.getByRole('button', { name: 'Standalone' });
            expect(trigger.getAttribute('tabindex')).toBe('0');
        });

        it('leaves a searchable member as a combobox rather than a menuitem', () => {
            render(
                <Menubar>
                    <Dropdown isSearchable label="Search">
                        <ul>
                            <li data-ukt-value="one">One</li>
                        </ul>
                    </Dropdown>
                    <Dropdown>
                        Edit
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            // a combobox isn’t a valid menubar child, so it keeps its own
            // semantics rather than being forced into menuitem
            const combobox = screen.getByRole('combobox', { name: 'Search' });
            expect(combobox).toBeTruthy();
            expect(screen.getAllByRole('menuitem')).toHaveLength(1);

            // Its wrappers are still neutralized, so the bar doesn’t own a
            // bare generic on top of the combobox. The combobox itself remains
            // invalid menubar content — no arrangement fixes that, which is
            // why the README says a search field belongs outside the bar.
            let ancestor = combobox.parentElement;
            const menubar = screen.getByRole('menubar');
            while (ancestor && ancestor !== menubar) {
                expect(ancestor.getAttribute('role')).toBe('none');
                ancestor = ancestor.parentElement;
            }
            expect(ancestor).toBe(menubar);
        });

        it('does not let a searchable member take the bar’s tab stop', () => {
            render(
                <Menubar>
                    <Dropdown isSearchable label="Search">
                        <ul>
                            <li data-ukt-value="one">One</li>
                        </ul>
                    </Dropdown>
                    <Dropdown>
                        Edit
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            // the combobox comes first in document order, but it has its own
            // native tab stop and never reads the roving value — if it held
            // the bar’s stop, every menuitem would be left at -1
            expect(
                screen.getByRole('menuitem', { name: 'Edit' }).getAttribute('tabindex'),
            ).toBe('0');

            act(() => screen.getByRole('combobox', { name: 'Search' }).focus());

            expect(
                screen.getByRole('menuitem', { name: 'Edit' }).getAttribute('tabindex'),
            ).toBe('0');
        });

        it('hands the tab stop on when an intermediate component unmounts the holder', async () => {
            const user = userEvent.setup();
            // The removal is driven by this component’s own state, so Menubar
            // never re-renders — its children prop keeps the same identity.
            // Without the removal scheduling its own reconciliation, the tab
            // stop stays stranded on the unmounted holder and the bar is left
            // with no entry point at all.
            const Members = () => {
                const [showFile, setShowFile] = useState(true);
                return (
                    <>
                        <button onClick={() => setShowFile(false)} type="button">
                            hide File
                        </button>
                        {showFile ? (
                            <Dropdown>
                                File
                                <ul>
                                    <li data-ukt-item>New</li>
                                </ul>
                            </Dropdown>
                        ) : null}
                        <Dropdown>
                            Edit
                            <ul>
                                <li data-ukt-item>Undo</li>
                            </ul>
                        </Dropdown>
                    </>
                );
            };
            render(
                <Menubar>
                    <Members />
                </Menubar>,
            );

            expect(
                screen.getByRole('menuitem', { name: 'File' }).getAttribute('tabindex'),
            ).toBe('0');
            expect(
                screen.getByRole('menuitem', { name: 'Edit' }).getAttribute('tabindex'),
            ).toBe('-1');

            await user.click(screen.getByRole('button', { name: 'hide File' }));

            expect(
                screen.getByRole('menuitem', { name: 'Edit' }).getAttribute('tabindex'),
            ).toBe('0');
        });

        it('hands the tab stop on when the holder becomes disabled', async () => {
            const user = userEvent.setup();
            // Like the unmount above, this is driven by the members’ own state,
            // so Menubar never re-renders on its own. The holder stops being
            // eligible without leaving the set, so it’s the holder’s own
            // re-registration that has to schedule the reconciliation.
            const Members = () => {
                const [isFileDisabled, setIsFileDisabled] = useState(false);
                return (
                    <>
                        <button onClick={() => setIsFileDisabled(true)} type="button">
                            disable File
                        </button>
                        <Dropdown disabled={isFileDisabled}>
                            File
                            <ul>
                                <li data-ukt-item>New</li>
                            </ul>
                        </Dropdown>
                        <Dropdown>
                            Edit
                            <ul>
                                <li data-ukt-item>Undo</li>
                            </ul>
                        </Dropdown>
                    </>
                );
            };
            render(
                <Menubar>
                    <Members />
                </Menubar>,
            );

            expect(
                screen.getByRole('menuitem', { name: 'File' }).getAttribute('tabindex'),
            ).toBe('0');

            await user.click(screen.getByRole('button', { name: 'disable File' }));

            expect(
                screen.getByRole('menuitem', { name: 'Edit' }).getAttribute('tabindex'),
            ).toBe('0');
            expect(
                screen.getByRole('menuitem', { name: 'File' }).getAttribute('tabindex'),
            ).toBe('-1');
        });

        it('hands the tab stop on when the holder is hidden with <Activity>', async () => {
            const user = userEvent.setup();
            // Hiding a subtree with <Activity> unmounts its effects while
            // leaving the DOM in place, so the holder deregisters with its
            // trigger still in the document. Deciding it stayed because its
            // element is still connected would strand the tab stop on a
            // trigger nobody can reach.
            const Members = () => {
                const [isFileHidden, setIsFileHidden] = useState(false);
                return (
                    <>
                        <button onClick={() => setIsFileHidden(true)} type="button">
                            hide File
                        </button>
                        <Activity mode={isFileHidden ? 'hidden' : 'visible'}>
                            <Dropdown>
                                File
                                <ul>
                                    <li data-ukt-item>New</li>
                                </ul>
                            </Dropdown>
                        </Activity>
                        <Dropdown>
                            Edit
                            <ul>
                                <li data-ukt-item>Undo</li>
                            </ul>
                        </Dropdown>
                    </>
                );
            };
            render(
                <Menubar>
                    <Members />
                </Menubar>,
            );

            expect(
                screen.getByRole('menuitem', { name: 'File' }).getAttribute('tabindex'),
            ).toBe('0');

            await user.click(screen.getByRole('button', { name: 'hide File' }));

            // the reconciliation waits for the commit to settle, so that a
            // member that merely re-rendered isn’t mistaken for one that left
            await waitFor(() => {
                expect(
                    screen
                        .getByRole('menuitem', { name: 'Edit' })
                        .getAttribute('tabindex'),
                ).toBe('0');
            });
        });
    });

    it('keeps at most one menu open at a time', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // focusing + opening another member closes the open one
        const viewTrigger = screen.getByRole('menuitem', { name: 'View' });
        act(() => viewTrigger.focus());
        await user.keyboard('{Enter}');
        expect(screen.getByTestId('view-menu')).toBeTruthy();
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('closes an open menu when its trigger is clicked again (hover pre-switches, click toggles)', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // Clicking another trigger hovers it first, which switches the open
        // menu to it (macOS behavior); the click then toggles it closed like
        // any click on an open menu’s trigger
        await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(screen.queryByTestId('edit-menu')).toBe(null);
    });

    it('switches the open menu on hover without a click', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        fireEvent.mouseOver(screen.getByRole('menuitem', { name: 'Edit' }));
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('does not open a menu on hover when no menu is open', () => {
        renderMenubar();
        fireEvent.mouseOver(screen.getByRole('menuitem', { name: 'Edit' }));
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

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // Hovering the plain button closes the open menu…
        fireEvent.mouseOver(screen.getByRole('button', { name: 'Run' }));
        expect(screen.queryByTestId('file-menu')).toBe(null);

        // …but the bar stays engaged, so hovering a trigger reopens a menu
        // without another click
        fireEvent.mouseOver(screen.getByRole('menuitem', { name: 'Edit' }));
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
    });

    it('keeps the open menu when the pointer crosses the bar’s own padding', async () => {
        const user = userEvent.setup();
        renderMenubarWithButton();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // The gaps between triggers aren’t interactive controls, so sliding
        // across them leaves the open menu alone (seamless menu-to-menu hover)
        fireEvent.mouseOver(screen.getByRole('menubar'));
        expect(screen.getByTestId('file-menu')).toBeTruthy();
    });

    it('stops reopening menus on hover once the bar is dismissed with Escape', async () => {
        const user = userEvent.setup();
        renderMenubarWithButton();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        await user.keyboard('{Escape}');
        expect(screen.queryByTestId('file-menu')).toBe(null);

        // Escape is a deliberate dismissal, so it leaves menu-mode: hovering a
        // trigger no longer opens a menu until a click re-engages the bar
        fireEvent.mouseOver(screen.getByRole('menuitem', { name: 'Edit' }));
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

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        // Remove the engaged dropdown without dismissing it. With the engaging
        // member gone, the bar is no longer engaged, so hovering another
        // trigger doesn’t reopen a menu.
        rerender(<Bar showFile={false} />);
        fireEvent.mouseOver(screen.getByRole('menuitem', { name: 'Edit' }));
        expect(screen.queryByTestId('edit-menu')).toBe(null);
    });

    it('switches the open menu when focus moves to another trigger', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        act(() => screen.getByRole('menuitem', { name: 'Edit' }).focus());
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
        expect(screen.queryByTestId('file-menu')).toBe(null);
    });

    it('roves focus between triggers with ←/→ while no menu is open, wrapping at the ends', async () => {
        const user = userEvent.setup();
        renderMenubar();

        const fileTrigger = screen.getByRole('menuitem', { name: 'File' });
        const editTrigger = screen.getByRole('menuitem', { name: 'Edit' });
        const viewTrigger = screen.getByRole('menuitem', { name: 'View' });

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

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        await user.keyboard('{ArrowRight}');
        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(screen.getByTestId('edit-menu')).toBeTruthy();
        expect(document.activeElement).toBe(
            screen.getByRole('menuitem', { name: 'Edit' }),
        );

        await user.keyboard('{ArrowLeft}');
        expect(screen.queryByTestId('edit-menu')).toBe(null);
        expect(screen.getByTestId('file-menu')).toBeTruthy();
    });

    it('slides to the previous menu with ← wrapping to the last menu', async () => {
        const user = userEvent.setup();
        renderMenubar();

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
        await user.keyboard('{ArrowLeft}');

        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(screen.getByTestId('view-menu')).toBeTruthy();
    });

    it('still navigates items with ↑/↓ and submits with Enter inside the open menu', async () => {
        const handleSubmitItem = vi.fn<() => void>();
        const user = userEvent.setup();
        renderMenubar({ onSubmitItem: handleSubmitItem });

        await user.click(screen.getByRole('menuitem', { name: 'File' }));
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

        const fileTrigger = screen.getByRole('menuitem', { name: 'File' });
        await user.click(fileTrigger);
        expect(screen.getByTestId('file-menu')).toBeTruthy();

        await user.keyboard('{Escape}');
        expect(screen.queryByTestId('file-menu')).toBe(null);
        expect(document.activeElement).toBe(fileTrigger);
    });

    describe('disabled members', () => {
        const renderWithDisabledMiddle = () =>
            render(
                <Menubar>
                    <Dropdown>
                        File
                        <ul data-testid="file-menu">
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                    <Dropdown disabled>
                        Edit
                        <ul data-testid="edit-menu">
                            <li data-ukt-item>Undo</li>
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

        it('skips a disabled member when → slides the open menu', async () => {
            const user = userEvent.setup();
            renderWithDisabledMiddle();

            await user.click(screen.getByRole('menuitem', { name: 'File' }));
            expect(screen.getByTestId('file-menu')).toBeTruthy();

            await user.keyboard('{ArrowRight}');

            // Edit is disabled, so → passes over it and lands on View
            expect(screen.queryByTestId('edit-menu')).toBe(null);
            expect(screen.getByTestId('view-menu')).toBeTruthy();
        });

        it('skips a disabled member when ← slides the open menu', async () => {
            const user = userEvent.setup();
            renderWithDisabledMiddle();

            await user.click(screen.getByRole('menuitem', { name: 'View' }));
            await user.keyboard('{ArrowLeft}');

            expect(screen.queryByTestId('edit-menu')).toBe(null);
            expect(screen.getByTestId('file-menu')).toBeTruthy();
        });

        it('skips a disabled member when ←/→ rove focus with no menu open', () => {
            renderWithDisabledMiddle();

            // the roving path is a separate branch from sliding an open menu:
            // it only runs while nothing is open
            const file = screen.getByRole('menuitem', { name: 'File' });
            act(() => file.focus());
            fireEvent.keyDown(file, { key: 'ArrowRight' });

            expect(document.activeElement).toBe(
                screen.getByRole('menuitem', { name: 'View' }),
            );
            expect(screen.queryByTestId('edit-menu')).toBe(null);
        });

        it('still consumes ←/→ when there is no enabled member to move to', () => {
            render(
                <Menubar>
                    <Dropdown>
                        File
                        <ul>
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                    <Dropdown disabled>
                        Edit
                        <ul>
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            const file = screen.getByRole('menuitem', { name: 'File' });
            act(() => file.focus());
            // deciding to stay put is still handling the key — letting it
            // through would scroll the page under the focused menubar
            const handled = fireEvent.keyDown(file, { key: 'ArrowRight' });

            expect(handled).toBe(false);
            expect(document.activeElement).toBe(file);
        });

        it('does not open a disabled member on hover once the bar is engaged', async () => {
            const user = userEvent.setup();
            renderWithDisabledMiddle();

            await user.click(screen.getByRole('menuitem', { name: 'File' }));
            // hovering the disabled member’s root leaves File open rather than
            // switching to (or clearing for) Edit
            fireEvent.mouseOver(screen.getByRole('menuitem', { name: 'Edit' }));

            expect(screen.queryByTestId('edit-menu')).toBe(null);
            expect(screen.getByTestId('file-menu')).toBeTruthy();
        });

        it('keeps the open menu when every other member is disabled', async () => {
            const user = userEvent.setup();
            render(
                <Menubar>
                    <Dropdown>
                        File
                        <ul data-testid="file-menu">
                            <li data-ukt-item>New</li>
                        </ul>
                    </Dropdown>
                    <Dropdown disabled>
                        Edit
                        <ul data-testid="edit-menu">
                            <li data-ukt-item>Undo</li>
                        </ul>
                    </Dropdown>
                </Menubar>,
            );

            await user.click(screen.getByRole('menuitem', { name: 'File' }));
            await user.keyboard('{ArrowRight}');

            // nothing enabled to move to, so File stays open rather than
            // closing and opening nothing
            expect(screen.getByTestId('file-menu')).toBeTruthy();
            expect(screen.queryByTestId('edit-menu')).toBe(null);
        });
    });
    describe('searchable members', () => {
        // A searchable member is a combobox, not a menu item: it keeps its own
        // semantics, so the bar neither consumes ←/→ within it nor roves to it
        const renderWithSearchable = () =>
            render(
                <Menubar>
                    <Dropdown isSearchable>
                        <input data-testid="search" placeholder="Search" />
                        <ul data-testid="search-menu">
                            <li data-ukt-item>Alpha</li>
                        </ul>
                    </Dropdown>
                    <Dropdown>
                        Edit
                        <ul data-testid="edit-menu">
                            <li data-ukt-item>Undo</li>
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

        it('leaves ←/→ to the caret inside a searchable member’s input', () => {
            renderWithSearchable();

            const input = screen.getByTestId('search') as HTMLInputElement;
            input.focus();

            // fireEvent returns false when a handler called preventDefault
            expect(fireEvent.keyDown(input, { key: 'ArrowLeft' })).toBe(true);
            expect(document.activeElement).toBe(input);

            expect(fireEvent.keyDown(input, { key: 'ArrowRight' })).toBe(true);
            expect(document.activeElement).toBe(input);
        });

        it('passes over a searchable member when roving with ←/→', async () => {
            const user = userEvent.setup();
            renderWithSearchable();

            const editTrigger = screen.getByRole('menuitem', { name: 'Edit' });
            const viewTrigger = screen.getByRole('menuitem', { name: 'View' });

            editTrigger.focus();
            await user.keyboard('{ArrowRight}');
            expect(document.activeElement).toBe(viewTrigger);

            // wrapping past the end skips the combobox back to Edit rather
            // than landing in the search input
            await user.keyboard('{ArrowRight}');
            expect(document.activeElement).toBe(editTrigger);

            await user.keyboard('{ArrowLeft}');
            expect(document.activeElement).toBe(viewTrigger);
        });
    });
});
