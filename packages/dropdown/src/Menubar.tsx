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

// Combines sibling Dropdowns into a single menu, like the system menu in the
// top toolbar of macOS: one menu open at a time, ←/→ move between menus, and
// once any menu is open, hovering or focusing another trigger switches to it.
export default function Menubar({ children, className, style }: MenubarProps) {
    const membersRef = useRef<Set<MenubarMember>>(new Set());

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
                const nextIndex = (index + direction + members.length) % members.length;
                members[index].close();
                members[nextIndex].open();
                members[nextIndex].focusTrigger();
            },
            notifyOpened(element: HTMLElement) {
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
        event.preventDefault();
        event.stopPropagation();
        const direction = key === 'ArrowRight' ? 1 : -1;
        members[(index + direction + members.length) % members.length].focusTrigger();
    };

    // Once any menu is open, moving hover or focus to another member’s
    // trigger switches to it (opening notifies the menubar, which closes
    // the other open member)
    const switchToMemberAt = (eventTarget: HTMLElement) => {
        const members = getOrderedMembers();
        if (!members.some((member) => member.isOpen())) return;
        const member = members.find((m) => m.element.contains(eventTarget));
        if (!member || member.isOpen()) return;
        member.open();
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
