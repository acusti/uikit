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

// Only an enabled member that actually renders as a menuitem can hold the bar's
// tab stop. A searchable member is a combobox with its own native tab stop and
// never reads the roving value, so letting it take ownership would leave every
// menuitem at -1 and the bar without a menu entry point.
const canHoldTabStop = (member: MenubarMember) =>
    !member.isDisabled() && member.isMenuItem();

// Combines sibling Dropdowns into a single menu, like the system menu in the
// top toolbar of macOS: one menu open at a time, ←/→ move between menus, and
// once any menu is open, hovering or focusing another trigger switches to it.
export default function Menubar({ children, className, style }: MenubarProps) {
    const membersRef = useRef<Set<MenubarMember>>(new Set());
    // APG gives a menubar a single tab stop: one trigger is tabbable and the
    // rest are reached with ←/→. This holds whichever member currently owns
    // it, moving to whichever trigger the user last focused.
    const [tabbableElement, setTabbableElement] = useState<HTMLElement | null>(null);
    const [, reconcile] = useReducer((count: number) => count + 1, 0);
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
    // Deliberately runs on every render rather than on a dependency list. An
    // unmounting member changes no state here — it only removes itself from
    // membersRef during its own cleanup — so there is nothing to depend on
    // that would catch it. The setState the lint rule warns about can't chain:
    // it only fires when the current holder is missing or disabled, and the
    // value it sets makes the guard above return on the next run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const members = getOrderedMembersRef.current();
        const owner = members.find((member) => member.element === tabbableElement);
        if (owner && canHoldTabStop(owner)) return;
        const nextOwner = members.find(canHoldTabStop);
        setTabbableElement(nextOwner?.element ?? null);
    });

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
                // Members register from their own effects, which don’t
                // re-render this component, so the reconciliation effect below
                // would never see them arrive — claim the tab stop here
                // instead when it’s going spare. Members register in document
                // order, so the first enabled one gets it.
                setTabbableElement((current) =>
                    current == null && canHoldTabStop(member) ? member.element : current,
                );
                return () => {
                    membersRef.current.delete(member);
                    // Membership changes in a member's own effect, which
                    // doesn't re-render this component — and an intermediate
                    // component can unmount a member without Menubar
                    // re-rendering at all, which would strand the tab stop on
                    // an element that's gone. Force the render so the effect
                    // above reconciles; it reads the settled member set,
                    // since React runs every cleanup and setup before the
                    // batched re-render.
                    reconcile();
                    // Deliberately not released here. Members re-register on
                    // every render, and React runs every cleanup before any
                    // setup — so releasing would hand the tab stop to whichever
                    // member re-registers first (always the first in the bar)
                    // rather than back to the one that held it. A genuinely
                    // unmounted holder is picked up by the effect below, which
                    // no longer finds it among the members.
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
        const members = getOrderedMembers();
        if (members.length < 2) return;
        if (members.some((member) => member.isOpen())) return;
        const eventTarget = event.target as HTMLElement;
        const index = members.findIndex((member) => member.element.contains(eventTarget));
        if (index === -1) return;
        // Once focus is on a member, ←/→ belong to the bar, so the key is
        // consumed whether or not there's an enabled member to move to —
        // otherwise deciding to stay put would let it through to scroll the page
        event.preventDefault();
        event.stopPropagation();
        const direction = key === 'ArrowRight' ? 1 : -1;
        const next = findNextEnabledMember(members, index, direction);
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

    // Focusing a trigger hands it the bar's tab stop, so tabbing away and back
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
