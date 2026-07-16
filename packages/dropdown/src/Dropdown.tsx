/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/mouse-events-have-key-events, jsx-a11y/no-static-element-interactions */
import useKeyboardEvents, {
    isEventTargetUsingKeyEvent,
} from '@acusti/use-keyboard-events';
import clsx from 'clsx';
import {
    Children,
    cloneElement,
    type CSSProperties,
    Fragment,
    isValidElement,
    type MouseEvent as ReactMouseEvent,
    type ReactElement,
    type ReactNode,
    type SyntheticEvent,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    DropdownContext,
    type DropdownContextValue,
    MenubarContext,
    type SubmenuRegistration,
} from './context.js';
import styles from './Dropdown.css?inline';
import {
    annotateParentItems,
    collapseItem,
    collapseItemsOutsidePath,
    expandItem,
    getActiveItemElement,
    getDeepestExpandedItem,
    getItemElements,
    getItemForTarget,
    getItemPath,
    getLabelFromChildren,
    getLevelRoot,
    getParentItem,
    getSubmenuOfItem,
    isItemExpanded,
    isPointInTriangle,
    type Point,
    setActiveItem,
} from './helpers.js';

export type Item = {
    element: MaybeHTMLElement;
    event: Event | SyntheticEvent<HTMLElement>;
    label: string;
    /**
     * Ancestor parent items from the root level down to the item’s
     * immediate parent. Empty for top-level items.
     */
    path: Array<ItemValue>;
    value: string;
};

/**
 * A { label, value } pair naming an item: `value` is the stored value (the
 * item’s data-ukt-value) and `label` is its displayed text. Accepted by the
 * value prop when an item’s value and label differ; also the shape of an
 * Item’s path entries.
 */
export type ItemValue = { label: string; value: string };

export type Props = {
    /**
     * Boolean indicating if the user can submit a value not already in the
     * dropdown.
     */
    allowCreate?: boolean;
    /**
     * Boolean indicating if submitting with no item active emits an empty
     * value (i.e. clears the value). Only has an effect when the dropdown has a
     * text input to source that value from — a searchable dropdown’s search
     * input, or a text input inside a custom trigger. With no such input there
     * is no value to submit, so submitting with nothing selected is a no-op
     * regardless; clear such a dropdown with an explicit empty-valued item
     * instead. Defaults to true.
     */
    allowEmpty?: boolean;
    /**
     * Can take a single React element or exactly two renderable children.
     */
    children: ChildrenTuple | ReactElement;
    className?: string;
    disabled?: boolean;
    hasItems?: boolean;
    isOpenOnMount?: boolean;
    isSearchable?: boolean;
    keepOpenOnSubmit?: boolean;
    /**
     * Label content for the trigger button (when using single child syntax).
     * For a nested (submenu) Dropdown, this is the parent item’s content.
     */
    label?: ReactNode;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s name.
     */
    name?: string;
    onActiveItem?: (payload: Item) => void;
    onClick?: (event: ReactMouseEvent<HTMLElement>) => unknown;
    onClose?: () => unknown;
    onMouseDown?: (event: ReactMouseEvent<HTMLElement>) => unknown;
    onMouseUp?: (event: ReactMouseEvent<HTMLElement>) => unknown;
    onOpen?: () => unknown;
    onSubmitItem?: (payload: Item) => void;
    /**
     * Opens the dropdown when the pointer hovers the trigger, and closes it a
     * short moment after the pointer leaves the trigger and body entirely (the
     * close is delayed so crossing the gap between them, or pausing over
     * either, doesn’t flicker-close it). Click and keyboard opening keep
     * working as usual alongside it.
     */
    openOnHover?: boolean;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s placeholder.
     */
    placeholder?: string;
    /**
     * Applied to the dropdown root element. Also accepts the component’s CSS
     * custom properties (e.g. `--uktdd-body-min-width`) for per-instance
     * placement and sizing, which plain `CSSProperties` rejects.
     */
    style?: CSSProperties & Record<`--${string}`, string | number | undefined>;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s tabIndex.
     */
    tabIndex?: number;
    /**
     * The dropdown’s controlled value. Pass a bare identifier when an item’s
     * stored value and its displayed label are the same, or a { label, value }
     * pair when they differ (e.g. a human-readable label shown for a stored
     * id) — the same { label, value } shape onSubmitItem reports back. The
     * value determines whether the value has changed, to avoid triggering
     * onSubmitItem when the already-selected item is re-submitted; the label is
     * used as the search input’s value when props.isSearchable === true. A bare
     * identifier is resolved to its label from the matching child’s
     * data-ukt-value in the body — so children whose value and label differ
     * need no explicit label; a { label, value } pair states it.
     */
    value?: ItemValue | string;
};

type ChildrenTuple = [ReactNode, ReactNode] | readonly [ReactNode, ReactNode];

type MaybeHTMLElement = HTMLElement | null;

type MousePosition = { clientX: number; clientY: number };

type TimeoutID = ReturnType<typeof setTimeout>;

const CHILDREN_ERROR =
    '@acusti/dropdown requires either 1 child (the dropdown body) or 2 children: the dropdown trigger and the dropdown body.';
const CLICKABLE_SELECTOR = 'button, a[href], input[type="button"], input[type="submit"]';
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';
const TEXT_INPUT_SELECTOR =
    'input:not([type=radio]):not([type=checkbox]):not([type=range]),textarea';

// Matches macOS: quick, natural arrowing past parent items never flashes
// their submenus, but a brief pause discloses. Frame-stepping macOS menus
// puts its delay around 200–250ms; anything much shorter flashes
const SUBMENU_DISCLOSURE_DELAY = 200;

// How long the pointer can dwell inside the safe area (heading toward an open
// submenu) before we give up and switch to whatever it’s actually over. Reset
// on every move, so it only fires on a pause — motion keeps the submenu open
const SAFE_AREA_TIMEOUT = 300;

// props.openOnHover opens immediately on hover, but closing waits a beat so
// that crossing the trigger/body gap (or a placement fallback moving the body
// somewhere the pointer briefly leaves) doesn’t flicker-close it
const HOVER_CLOSE_DELAY = 150;

export default function Dropdown(props: Props) {
    const parentDropdown = useContext(DropdownContext);
    // A Dropdown nested inside a menu dropdown’s body renders as a submenu
    // (a parent item delegating to the root engine). A hasItems={false}
    // dropdown provides no submenu context, so a Dropdown nested inside one —
    // or a hasItems={false} Dropdown anywhere — renders independently instead.
    if (parentDropdown && props.hasItems !== false) {
        return <SubmenuDropdown {...props} parentDropdown={parentDropdown} />;
    }
    return <RootDropdown {...props} />;
}

function RootDropdown({
    allowCreate,
    allowEmpty = true,
    children,
    className,
    disabled,
    hasItems = true,
    isOpenOnMount,
    isSearchable,
    keepOpenOnSubmit = !hasItems,
    label,
    name,
    onActiveItem,
    onClick,
    onClose,
    onMouseDown,
    onMouseUp,
    onOpen,
    onSubmitItem,
    openOnHover,
    placeholder,
    style: styleFromProps,
    tabIndex,
    value,
}: Props) {
    const childrenCount = Children.count(children);
    if (childrenCount !== 1 && childrenCount !== 2) {
        if (childrenCount === 0) {
            throw new Error(CHILDREN_ERROR + ' Received no children.');
        }
        console.error(`${CHILDREN_ERROR} Received ${childrenCount} children.`);
    }

    let trigger: React.ReactNode;
    if (childrenCount > 1) {
        trigger = (children as ChildrenTuple)[0];
    }

    // The value prop is either a bare identifier (its stored value and its
    // displayed label are the same) or a { label, value } pair when they
    // differ. valueIdentity drives change detection / no-op matching against an
    // item’s data-ukt-value; valueLabel is what a searchable dropdown shows in
    // its input. For a bare identifier, the label is resolved from the matching
    // child (data-ukt-value in the body), so children with distinct values and
    // labels need no separate label; a { label, value } pair states it
    // explicitly. Only a searchable dropdown displays the label, so skip the
    // per-render children walk entirely for anything else.
    const valueIdentity = typeof value === 'string' ? value : value?.value;
    const valueLabel = !isSearchable
        ? undefined
        : typeof value !== 'string'
          ? value?.label
          : (getLabelFromChildren(children, value) ?? value);

    const [isOpen, setIsOpen] = useState<boolean>(isOpenOnMount ?? false);
    const [isOpening, setIsOpening] = useState<boolean>(!isOpenOnMount);
    const [dropdownElement, setDropdownElement] = useState<MaybeHTMLElement>(null);
    const bodyId = useId();
    const popupRole = isSearchable ? 'listbox' : hasItems ? 'menu' : 'dialog';
    const menubar = useContext(MenubarContext);
    const inputElementRef = useRef<HTMLInputElement | null>(null);
    const closingTimerRef = useRef<null | TimeoutID>(null);
    const isOpeningTimerRef = useRef<null | TimeoutID>(null);
    const currentInputMethodRef = useRef<'keyboard' | 'mouse'>('mouse');
    const clearEnteredCharactersTimerRef = useRef<null | TimeoutID>(null);
    const enteredCharactersRef = useRef<string>('');
    const mouseDownPositionRef = useRef<MousePosition | null>(null);
    const disclosureTimerRef = useRef<null | TimeoutID>(null);
    const pendingDisclosureItemRef = useRef<MaybeHTMLElement>(null);
    const submenuRegistrationsRef = useRef<Set<SubmenuRegistration>>(new Set());
    const pointerRef = useRef<Point | null>(null);
    const lastMouseEventRef = useRef<MouseEvent | null>(null);
    const safeAreaRef = useRef<{ apex: Point; parent: HTMLElement } | null>(null);
    const safeAreaTimerRef = useRef<null | TimeoutID>(null);
    const wasInSafeAreaRef = useRef<boolean>(false);
    const hoverCloseTimerRef = useRef<null | TimeoutID>(null);

    const allowCreateRef = useRef(allowCreate);
    const allowEmptyRef = useRef(allowEmpty);
    const hasItemsRef = useRef(hasItems);
    const isOpenRef = useRef(isOpen);
    const isOpeningRef = useRef(isOpening);
    const keepOpenOnSubmitRef = useRef(keepOpenOnSubmit);
    const onCloseRef = useRef(onClose);
    const onOpenRef = useRef(onOpen);
    const onSubmitItemRef = useRef(onSubmitItem);
    const valueRef = useRef(valueIdentity);

    useEffect(() => {
        allowCreateRef.current = allowCreate;
        allowEmptyRef.current = allowEmpty;
        hasItemsRef.current = hasItems;
        isOpenRef.current = isOpen;
        isOpeningRef.current = isOpening;
        keepOpenOnSubmitRef.current = keepOpenOnSubmit;
        onCloseRef.current = onClose;
        onOpenRef.current = onOpen;
        onSubmitItemRef.current = onSubmitItem;
        valueRef.current = valueIdentity;
    }, [
        allowCreate,
        allowEmpty,
        hasItems,
        isOpen,
        isOpening,
        keepOpenOnSubmit,
        onClose,
        onOpen,
        onSubmitItem,
        valueIdentity,
    ]);

    const isMountedRef = useRef(false);

    useEffect(() => {
        if (!isMountedRef.current) {
            isMountedRef.current = true;
            // If isOpenOnMount, trigger onOpen right away
            if (isOpenRef.current && onOpenRef.current) {
                onOpenRef.current();
            }
            return;
        }

        if (isOpen && onOpenRef.current) {
            onOpenRef.current();
        } else if (!isOpen && onCloseRef.current) {
            onCloseRef.current();
        }
    }, [isOpen]);

    // Nested (submenu) Dropdowns register here so their scoped callbacks
    // (onActiveItem/onOpen/onClose/onSubmitItem) can be dispatched to them
    const dropdownContextValue: DropdownContextValue = useMemo(
        () => ({
            registerSubmenu(registration: SubmenuRegistration) {
                submenuRegistrationsRef.current.add(registration);
                return () => {
                    submenuRegistrationsRef.current.delete(registration);
                };
            },
        }),
        [],
    );

    const dispatchToSubmenus = (key: 'onActiveItem' | 'onSubmitItem', payload: Item) => {
        if (!payload.element) return;
        for (const registration of submenuRegistrationsRef.current) {
            if (registration.element.contains(payload.element)) {
                registration[key]?.(payload);
            }
        }
    };

    const handleActiveItem = (payload: Item) => {
        onActiveItem?.(payload);
        dispatchToSubmenus('onActiveItem', payload);
    };

    const handleToggleSubmenu = (item: HTMLElement, isExpanded: boolean) => {
        for (const registration of submenuRegistrationsRef.current) {
            if (registration.element === item) {
                (isExpanded ? registration.onOpen : registration.onClose)?.();
            }
        }
    };

    const clearDisclosureTimer = () => {
        if (disclosureTimerRef.current != null) {
            clearTimeout(disclosureTimerRef.current);
            disclosureTimerRef.current = null;
        }
        pendingDisclosureItemRef.current = null;
    };

    // Clear the disclosure intent timer on unmount so it can’t fire against
    // unmounted DOM or dispatch submenu callbacks after teardown
    useEffect(() => clearDisclosureTimer, []);

    // A parent item discloses its submenu after a short intent delay whenever
    // it becomes (and stays) the deepest active item, for pointer and keyboard
    // alike; submenus off the active path collapse immediately
    const syncSubmenuDisclosure = () => {
        if (!dropdownElement) return;
        const activeElement = getActiveItemElement(dropdownElement);
        collapseItemsOutsidePath(dropdownElement, activeElement, handleToggleSubmenu);
        const submenu = activeElement ? getSubmenuOfItem(activeElement) : null;
        if (activeElement && submenu && !isItemExpanded(activeElement)) {
            // A timer already pending for this item keeps its original start time
            if (pendingDisclosureItemRef.current === activeElement) return;
            clearDisclosureTimer();
            pendingDisclosureItemRef.current = activeElement;
            disclosureTimerRef.current = setTimeout(() => {
                disclosureTimerRef.current = null;
                pendingDisclosureItemRef.current = null;
                if (!activeElement.hasAttribute('data-ukt-active')) return;
                expandItem(activeElement, handleToggleSubmenu);
            }, SUBMENU_DISCLOSURE_DELAY);
            return;
        }
        clearDisclosureTimer();
    };

    const clearSafeAreaTimer = () => {
        if (safeAreaTimerRef.current != null) {
            clearTimeout(safeAreaTimerRef.current);
            safeAreaTimerRef.current = null;
        }
    };

    // Clear the safe-area give-up timer on unmount so it can’t fire against
    // unmounted DOM
    useEffect(() => clearSafeAreaTimer, []);

    // The safe area is the triangle from where the pointer last sat on the
    // open submenu’s parent (the apex) to that submenu’s two near corners.
    // While the pointer is inside it, it’s traveling toward the submenu, so the
    // submenu stays open even as the pointer crosses sibling items — the macOS
    // diagonal behavior
    const isPointerInSafeArea = (x: number, y: number): boolean => {
        const safeArea = safeAreaRef.current;
        if (!safeArea || !isItemExpanded(safeArea.parent)) return false;
        const submenu = getSubmenuOfItem(safeArea.parent);
        if (!submenu) return false;
        const submenuRect = submenu.getBoundingClientRect();
        const parentRect = safeArea.parent.getBoundingClientRect();
        // Submenus can open to either side; the near edge is the one facing
        // the parent item
        const nearX =
            submenuRect.left >= parentRect.right - 1
                ? submenuRect.left
                : submenuRect.right;
        return isPointInTriangle(
            { x, y },
            safeArea.apex,
            { x: nearX, y: submenuRect.top },
            { x: nearX, y: submenuRect.bottom },
        );
    };

    // The pointer left the safe area (or paused in it without reaching the
    // submenu): stop protecting the submenu and switch to whatever the pointer
    // is over now. Passing the target avoids an elementFromPoint read; the
    // give-up timer has no event, so it falls back to hit-testing the pointer
    const commitPointerTarget = (targetElement?: MaybeHTMLElement) => {
        clearSafeAreaTimer();
        safeAreaRef.current = null;
        wasInSafeAreaRef.current = false;
        const pointer = pointerRef.current;
        const target =
            targetElement ??
            (pointer
                ? (dropdownElement?.ownerDocument.elementFromPoint(
                      pointer.x,
                      pointer.y,
                  ) as MaybeHTMLElement)
                : null);
        if (!dropdownElement || !target || !dropdownElement.contains(target)) return;
        const item = getItemForTarget(dropdownElement, target);
        const event = lastMouseEventRef.current;
        // Only reachable via mouse events, so a real mouse event is on hand
        if (item && event) {
            setActiveItem({
                dropdownElement,
                element: item,
                event,
                onActiveItem: handleActiveItem,
            });
        }
        syncSubmenuDisclosure();
    };

    // Track the pointer against the open submenu’s safe area: anchor the apex
    // while over the parent item, and (re)arm the give-up timer while traveling
    // toward the submenu so only a pause — not motion — ends the protection
    const trackSafeArea = (event: ReactMouseEvent<HTMLElement>) => {
        // Safe-area intent only applies to an open menu with items; skip the
        // per-move DOM query otherwise (mousemove is a hot path)
        if (!dropdownElement || !isOpenRef.current || !hasItemsRef.current) return;
        const pointer = { x: event.clientX, y: event.clientY };
        pointerRef.current = pointer;
        lastMouseEventRef.current = event.nativeEvent;
        const parent = getDeepestExpandedItem(dropdownElement);
        if (!parent) {
            safeAreaRef.current = null;
            wasInSafeAreaRef.current = false;
            clearSafeAreaTimer();
            return;
        }
        const target = event.target as HTMLElement;
        const submenu = getSubmenuOfItem(parent);
        const isOverParent =
            parent.contains(target) && !(submenu?.contains(target) ?? false);
        if (isOverParent) {
            safeAreaRef.current = { apex: pointer, parent };
            wasInSafeAreaRef.current = false;
            clearSafeAreaTimer();
            return;
        }
        // A newly-open submenu we haven’t anchored an apex for yet
        if (safeAreaRef.current?.parent !== parent) {
            safeAreaRef.current = null;
        }
        clearSafeAreaTimer();
        if (isPointerInSafeArea(pointer.x, pointer.y)) {
            wasInSafeAreaRef.current = true;
            safeAreaTimerRef.current = setTimeout(commitPointerTarget, SAFE_AREA_TIMEOUT);
        } else if (wasInSafeAreaRef.current) {
            // Just crossed out of the triangle. The pointer may still be over
            // the same sibling it entered while protected, so no mouseover will
            // fire — re-evaluate and activate whatever it’s on now
            commitPointerTarget(target);
        }
    };

    const clearHoverCloseTimer = () => {
        if (hoverCloseTimerRef.current != null) {
            clearTimeout(hoverCloseTimerRef.current);
            hoverCloseTimerRef.current = null;
        }
    };

    // Clear props.openOnHover’s close timer on unmount so it can’t fire against
    // unmounted DOM
    useEffect(() => clearHoverCloseTimer, []);

    const closeDropdown = (options?: { keepMenubarEngaged?: boolean }) => {
        setIsOpen(false);
        setIsOpening(false);
        mouseDownPositionRef.current = null;
        clearDisclosureTimer();
        clearSafeAreaTimer();
        clearHoverCloseTimer();
        safeAreaRef.current = null;
        wasInSafeAreaRef.current = false;
        if (closingTimerRef.current != null) {
            clearTimeout(closingTimerRef.current);
            closingTimerRef.current = null;
        }
        // A self-dismissal — Escape, an outside click, or an item selection —
        // takes an enclosing menubar out of menu-mode. Switching menus,
        // clearing the open menu on hover, and focus changes pass
        // keepMenubarEngaged to stay in menu-mode.
        if (menubar && dropdownElement && !options?.keepMenubarEngaged) {
            menubar.notifyClosed(dropdownElement);
        }
    };

    // The pointer entered the trigger or (if open) the body: cancel any
    // pending close and, if props.openOnHover and not already open, open now
    const handleDropdownMouseEnter = () => {
        clearHoverCloseTimer();
        if (!openOnHover || isOpenRef.current) return;
        setIsOpen(true);
        setIsOpening(false);
    };

    // The pointer left the trigger and body entirely: if open, arm the
    // close-intent timer (a re-entry before it fires cancels it above, so
    // crossing the trigger/body gap doesn’t flicker)
    const handleDropdownMouseLeave = () => {
        if (!openOnHover || !isOpenRef.current || hoverCloseTimerRef.current != null) {
            return;
        }
        hoverCloseTimerRef.current = setTimeout(() => {
            hoverCloseTimerRef.current = null;
            closeDropdown();
        }, HOVER_CLOSE_DELAY);
    };

    const focusTrigger = () => {
        const firstChild = dropdownElement?.firstElementChild as MaybeHTMLElement;
        if (!firstChild) return;
        const focusable = firstChild.matches(FOCUSABLE_SELECTOR)
            ? firstChild
            : (firstChild.querySelector(FOCUSABLE_SELECTOR) as MaybeHTMLElement);
        focusable?.focus();
    };

    // Register with an enclosing Menubar (one open menu at a time, ←/→
    // moves between menus, hover-to-switch once any menu is open). Closing
    // goes through closeDropdown so pending timers (submenu disclosure,
    // close delay) can’t fire against a menu the menubar already closed.
    useEffect(() => {
        if (!menubar || !dropdownElement) return;
        return menubar.registerMember({
            close: () => closeDropdown({ keepMenubarEngaged: true }),
            element: dropdownElement,
            focusTrigger,
            isOpen: () => isOpenRef.current,
            open: () => setIsOpen(true),
        });
    });

    useEffect(() => {
        if (isOpen && menubar && dropdownElement) {
            menubar.notifyOpened(dropdownElement);
        }
    }, [dropdownElement, isOpen, menubar]);

    const handleSubmitItem = (event: Event | React.SyntheticEvent<HTMLElement>) => {
        const element = hasItemsRef.current
            ? getActiveItemElement(dropdownElement)
            : null;

        const submenuOfActive = element ? getSubmenuOfItem(element) : null;
        if (element && submenuOfActive) {
            // Parent items disclose; they never submit
            clearDisclosureTimer();
            expandItem(element, handleToggleSubmenu);
            if (currentInputMethodRef.current === 'keyboard' && dropdownElement) {
                const firstItem = getItemElements(dropdownElement, submenuOfActive)?.[0];
                if (firstItem) {
                    setActiveItem({
                        dropdownElement,
                        element: firstItem,
                        event,
                        onActiveItem: handleActiveItem,
                    });
                }
            }
            return;
        }

        if (isOpenRef.current && !keepOpenOnSubmitRef.current) {
            // A short timeout before closing is better UX when user selects an item so dropdown
            // doesn’t close before expected. It also enables using <Link />s in the dropdown body.
            closingTimerRef.current = setTimeout(closeDropdown, 90);
        }

        if (!hasItemsRef.current) return;

        if (!element) {
            // With nothing selected, the only possible value comes from a text
            // input (a searchable dropdown’s input, or one inside a custom
            // trigger). No input means there’s no value to submit at all, so
            // bail regardless of allowCreate/allowEmpty instead of firing an
            // empty-valued onSubmitItem consumers have to defend against. (To
            // let such a dropdown clear its value, give it an explicit
            // empty-valued item, which submits as a normal active selection.)
            if (!inputElementRef.current) return;
            if (inputElementRef.current.value) {
                // Non-empty text matching no item is a created value
                if (!allowCreateRef.current) return;
            } else if (!allowEmptyRef.current) {
                // A cleared input is an empty (clearing) submit, which
                // allowEmpty gates even when allowCreate is set — “creating”
                // an empty value is clearing, not creating
                return;
            }
        }

        let itemLabel = element?.innerText ?? '';
        if (inputElementRef.current) {
            if (!element) {
                itemLabel = inputElementRef.current.value;
            } else {
                inputElementRef.current.value = itemLabel;
            }

            if (
                inputElementRef.current ===
                inputElementRef.current.ownerDocument.activeElement
            ) {
                inputElementRef.current.blur();
            }
        }

        const nextValue = element?.dataset.uktValue ?? itemLabel;
        // If parent is controlling Dropdown via props.value and nextValue is the same, do nothing
        if (valueRef.current && valueRef.current === nextValue) return;

        // If the item is clickable or contains exactly one clickable element, invoke it
        // (but only if the event didn’t already originate from that element)
        if (element) {
            const eventTarget = event.target as HTMLElement;

            if (element.matches(CLICKABLE_SELECTOR)) {
                // The item element itself is clickable (e.g., <button data-ukt-value="…">)
                if (element !== eventTarget && !element.contains(eventTarget)) {
                    element.click();
                }
            } else {
                // Check if item contains exactly one clickable child element
                const clickableElements = element.querySelectorAll(CLICKABLE_SELECTOR);
                if (clickableElements.length === 1) {
                    const clickableElement = clickableElements[0] as HTMLElement;
                    if (
                        clickableElement !== eventTarget &&
                        !clickableElement.contains(eventTarget)
                    ) {
                        clickableElement.click();
                    }
                }
            }
        }

        const payload: Item = {
            element,
            event,
            label: itemLabel,
            path: getItemPath(element),
            value: nextValue,
        };
        onSubmitItemRef.current?.(payload);
        dispatchToSubmenus('onSubmitItem', payload);
    };

    const handleMouseMove = (event: ReactMouseEvent<HTMLElement>) => {
        const { clientX, clientY } = event;
        currentInputMethodRef.current = 'mouse';
        trackSafeArea(event);
        const initialPosition = mouseDownPositionRef.current;
        if (!initialPosition) return;
        if (
            Math.abs(initialPosition.clientX - clientX) < 12 &&
            Math.abs(initialPosition.clientY - clientY) < 12
        ) {
            return;
        }
        setIsOpening(false);
    };

    const handleMouseOver = (event: ReactMouseEvent<HTMLElement>) => {
        if (!hasItemsRef.current) return;

        // If user isn’t currently using the mouse to navigate the dropdown, do nothing
        if (currentInputMethodRef.current !== 'mouse') return;

        // Ensure we have the dropdown root HTMLElement
        if (!dropdownElement) return;

        const eventTarget = event.target as HTMLElement;
        if (!eventTarget.closest('.uktdropdown-body')) return;

        // Hover inside an open nested dropdown belongs to that dropdown
        const hoveredRoot = eventTarget.closest('.uktdropdown');
        if (
            hoveredRoot !== dropdownElement &&
            hoveredRoot?.classList.contains('is-open')
        ) {
            return;
        }

        // Heading toward an open submenu: keep it open even over sibling items
        if (isPointerInSafeArea(event.clientX, event.clientY)) return;

        const item = getItemForTarget(dropdownElement, eventTarget);
        if (!item) return;

        setActiveItem({
            dropdownElement,
            element: item,
            event,
            onActiveItem: handleActiveItem,
        });
        syncSubmenuDisclosure();
    };

    const handleMouseOut = (event: ReactMouseEvent<HTMLElement>) => {
        if (!hasItemsRef.current) return;
        // The pointer left the dropdown entirely: drop the safe area so its
        // give-up timer can’t later fire on a stale position, and fall through
        // to the normal collapse (mousemove has stopped, so nothing else will)
        const relatedTarget = event.relatedTarget as Node | null;
        const isLeavingDropdown = !dropdownElement?.contains(relatedTarget);
        if (isLeavingDropdown) {
            clearSafeAreaTimer();
            safeAreaRef.current = null;
            wasInSafeAreaRef.current = false;
        }
        // Heading toward an open submenu: don’t clear the active item / collapse
        if (isPointerInSafeArea(event.clientX, event.clientY)) return;
        const activeItem = getActiveItemElement(dropdownElement);
        if (!activeItem) return;
        const eventRelatedTarget = event.relatedTarget as HTMLElement;
        if (activeItem !== event.target || activeItem.contains(eventRelatedTarget)) {
            return;
        }
        // If user moused out of activeItem (not into a descendant), it’s no longer active
        delete activeItem.dataset.uktActive;
        syncSubmenuDisclosure();
    };

    const handleMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
        if (onMouseDown) onMouseDown(event);
        if (isOpenRef.current) return;

        setIsOpen(true);
        setIsOpening(true);
        mouseDownPositionRef.current = {
            clientX: event.clientX,
            clientY: event.clientY,
        };
        isOpeningTimerRef.current = setTimeout(() => {
            setIsOpening(false);
            isOpeningTimerRef.current = null;
        }, 1000);
    };

    const handleMouseUp = (event: ReactMouseEvent<HTMLElement>) => {
        if (onMouseUp) onMouseUp(event);
        // If dropdown is still opening or isn’t open or is closing, do nothing
        if (
            isOpeningRef.current ||
            !isOpenRef.current ||
            closingTimerRef.current != null
        ) {
            return;
        }

        const eventTarget = event.target as HTMLElement;

        // Clicks inside an open nested dropdown belong to that dropdown
        const clickedRoot = eventTarget.closest('.uktdropdown');
        if (
            clickedRoot !== dropdownElement &&
            clickedRoot?.classList.contains('is-open') &&
            dropdownElement?.contains(clickedRoot)
        ) {
            return;
        }

        // A click only counts as inside the body if the closest body element
        // belongs to this dropdown (a nested dropdown’s trigger sits inside
        // the outer body, but the outer body isn’t the nested one’s own)
        const targetBody = eventTarget.closest('.uktdropdown-body');
        const isInOwnBody = Boolean(
            targetBody && targetBody.closest('.uktdropdown') === dropdownElement,
        );
        // If click was outside dropdown body, don’t trigger submit
        if (!isInOwnBody) {
            // Don’t close dropdown if isOpening or search input is focused
            if (
                !isOpeningRef.current &&
                inputElementRef.current !== eventTarget.ownerDocument.activeElement
            ) {
                closeDropdown();
            }
            return;
        }

        // If dropdown has no items and click was within dropdown body, do nothing
        if (!hasItemsRef.current) return;

        if (dropdownElement) {
            const clickedItem = getItemForTarget(dropdownElement, eventTarget);
            if (clickedItem) {
                // Submit the item the click actually landed on: sync the
                // active item to it in case they diverge (e.g. active was
                // set via keyboard, then user clicked elsewhere)
                setActiveItem({
                    dropdownElement,
                    element: clickedItem,
                    event,
                    onActiveItem: handleActiveItem,
                });
            } else if (getActiveItemElement(dropdownElement)) {
                // A click that doesn’t land on an item — body padding, a
                // separator, or a disabled item (pointer-events: none
                // retargets its clicks to the container) — must not submit
                // the previously active item: like macOS, it does nothing.
                // With no active item it falls through, so a body click
                // can still submit an input-sourced value
                return;
            }
        }

        handleSubmitItem(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        const { altKey, ctrlKey, key, metaKey } = event;
        const eventTarget = event.target as HTMLElement;
        if (!dropdownElement) return;

        const onEventHandled = () => {
            event.stopPropagation();
            event.preventDefault();
            currentInputMethodRef.current = 'keyboard';
        };

        const isEventTargetingDropdown = dropdownElement.contains(eventTarget);

        // Key events originating inside an open nested dropdown are that
        // dropdown’s business (e.g. an info popover nested in this body)
        const nestedRoot = eventTarget.closest?.('.uktdropdown');
        if (
            nestedRoot &&
            nestedRoot !== dropdownElement &&
            dropdownElement.contains(nestedRoot) &&
            nestedRoot.classList.contains('is-open')
        ) {
            return;
        }

        if (!isOpenRef.current) {
            // If dropdown is closed, don’t handle key events if event target isn’t within dropdown
            if (!isEventTargetingDropdown) return;
            // Open the dropdown on spacebar, enter, or if isSearchable and user hits the ↑/↓ arrows
            if (
                key === ' ' ||
                key === 'Enter' ||
                (hasItemsRef.current && (key === 'ArrowUp' || key === 'ArrowDown'))
            ) {
                onEventHandled();
                setIsOpen(true);
            }
            return;
        }

        const isTargetUsingKeyEvents = isEventTargetUsingKeyEvent(event);

        // If dropdown isOpen + hasItems & eventTargetNotUsingKeyEvents, handle characters
        if (hasItemsRef.current && !isTargetUsingKeyEvents) {
            let isEditingCharacters = !ctrlKey && !metaKey && /^[A-Za-z0-9]$/.test(key);
            // User could also be editing characters if there are already characters entered
            // and they are hitting delete or spacebar
            if (!isEditingCharacters && enteredCharactersRef.current) {
                isEditingCharacters = key === ' ' || key === 'Backspace';
            }

            if (isEditingCharacters) {
                onEventHandled();
                if (key === 'Backspace') {
                    enteredCharactersRef.current = enteredCharactersRef.current.slice(
                        0,
                        -1,
                    );
                } else {
                    enteredCharactersRef.current += key;
                }

                setActiveItem({
                    dropdownElement,
                    event,
                    // If props.allowCreate, only override the input’s value with an
                    // exact text match so user can enter a value not in items
                    isExactMatch: allowCreateRef.current,
                    onActiveItem: handleActiveItem,
                    text: enteredCharactersRef.current,
                });
                syncSubmenuDisclosure();

                if (clearEnteredCharactersTimerRef.current != null) {
                    clearTimeout(clearEnteredCharactersTimerRef.current);
                }

                clearEnteredCharactersTimerRef.current = setTimeout(() => {
                    enteredCharactersRef.current = '';
                    clearEnteredCharactersTimerRef.current = null;
                }, 1500);

                return;
            }
        }

        // If dropdown isOpen, handle submitting the value
        if (key === 'Enter' || (key === ' ' && !inputElementRef.current)) {
            onEventHandled();
            handleSubmitItem(event);
            return;
        }

        // If dropdown isOpen, handle closing it on escape or spacebar if !hasItems
        if (
            key === 'Escape' ||
            (isEventTargetingDropdown && key === ' ' && !hasItemsRef.current)
        ) {
            // Close dropdown if hasItems or event target not using key events
            if (hasItemsRef.current || !isTargetUsingKeyEvents) {
                // Escape closes the whole menu — submenus included — and
                // returns focus to the element that opened it. Focus before
                // closing: a searchable trigger input opens the dropdown on
                // focus, so its synchronous onFocus must land before the
                // close state update for the close to win the batch
                focusTrigger();
                closeDropdown();
            }
            return;
        }

        // Handle arrow keys
        if (hasItemsRef.current) {
            if (key === 'ArrowUp') {
                onEventHandled();
                if (altKey || metaKey) {
                    setActiveItem({
                        dropdownElement,
                        event,
                        index: 0,
                        onActiveItem: handleActiveItem,
                    });
                } else {
                    setActiveItem({
                        dropdownElement,
                        event,
                        indexAddend: -1,
                        onActiveItem: handleActiveItem,
                    });
                }
                syncSubmenuDisclosure();
                return;
            }
            if (key === 'ArrowDown') {
                onEventHandled();
                if (altKey || metaKey) {
                    // Using a negative index counts back from the end
                    setActiveItem({
                        dropdownElement,
                        event,
                        index: -1,
                        onActiveItem: handleActiveItem,
                    });
                } else {
                    setActiveItem({
                        dropdownElement,
                        event,
                        indexAddend: 1,
                        onActiveItem: handleActiveItem,
                    });
                }
                syncSubmenuDisclosure();
                return;
            }
            // ←/→ dive into and surface out of submenus (and move between
            // menus in a menubar); leave them alone when a text input has focus
            if (!isTargetUsingKeyEvents) {
                if (key === 'ArrowRight') {
                    const activeElement = getActiveItemElement(dropdownElement);
                    const submenu = activeElement
                        ? getSubmenuOfItem(activeElement)
                        : null;
                    if (activeElement && submenu) {
                        onEventHandled();
                        clearDisclosureTimer();
                        expandItem(activeElement, handleToggleSubmenu);
                        const firstItem = getItemElements(dropdownElement, submenu)?.[0];
                        if (firstItem) {
                            setActiveItem({
                                dropdownElement,
                                element: firstItem,
                                event,
                                onActiveItem: handleActiveItem,
                            });
                        }
                        return;
                    }
                    if (menubar) {
                        onEventHandled();
                        menubar.moveOpen(dropdownElement, 1);
                    }
                    return;
                }
                if (key === 'ArrowLeft') {
                    const activeElement = getActiveItemElement(dropdownElement);
                    const levelRoot = activeElement ? getLevelRoot(activeElement) : null;
                    if (levelRoot) {
                        onEventHandled();
                        clearDisclosureTimer();
                        const parentItem = getParentItem(levelRoot);
                        if (parentItem) {
                            collapseItem(parentItem, handleToggleSubmenu);
                        }
                        return;
                    }
                    if (menubar) {
                        onEventHandled();
                        menubar.moveOpen(dropdownElement, -1);
                    }
                    return;
                }
            }
        }
    };

    useKeyboardEvents({ ignoreUsedKeyboardEvents: false, onKeyDown: handleKeyDown });

    const handleRef = (ref: HTMLDivElement | null): (() => void) | void => {
        setDropdownElement(ref);
        if (!ref) return;

        const { ownerDocument } = ref;
        let inputElement = inputElementRef.current;
        // Check if trigger is a textual input or textarea element
        if (!inputElement && ref.firstElementChild) {
            if (ref.firstElementChild.matches(TEXT_INPUT_SELECTOR)) {
                inputElement = ref.firstElementChild as HTMLInputElement;
            } else {
                inputElement = ref.firstElementChild.querySelector(TEXT_INPUT_SELECTOR);
            }
            inputElementRef.current = inputElement;
        }

        const handleGlobalMouseDown = ({ target }: MouseEvent) => {
            const eventTarget = target as HTMLElement;
            if (!ref.contains(eventTarget)) {
                // Close dropdown on an outside click
                closeDropdown();
            }
        };

        const handleGlobalMouseUp = ({ target }: MouseEvent) => {
            if (!isOpenRef.current || closingTimerRef.current != null) return;

            // If still isOpening (gets set false 1s after open triggers), set it to false onMouseUp
            if (isOpeningRef.current) {
                setIsOpening(false);
                if (isOpeningTimerRef.current != null) {
                    clearTimeout(isOpeningTimerRef.current);
                    isOpeningTimerRef.current = null;
                }
                return;
            }

            const eventTarget = target as HTMLElement;
            // Only handle mouseup events from outside the dropdown here
            if (!ref.contains(eventTarget)) {
                closeDropdown();
            }
        };

        // Close dropdown if any element is focused outside of this dropdown
        const handleGlobalFocusIn = ({ target }: Event) => {
            if (!isOpenRef.current) return;

            const eventTarget = target as HTMLElement;
            // If focused element is a descendant or a parent of the dropdown, do nothing
            if (ref.contains(eventTarget) || eventTarget.contains(ref)) {
                return;
            }

            // Losing focus — including the focus shift when the body unmounts
            // on close — doesn’t end a menubar’s menu-mode; that takes a
            // deliberate dismissal (Escape, outside click, item select).
            closeDropdown({ keepMenubarEngaged: true });
        };

        document.addEventListener('focusin', handleGlobalFocusIn);
        document.addEventListener('mousedown', handleGlobalMouseDown);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        if (ownerDocument !== document) {
            ownerDocument.addEventListener('focusin', handleGlobalFocusIn);
            ownerDocument.addEventListener('mousedown', handleGlobalMouseDown);
            ownerDocument.addEventListener('mouseup', handleGlobalMouseUp);
        }

        // If dropdown should be open on mount, focus it
        if (isOpenOnMount) {
            ref.focus();
        }

        const handleInput = (event: Event) => {
            if (!isOpenRef.current) setIsOpen(true);

            const input = event.target as HTMLInputElement;
            const isDeleting = enteredCharactersRef.current.length > input.value.length;
            enteredCharactersRef.current = input.value;
            // When deleting text, if there’s already an active item and
            // input isn’t empty, preserve the active item, else update it
            if (isDeleting && input.value.length && getActiveItemElement(ref)) {
                return;
            }

            setActiveItem({
                dropdownElement: ref,
                event,
                // If props.allowCreate, only override the input’s value with an
                // exact text match so user can enter a value not in items
                isExactMatch: allowCreateRef.current,
                onActiveItem: handleActiveItem,
                text: enteredCharactersRef.current,
            });
        };

        if (inputElement) {
            inputElement.addEventListener('input', handleInput);
        }

        return () => {
            document.removeEventListener('focusin', handleGlobalFocusIn);
            document.removeEventListener('mousedown', handleGlobalMouseDown);
            document.removeEventListener('mouseup', handleGlobalMouseUp);

            if (ownerDocument !== document) {
                ownerDocument.removeEventListener('focusin', handleGlobalFocusIn);
                ownerDocument.removeEventListener('mousedown', handleGlobalMouseDown);
                ownerDocument.removeEventListener('mouseup', handleGlobalMouseUp);
            }

            if (inputElement) {
                inputElement.removeEventListener('input', handleInput);
            }
        };
    };

    // When the body mounts (open): fill in parent-item/submenu ARIA, and
    // render it in the top layer via popover so an ancestor’s transform /
    // filter / contain can’t become the containing block for the fixed body
    // and break its anchor positioning + fallbacks. popover="manual" keeps
    // dismissal under this component’s own listeners (see handleRef), which
    // preserves iframe support and searchable/text-input triggers that native
    // light-dismiss would close on any outside pointerdown.
    const handleBodyRef = (ref: HTMLDivElement | null) => {
        if (!ref) return;
        annotateParentItems(ref);
        // The Popover API is Baseline 2024, so showPopover() needs no feature
        // detection; the body is mounted only while open, so this runs once
        // per open and won’t throw on an already-open body.
        ref.showPopover();
    };

    if (!isValidElement(trigger)) {
        if (isSearchable) {
            trigger = (
                <input
                    aria-controls={bodyId}
                    aria-expanded={isOpen}
                    aria-haspopup={popupRole}
                    autoComplete="off"
                    className="uktdropdown-trigger"
                    defaultValue={valueLabel ?? ''}
                    disabled={disabled}
                    name={name}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    ref={inputElementRef}
                    tabIndex={tabIndex}
                    type="text"
                />
            );
        } else {
            trigger = (
                <button
                    aria-controls={bodyId}
                    aria-expanded={isOpen}
                    aria-haspopup={popupRole}
                    className="uktdropdown-trigger"
                    tabIndex={0}
                    type="button"
                >
                    {trigger}
                </button>
            );
        }
    } else {
        // For a consumer-provided trigger, add ARIA props (letting the consumer
        // override by specifying their own).
        const triggerProps = trigger.props as Record<string, unknown>;
        trigger = cloneElement(trigger as ReactElement<Record<string, unknown>>, {
            'aria-controls': triggerProps['aria-controls'] ?? bodyId,
            'aria-expanded': triggerProps['aria-expanded'] ?? isOpen,
            'aria-haspopup': triggerProps['aria-haspopup'] ?? popupRole,
        });
    }

    if (label != null) {
        trigger = (
            <label className="uktdropdown-label">
                <div className="uktdropdown-label-text">{label}</div>
                {trigger}
            </label>
        );
    }

    return (
        <Fragment>
            <style href="@acusti/dropdown/Dropdown" precedence="medium">
                {styles}
            </style>
            <div
                className={clsx('uktdropdown', className, {
                    disabled,
                    'is-open': isOpen,
                    'is-searchable': isSearchable,
                })}
                onClick={onClick}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
                onMouseOver={handleMouseOver}
                onMouseUp={handleMouseUp}
                ref={handleRef}
                style={styleFromProps}
            >
                {trigger}
                {/* TODO next version of Dropdown should use <Activity> for body https://react.dev/reference/react/Activity */}
                {isOpen ? (
                    <div
                        className={clsx('uktdropdown-body', {
                            'has-items': hasItems,
                        })}
                        id={bodyId}
                        popover="manual"
                        ref={handleBodyRef}
                        role={popupRole}
                    >
                        <div className="uktdropdown-content">
                            <DropdownContext.Provider
                                value={hasItems ? dropdownContextValue : null}
                            >
                                {childrenCount > 1
                                    ? (children as ChildrenTuple)[1]
                                    : children}
                            </DropdownContext.Provider>
                        </div>
                    </div>
                ) : null}
            </div>
        </Fragment>
    );
}

const INERT_SUBMENU_PROPS = [
    'allowCreate',
    'allowEmpty',
    'isOpenOnMount',
    'isSearchable',
    'keepOpenOnSubmit',
    'name',
    'openOnHover',
    'placeholder',
    'tabIndex',
    'value',
] as const;

// The nested (submenu) rendering of Dropdown: a parent item that discloses a
// child menu. It renders the data-ukt-submenu protocol and registers with the
// root dropdown, whose engine handles all interaction.
function SubmenuDropdown(props: Props & { parentDropdown: DropdownContextValue }) {
    const {
        children,
        className,
        disabled,
        label,
        onActiveItem,
        onClose,
        onOpen,
        onSubmitItem,
        parentDropdown,
        style,
    } = props;

    const itemRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        const element = itemRef.current;
        if (!element) return;
        return parentDropdown.registerSubmenu({
            element,
            onActiveItem,
            onClose,
            onOpen,
            onSubmitItem,
        });
    }, [onActiveItem, onClose, onOpen, onSubmitItem, parentDropdown]);

    // Misuse feedback is unconditional, like the children-count error above
    const warnedRef = useRef(false);
    useEffect(() => {
        if (warnedRef.current) return;
        const inertProps = INERT_SUBMENU_PROPS.filter(
            (propName) => props[propName] !== undefined,
        );
        if (!inertProps.length) return;
        warnedRef.current = true;
        console.error(
            `@acusti/dropdown: ${inertProps.join(', ')} only apply to a top-level Dropdown and are ignored on a nested (submenu) Dropdown.`,
        );
    });

    const childrenCount = Children.count(children);
    let labelContent: ReactNode = label;
    let body: ReactNode = children;
    if (childrenCount > 1) {
        labelContent = (children as ChildrenTuple)[0];
        body = (children as ChildrenTuple)[1];
    }

    const submenu = isValidElement(body) ? (
        cloneElement(body as ReactElement<Record<string, unknown>>, {
            'data-ukt-submenu': '',
        })
    ) : (
        <div data-ukt-submenu="">{body}</div>
    );

    return (
        <li
            aria-disabled={disabled || undefined}
            className={className}
            data-ukt-item=""
            ref={itemRef}
            style={style}
        >
            {labelContent}
            {submenu}
        </li>
    );
}

export { default as Menubar, type MenubarProps } from './Menubar.js';
