import clsx from 'clsx';
import {
    type CSSProperties,
    type FocusEvent as ReactFocusEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    useMemo,
    useRef,
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

// The next member in `direction` that isn’t disabled, wrapping around and
// skipping disabled ones — like macOS, where a disabled menu is passed over
// rather than landed on. Returns null when no enabled member other than the
// starting one exists, so an all-disabled bar (or a lone enabled menu) simply
// stays put instead of closing what’s open and opening nothing.
const findNextEnabledMember = (
    members: Array<MenubarMember>,
    fromIndex: number,
    direction: -1 | 1,
) => {
    const { length } = members;
    for (let step = 1; step < length; step++) {
        // + length keeps the operand positive so % is a true modulo
        const member =
            members[(((fromIndex + direction * step) % length) + length) % length];
        if (!member.isDisabled()) return member;
    }
    return null;
};

// Combines sibling Dropdowns into a single menu, like the system menu in the
// top toolbar of macOS: one menu open at a time, ←/→ move between menus, and
// once any menu is open, hovering or focusing another trigger switches to it.
export default function Menubar({ children, className, style }: MenubarProps) {
    const membersRef = useRef<Set<MenubarMember>>(new Set());
    // The member that engaged the bar (menu-mode). It keeps pointing at that
    // member even if that member’s menu was closed by hovering a non-menu
    // control, which allows the bar to stay engaged even with nothing open.
    const engagedMemberRef = useRef<HTMLElement | null>(null);

    const getOrderedMembersRef = useRef(() =>
        Array.from(membersRef.current).sort(compareDocumentOrder),
    );
    const getOrderedMembers = getOrderedMembersRef.current;

    const contextValue: MenubarContextValue = useMemo(
        () => ({
            moveOpen(fromElement: HTMLElement, direction: -1 | 1) {
                const members = getOrderedMembersRef.current();
                if (members.length < 2) return;
                const index = members.findIndex(
                    (member) => member.element === fromElement,
                );
                if (index === -1) return;
                const next = findNextEnabledMember(members, index, direction);
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
                return () => {
                    membersRef.current.delete(member);
                };
            },
        }),
        [],
    );

    // Rove focus between triggers with ←/→ while no menu is open (the open
    // dropdown’s own key handling slides the open menu between triggers)
    const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const { key } = event;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
        const members = getOrderedMembers();
        if (members.length < 2) return;
        if (members.some((member) => member.isOpen())) return;
        const eventTarget = event.target as HTMLElement;
        const index = members.findIndex((member) => member.element.contains(eventTarget));
        if (index === -1) return;
        const direction = key === 'ArrowRight' ? 1 : -1;
        const next = findNextEnabledMember(members, index, direction);
        if (!next) return;
        event.preventDefault();
        event.stopPropagation();
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

    const handleFocus = (event: ReactFocusEvent<HTMLDivElement>) => {
        switchToMemberAt(event.target as HTMLElement);
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
