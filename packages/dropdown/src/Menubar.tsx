import { isEventTargetUsingKeyEvent } from '@acusti/use-keyboard-events';
import clsx from 'clsx';
import {
    type CSSProperties,
    type FocusEvent as ReactFocusEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';

import {
    MenubarContext,
    type MenubarContextValue,
    type MenubarMember,
} from './context.js';

export type MenubarProps = {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
};

const compareDocumentOrder = (a: MenubarMember, b: MenubarMember) => {
    if (a.element === b.element) return 0;
    const position = a.element.compareDocumentPosition(b.element);
    if ((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0) return -1;
    if ((position & Node.DOCUMENT_POSITION_PRECEDING) !== 0) return 1;
    return 0;
};

// Matches interactive controls that live in the menubar without being dropdown
// triggers (e.g. a plain button). Hovering one clears the open menu without
// disengaging the menubar.
const NON_MENU_CONTROL_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

// The members the bar navigates between: enabled, and menu items rather than
// comboboxes. A searchable member keeps its own combobox semantics, so it
// neither holds the bar’s tab stop nor is a destination for ←/→.
const canHoldTabStop = (member: MenubarMember) =>
    !member.isDisabled() && member.isMenuPopup();

// The next member in `direction` the bar can land on, wrapping around and
// passing over the rest — like macOS, where a disabled menu is passed over
// rather than landed on. Returns null when no such member other than the
// starting one exists, so an all-disabled bar (or a lone enabled menu) simply
// stays put instead of closing what’s open and opening nothing.
const findNextTargetMember = (
    members: Array<MenubarMember>,
    fromIndex: number,
    direction: -1 | 1,
) => {
    const { length } = members;
    for (let step = 1; step < length; step++) {
        // + length keeps the operand positive so % is a true modulo
        const member =
            members[(((fromIndex + direction * step) % length) + length) % length];
        if (canHoldTabStop(member)) return member;
    }
    return null;
};

// Combines sibling Dropdowns into a single menu, like the system menu in the
// top toolbar of macOS: one menu open at a time, ←/→ move between menus, and
// once any menu is open, hovering or focusing another trigger switches to it.
export default function Menubar({ children, className, style }: MenubarProps) {
    const membersRef = useRef<Set<MenubarMember>>(new Set());
    // APG gives a menubar a single tab stop: one trigger is tabbable and the
    // rest are reached with ←/→. This holds whichever member currently owns
    // it, moving to whichever trigger the user last focused.
    const [tabbableElement, setTabbableElement] = useState<HTMLElement | null>(null);
    const [reconcileCount, reconcile] = useReducer((count: number) => count + 1, 0);
    // The member that engaged the bar (menu-mode). It keeps pointing at that
    // member even if that member’s menu was closed by hovering a non-menu
    // control, which allows the bar to stay engaged even with nothing open.
    const engagedMemberRef = useRef<HTMLElement | null>(null);

    const getOrderedMembersRef = useRef(() =>
        Array.from(membersRef.current).sort(compareDocumentOrder),
    );
    const getOrderedMembers = getOrderedMembersRef.current;

    // Keep the tab stop on a member that still exists and can take focus: on
    // first render, and whenever the owner unmounts or becomes disabled, it
    // falls to the first enabled member in document order. Without this an
    // unmounted or disabled owner would leave the bar with no tab stop at all.
    //
    // reconcileCount is the dependency that catches a member leaving: membership
    // changes in the member’s own effect, which re-renders nothing here, so its
    // cleanup bumps the reducer to say the set has settled. tabbableElement is
    // deliberately also a dependency, so the effect re-validates it whenever it
    // changes through any other path, not just on reconcile.
    useEffect(() => {
        const members = getOrderedMembersRef.current();
        const owner = members.find((member) => member.element === tabbableElement);
        if (owner && canHoldTabStop(owner)) return;
        const nextOwner = members.find(canHoldTabStop);
        setTabbableElement(nextOwner?.element ?? null);
        // oxlint-disable-next-line react/exhaustive-effect-dependencies
    }, [reconcileCount, tabbableElement]);

    const contextValue: MenubarContextValue = useMemo(
        () => ({
            moveOpen(fromElement: HTMLElement, direction: -1 | 1) {
                const members = getOrderedMembersRef.current();
                if (members.length < 2) return;
                const index = members.findIndex(
                    (member) => member.element === fromElement,
                );
                if (index === -1) return;
                const next = findNextTargetMember(members, index, direction);
                // Nothing enabled to move to: keep the current menu open
                // rather than closing it and opening nothing
                if (!next) return;
                members[index].close();
                next.open();
                next.focusTrigger();
            },
            notifyClosed(element: HTMLElement) {
                // Only a dismissal of the member that engaged the bar ends
                // menu-mode. Outside-click handling closes every mounted
                // dropdown, so ignore the closes reported for the rest.
                if (engagedMemberRef.current === element) {
                    engagedMemberRef.current = null;
                }
            },
            notifyOpened(element: HTMLElement) {
                engagedMemberRef.current = element;
                for (const member of membersRef.current) {
                    if (member.element !== element && member.isOpen()) {
                        member.close();
                    }
                }
            },
            registerMember(member: MenubarMember) {
                membersRef.current.add(member);
                // Claim the tab stop when it’s going spare; members register
                // in document order, so the first enabled one gets it
                setTabbableElement((current) => {
                    // Claim the tab stop when it’s going spare; members
                    // register in document order, so the first enabled one
                    // gets it
                    if (current == null) {
                        return canHoldTabStop(member) ? member.element : current;
                    }
                    // A holder that re-registers no longer able to hold it
                    // (disabled, or no longer a menu) gives it up here, where
                    // the fresh member reflects the props that changed; the
                    // effect above then rehomes it. Every other
                    // re-registration returns `current` untouched, so React
                    // bails out instead of re-rendering the bar.
                    if (current === member.element && !canHoldTabStop(member)) {
                        return null;
                    }
                    return current;
                });
                return () => {
                    membersRef.current.delete(member);
                    // Say the set has settled, so the effect above can pick
                    // up a tab stop stranded on an unmounted member. Members
                    // re-register on every render, so this cleanup runs far
                    // more often than one actually leaves: only the holder
                    // actually going strands the tab stop, and React has
                    // already detached its element by the time this runs,
                    // which is what tells a departure from a re-render.
                    // Bumping for the rest would schedule a Menubar render
                    // that changes nothing. Losing eligibility without leaving
                    // is handled on the registration side above.
                    if (
                        member.element === tabbableElement &&
                        !member.element.isConnected
                    ) {
                        reconcile();
                    }
                    // the tab stop is deliberately not released here: members
                    // re-register on every render, and React runs every cleanup
                    // before any setup, so releasing would hand it to whichever
                    // member re-registers first rather than back to the holder
                };
            },
            tabbableElement,
        }),
        [tabbableElement],
    );

    // Rove focus between triggers with ←/→ while no menu is open (the open
    // dropdown’s own key handling slides the open menu between triggers)
    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const { key } = event;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
        // ←/→ are caret movement while a text input has focus (a searchable
        // member’s input, or one inside a custom trigger), so the bar stands
        // down — the same rule the members’ own key handling follows
        if (isEventTargetUsingKeyEvent(event.nativeEvent)) return;
        const members = getOrderedMembers();
        if (members.length < 2) return;
        if (members.some((member) => member.isOpen())) return;
        const eventTarget = event.target as HTMLElement;
        const index = members.findIndex((member) => member.element.contains(eventTarget));
        // Only the bar’s menu items rove. A searchable member is a combobox
        // that sits outside the bar’s navigation, so ←/→ within it stay its own
        if (index === -1 || !members[index].isMenuPopup()) return;
        // Once focus is on a member, ←/→ belong to the bar, so the key is
        // consumed whether or not there's an enabled member to move to —
        // otherwise deciding to stay put would let it through to scroll the page
        event.preventDefault();
        event.stopPropagation();
        const direction = key === 'ArrowRight' ? 1 : -1;
        const next = findNextTargetMember(members, index, direction);
        if (!next) return;
        next.focusTrigger();
    };

    // Once the bar is engaged, moving hover or focus onto another member’s
    // trigger switches to it (opening notifies the menubar, which closes the
    // other open member), while moving onto a non-menu control clears the open
    // menu but keeps the bar engaged.
    const switchToMemberAt = (eventTarget: HTMLElement) => {
        if (engagedMemberRef.current == null) return;
        const members = getOrderedMembers();
        // If the member that engaged the bar is gone (e.g. it unmounted while
        // engaged) the bar is no longer engaged, so hover can’t reopen menus
        if (!members.some((m) => m.element === engagedMemberRef.current)) {
            engagedMemberRef.current = null;
            return;
        }
        const member = members.find((m) => m.element.contains(eventTarget));
        if (member) {
            // A disabled member never opens, and hovering it leaves whatever
            // is open alone rather than clearing it
            if (member.isDisabled()) return;
            if (!member.isOpen()) member.open();
            return;
        }
        // Not over a menu trigger: only a real non-menu control (not the bar’s
        // padding or the gaps between triggers) clears the open menu — this is
        // a menubar-driven close, so the members stay engaged.
        if (!eventTarget.closest(NON_MENU_CONTROL_SELECTOR)) return;
        for (const openMember of members) {
            if (openMember.isOpen()) openMember.close();
        }
    };

    // focusing a trigger hands it the bar’s tab stop, so tabbing away and back
    // returns to the trigger the user was last on rather than to the first
    const handleFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
        const eventTarget = event.target as HTMLElement;
        const member = getOrderedMembers().find((m) => m.element.contains(eventTarget));
        if (member && canHoldTabStop(member)) setTabbableElement(member.element);
        switchToMemberAt(eventTarget);
    };

    const handleMouseOver = (event: ReactMouseEvent<HTMLDivElement>) => {
        switchToMemberAt(event.target as HTMLElement);
    };

    return (
        <div
            className={clsx('uktmenubar', className)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onMouseOver={handleMouseOver}
            role="menubar"
            style={style}
        >
            <MenubarContext.Provider value={contextValue}>
                {children}
            </MenubarContext.Provider>
        </div>
    );
}
