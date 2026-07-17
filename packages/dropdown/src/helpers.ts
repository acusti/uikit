import { getBestMatch } from '@acusti/matchmaking';
import { Children, isValidElement, type ReactNode, type SyntheticEvent } from 'react';

import { type Item } from './Dropdown.js';

export const ITEM_SELECTOR = '[data-ukt-item], [data-ukt-value]';
export const SUBMENU_SELECTOR = '[data-ukt-submenu]';

const DISABLED_ITEM_SELECTOR = '[aria-disabled="true"]';

export type OnToggleSubmenu = (item: HTMLElement, isExpanded: boolean) => void;

type MaybeHTMLElement = HTMLElement | null;

const getBodyElement = (dropdownElement: MaybeHTMLElement) =>
    (dropdownElement?.querySelector('.uktdropdown-body') ?? null) as MaybeHTMLElement;

// The level root that owns an item: the closest [data-ukt-submenu] ancestor,
// or null for items at the top level of the dropdown body
export const getLevelRoot = (element: HTMLElement) =>
    element.closest(SUBMENU_SELECTOR) as MaybeHTMLElement;

// An item’s own submenu (a parent item), excluding submenus of descendant items
export const getSubmenuOfItem = (item: HTMLElement): MaybeHTMLElement => {
    const submenu = item.querySelector(SUBMENU_SELECTOR) as MaybeHTMLElement;
    if (!submenu) return null;
    const owner = submenu.parentElement?.closest(ITEM_SELECTOR);
    return owner === item ? submenu : null;
};

// The parent item that owns a submenu level
export const getParentItem = (levelRoot: HTMLElement) =>
    (levelRoot.parentElement?.closest(ITEM_SELECTOR) ?? null) as MaybeHTMLElement;

// A parent item’s label is its text content excluding the submenu subtree
export const getItemLabel = (item: HTMLElement): string => {
    if (!getSubmenuOfItem(item)) return item.innerText ?? '';
    const clone = item.cloneNode(true) as HTMLElement;
    for (const submenu of Array.from(clone.querySelectorAll(SUBMENU_SELECTOR))) {
        submenu.remove();
    }
    return (clone.textContent ?? '').trim();
};

// Concatenate the text (string/number leaves) of a React node, approximating
// the rendered innerText the dropdown uses as an item’s label. Submenu
// subtrees are excluded, matching getItemLabel (and innerText, which omits
// the collapsed — hidden — submenu), so a parent item’s derived label agrees
// with its select-time label.
const getNodeText = (node: ReactNode): string => {
    let text = '';
    Children.forEach(node, (child) => {
        if (typeof child === 'string' || typeof child === 'number') {
            text += child;
        } else if (isValidElement(child)) {
            const childProps = child.props as {
                children?: ReactNode;
                'data-ukt-submenu'?: unknown;
            };
            if (childProps['data-ukt-submenu'] !== undefined) return;
            text += getNodeText(childProps.children);
        }
    });
    return text;
};

// Find the item in `children` whose data-ukt-value matches `value` and return
// its text as the label, so a bare identifier value shows the matching item’s
// label without a separate options/label lookup. Returns undefined if no item
// matches (the caller then falls back to the identifier itself). A
// { label, value } value overrides this when the derived text isn’t right.
export const getLabelFromChildren = (
    children: ReactNode,
    value: string,
): string | undefined => {
    let label: string | undefined;
    const visit = (node: ReactNode) => {
        if (label != null) return;
        Children.forEach(node, (child) => {
            if (label != null || !isValidElement(child)) return;
            const childProps = child.props as {
                children?: ReactNode;
                'data-ukt-value'?: unknown;
            };
            const uktValue = childProps['data-ukt-value'];
            // Compare as strings: the DOM stringifies dataset values, so
            // data-ukt-value={400} matches value="400" when selected and
            // must also match here.
            if (uktValue != null && String(uktValue) === value) {
                label = getNodeText(childProps.children).replace(/\s+/g, ' ').trim();
                return;
            }
            visit(childProps.children);
        });
    };
    visit(children);
    return label;
};

// Ancestor parent items from the root level down to the element’s immediate parent
export const getItemPath = (element: MaybeHTMLElement): Item['path'] => {
    const path: Item['path'] = [];
    if (!element) return path;
    let levelRoot = getLevelRoot(element);
    while (levelRoot) {
        const parentItem = getParentItem(levelRoot);
        if (!parentItem) break;
        const label = getItemLabel(parentItem);
        path.unshift({ label, value: parentItem.dataset.uktValue ?? label });
        levelRoot = getLevelRoot(parentItem);
    }
    return path;
};

export const getItemElements = (
    dropdownElement: MaybeHTMLElement,
    levelRoot?: MaybeHTMLElement,
): Array<HTMLElement> | null => {
    const bodyElement = getBodyElement(dropdownElement);
    if (!bodyElement) return null;

    const root = levelRoot ?? bodyElement;
    const candidates = Array.from(
        root.querySelectorAll(ITEM_SELECTOR),
    ) as Array<HTMLElement>;

    if (candidates.length) {
        return candidates.filter((item) => {
            if (item.matches(DISABLED_ITEM_SELECTOR)) return false;
            return getLevelRoot(item) === (levelRoot ?? null);
        });
    }

    // If no items found via [data-ukt-item] or [data-ukt-value] selector,
    // use first instance of multiple children found — flat bodies and flat
    // submenu levels alike
    let items: HTMLCollection = root.children;
    while (items.length === 1) {
        if (items[0].children == null) break;
        items = items[0].children;
    }
    // If unable to find an element with more than one child, treat direct child as items
    if (items.length === 1) {
        items = root.children;
    }
    return (Array.from(items) as Array<HTMLElement>).filter(
        (item) => !item.matches(DISABLED_ITEM_SELECTOR),
    );
};

// The item an event target belongs to within its own level: the closest
// marked item, or — when the target sits in a level with no marked items
// (a heuristically-detected level) — the target itself if it’s one of that
// level’s detected items. Misses (body padding, separators) and disabled
// items resolve to null.
export const getItemForTarget = (
    dropdownElement: HTMLElement,
    target: HTMLElement,
): MaybeHTMLElement => {
    let item = target.closest(ITEM_SELECTOR) as MaybeHTMLElement;
    // If nothing matched, or the target sits in a deeper level than the
    // matched item (an unmarked, heuristically-detected submenu level),
    // resolve the item within the target’s own level instead
    const targetLevelRoot = getLevelRoot(target);
    if (!item || (targetLevelRoot && item.contains(targetLevelRoot))) {
        const itemElements = getItemElements(dropdownElement, targetLevelRoot);
        item = itemElements?.find((itemElement) => itemElement === target) ?? item;
    }
    if (!item || !dropdownElement.contains(item)) return null;
    if (item.matches(DISABLED_ITEM_SELECTOR)) return null;
    return item;
};

// All active items, in document order (ancestors before descendants)
export const getActiveItemElements = (dropdownElement: MaybeHTMLElement) => {
    if (!dropdownElement) return null;
    const actives = dropdownElement.querySelectorAll('[data-ukt-active]');
    return actives.length ? (Array.from(actives) as Array<HTMLElement>) : null;
};

// The deepest active item — the one keyboard input operates on
export const getActiveItemElement = (dropdownElement: MaybeHTMLElement) => {
    const actives = getActiveItemElements(dropdownElement);
    return actives ? actives[actives.length - 1] : null;
};

// The deepest expanded parent item — the one whose submenu is the innermost
// open one — in document order
export const getDeepestExpandedItem = (
    dropdownElement: MaybeHTMLElement,
): MaybeHTMLElement => {
    if (!dropdownElement) return null;
    const expanded = (
        Array.from(
            dropdownElement.querySelectorAll('[aria-expanded="true"]'),
        ) as Array<HTMLElement>
    ).filter((element) => element.matches(ITEM_SELECTOR));
    return expanded.length ? expanded[expanded.length - 1] : null;
};

export const isItemExpanded = (item: HTMLElement) =>
    item.getAttribute('aria-expanded') === 'true';

let submenuIdCounter = 0;

const ensureSubmenuARIA = (item: HTMLElement, submenu: HTMLElement) => {
    if (!submenu.hasAttribute('role')) submenu.setAttribute('role', 'menu');
    if (!submenu.id) submenu.id = `uktdd-submenu-${++submenuIdCounter}`;
    // Normalize the submenu to a manual popover for consumers who author raw
    // data-ukt-submenu markup (SubmenuDropdown already sets it); a bare or auto
    // popover would light-dismiss and desync from the engine’s show/hidePopover.
    if (submenu.getAttribute('popover') !== 'manual') {
        submenu.setAttribute('popover', 'manual');
    }
    if (!item.hasAttribute('aria-haspopup')) item.setAttribute('aria-haspopup', 'menu');
    if (!item.hasAttribute('aria-expanded')) item.setAttribute('aria-expanded', 'false');
    if (!item.hasAttribute('aria-controls')) {
        item.setAttribute('aria-controls', submenu.id);
    }
};

// Fill in submenu/parent-item ARIA (only what the consumer hasn’t set)
export const annotateParentItems = (bodyElement: MaybeHTMLElement) => {
    if (!bodyElement) return;
    for (const submenu of Array.from(bodyElement.querySelectorAll(SUBMENU_SELECTOR))) {
        const item = getParentItem(submenu as HTMLElement);
        if (item) ensureSubmenuARIA(item, submenu as HTMLElement);
    }
};

// Fill in the item roles the consumer hasn’t set: options in a searchable
// (listbox) dropdown, menuitems in a menu — and always menuitems inside a
// submenu, which is itself a menu (annotateParentItems gives it role="menu").
// The <ul>/<ol> wrappers around the items get role="presentation" so their
// implicit list role doesn’t sit between the listbox/menu and its items; a
// submenu already carries role="menu", so its own role is left intact.
export const annotateItemRoles = (
    bodyElement: MaybeHTMLElement,
    popupRole: 'listbox' | 'menu',
) => {
    if (!bodyElement) return;
    for (const list of Array.from(bodyElement.querySelectorAll('ul, ol'))) {
        if (!list.hasAttribute('role') && list.querySelector(ITEM_SELECTOR)) {
            list.setAttribute('role', 'presentation');
        }
    }
    for (const item of Array.from(
        bodyElement.querySelectorAll(ITEM_SELECTOR),
    ) as Array<HTMLElement>) {
        // Leave a consumer-set role, and a natively interactive item’s own role
        // (a button/link/input item keeps its element semantics), alone.
        if (
            item.hasAttribute('role') ||
            item.matches('a[href], button, input, select, textarea')
        ) {
            continue;
        }
        const isMenuItem = popupRole === 'menu' || getLevelRoot(item) != null;
        // A top-level parent item in a listbox would pair role="option" with
        // the aria-haspopup/aria-expanded that annotateParentItems gives it —
        // invalid ARIA (an option can’t disclose a popup), and no valid role
        // exists for a submenu parent inside a listbox, so leave its role to
        // the consumer. (In a menu, menuitem is correct for parents.)
        if (!isMenuItem && getSubmenuOfItem(item)) continue;
        item.setAttribute('role', isMenuItem ? 'menuitem' : 'option');
    }
};

export const expandItem = (item: HTMLElement, onToggleSubmenu?: OnToggleSubmenu) => {
    const submenu = getSubmenuOfItem(item);
    if (!submenu) return;
    ensureSubmenuARIA(item, submenu);
    if (isItemExpanded(item)) return;
    item.setAttribute('aria-expanded', 'true');
    onToggleSubmenu?.(item, true);
};

export const collapseItem = (item: HTMLElement, onToggleSubmenu?: OnToggleSubmenu) => {
    if (!isItemExpanded(item)) return;
    const submenu = getSubmenuOfItem(item);
    if (submenu) {
        // Collapse any expanded descendants first so their state can’t leak
        // into the next disclosure and their onClose callbacks fire
        // (recursion makes the collapse order deepest-first)
        const expandedDescendants = (
            Array.from(
                submenu.querySelectorAll('[aria-expanded="true"]'),
            ) as Array<HTMLElement>
        ).filter((descendant) => descendant.matches(ITEM_SELECTOR));
        for (const descendant of expandedDescendants) {
            collapseItem(descendant, onToggleSubmenu);
        }
        for (const active of Array.from(submenu.querySelectorAll('[data-ukt-active]'))) {
            delete (active as HTMLElement).dataset.uktActive;
        }
    }
    item.setAttribute('aria-expanded', 'false');
    onToggleSubmenu?.(item, false);
};

// Collapse every expanded parent item that isn’t an ancestor of element
// (element == null collapses all), deepest-first
export const collapseItemsOutsidePath = (
    dropdownElement: MaybeHTMLElement,
    element: MaybeHTMLElement,
    onToggleSubmenu?: OnToggleSubmenu,
) => {
    const bodyElement = getBodyElement(dropdownElement);
    if (!bodyElement) return;
    const expandedItems = (
        Array.from(
            bodyElement.querySelectorAll('[aria-expanded="true"]'),
        ) as Array<HTMLElement>
    ).filter((item) => item.matches(ITEM_SELECTOR));
    for (const item of expandedItems.reverse()) {
        if (element && item.contains(element)) continue;
        collapseItem(item, onToggleSubmenu);
    }
};

const clearItemElementsState = (itemElements: Array<HTMLElement>) => {
    itemElements.forEach((itemElement) => {
        if (itemElement.hasAttribute('data-ukt-active')) {
            delete itemElement.dataset.uktActive;
        }
        // Also clear active state in any deeper levels within this item
        for (const active of Array.from(
            itemElement.querySelectorAll('[data-ukt-active]'),
        )) {
            delete (active as HTMLElement).dataset.uktActive;
        }
    });
};

// Make the active set exactly the chain of element + its ancestor parent items
const setActiveChain = (dropdownElement: HTMLElement, element: HTMLElement) => {
    const chain = new Set<HTMLElement>([element]);
    let levelRoot = getLevelRoot(element);
    while (levelRoot) {
        const parentItem = getParentItem(levelRoot);
        if (!parentItem) break;
        chain.add(parentItem);
        levelRoot = getLevelRoot(parentItem);
    }
    for (const active of getActiveItemElements(dropdownElement) ?? []) {
        if (!chain.has(active)) delete active.dataset.uktActive;
    }
    for (const item of chain) {
        item.setAttribute('data-ukt-active', '');
    }
};

type BaseSetActiveItemPayload = {
    dropdownElement: HTMLElement;
    element?: null;
    // Optional so an item can be activated programmatically (e.g. revealing the
    // current value on open); it’s only used to build the onActiveItem payload,
    // which is skipped when there’s no event to report.
    event?: Event | SyntheticEvent<HTMLElement>;
    index?: null;
    indexAddend?: null;
    isExactMatch?: null;
    onActiveItem?: (payload: Item) => void;
    text?: null;
};

export const setActiveItem = ({
    dropdownElement,
    element,
    event,
    index,
    indexAddend,
    isExactMatch,
    onActiveItem,
    text,
}:
    | ({
          element: HTMLElement;
      } & Omit<BaseSetActiveItemPayload, 'element'>)
    | ({
          index: number;
      } & Omit<BaseSetActiveItemPayload, 'index'>)
    | ({
          indexAddend: number;
      } & Omit<BaseSetActiveItemPayload, 'indexAddend'>)
    | ({
          isExactMatch?: boolean;
          text: string;
      } & Omit<BaseSetActiveItemPayload, 'isExactMatch' | 'text'>)): MaybeHTMLElement => {
    const currentDeepest = getActiveItemElement(dropdownElement);
    // Keys and text operate on the current level (the level of the deepest
    // active item); activating an element directly targets its own level
    const levelRoot = element
        ? getLevelRoot(element)
        : currentDeepest
          ? getLevelRoot(currentDeepest)
          : null;

    const itemElements = getItemElements(dropdownElement, levelRoot);
    if (!itemElements || itemElements.length === 0) return currentDeepest;

    const lastIndex = itemElements.length - 1;
    const currentActiveIndex = itemElements.findIndex(
        (itemElement) => itemElement === currentDeepest,
    );

    let nextActiveIndex = currentActiveIndex;
    if (typeof index === 'number') {
        // Negative index means count back from the end
        nextActiveIndex = index < 0 ? itemElements.length + index : index;
    }

    if (element) {
        nextActiveIndex = itemElements.findIndex(
            (itemElement) => itemElement === element,
        );
        if (nextActiveIndex === -1) return currentDeepest;
    } else if (typeof indexAddend === 'number') {
        // If there’s no currentActiveIndex and we are handling -1, start at lastIndex
        if (currentActiveIndex === -1 && indexAddend === -1) {
            nextActiveIndex = lastIndex;
        } else {
            nextActiveIndex += indexAddend;
        }
        // Keep it within the bounds of the items list
        nextActiveIndex = Math.max(0, Math.min(nextActiveIndex, lastIndex));
    } else if (typeof text === 'string') {
        // If text is empty, clear existing active items and early return
        if (!text) {
            clearItemElementsState(itemElements);
            return null;
        }

        const itemTexts = itemElements.map(getItemLabel);
        if (isExactMatch) {
            const textToCompare = text.toLowerCase();
            nextActiveIndex = itemTexts.findIndex((itemText) =>
                itemText.toLowerCase().startsWith(textToCompare),
            );
            // If isExactMatch is required and no exact match was found, clear active items
            if (nextActiveIndex === -1) {
                clearItemElementsState(itemElements);
            }
        } else {
            const bestMatch = getBestMatch({ items: itemTexts, text });
            nextActiveIndex = itemTexts.findIndex((itemText) => itemText === bestMatch);
        }
    }

    const nextActiveItem = itemElements[nextActiveIndex] as MaybeHTMLElement;
    if (nextActiveItem == null || nextActiveItem === currentDeepest) {
        return currentDeepest;
    }

    setActiveChain(dropdownElement, nextActiveItem);
    // A programmatic activation (no event) still moves the highlight and scrolls
    // the item into view, but has no event to report to onActiveItem.
    if (event) {
        const label = getItemLabel(nextActiveItem);
        onActiveItem?.({
            element: nextActiveItem,
            event,
            label,
            path: getItemPath(nextActiveItem),
            value: nextActiveItem.dataset.uktValue ?? label,
        });
    }
    // Find closest scrollable parent and ensure that next active item is visible
    let { parentElement } = nextActiveItem;
    let scrollableParent = null;
    while (!scrollableParent && parentElement && parentElement !== dropdownElement) {
        const isScrollable = parentElement.scrollHeight > parentElement.clientHeight + 15;
        if (isScrollable) {
            scrollableParent = parentElement;
        } else {
            parentElement = parentElement.parentElement;
        }
    }

    if (scrollableParent) {
        const parentRect = scrollableParent.getBoundingClientRect();
        const itemRect = nextActiveItem.getBoundingClientRect();
        const isAboveTop = itemRect.top < parentRect.top;
        const isBelowBottom = itemRect.bottom > parentRect.bottom;
        if (isAboveTop || isBelowBottom) {
            let { scrollTop } = scrollableParent;
            // Item isn’t fully visible; adjust scrollTop to put item within closest edge
            if (isAboveTop) {
                scrollTop -= parentRect.top - itemRect.top;
            } else {
                scrollTop += itemRect.bottom - parentRect.bottom;
            }
            scrollableParent.scrollTop = scrollTop;
        }
    }

    return nextActiveItem;
};

export type Point = { x: number; y: number };

// Whether a point is inside (or on an edge of) triangle a-b-c, from the sign
// of the cross product for each edge: all the same sign ⇒ inside
export const isPointInTriangle = (p: Point, a: Point, b: Point, c: Point): boolean => {
    const cross = (u: Point, v: Point, w: Point) =>
        (u.x - w.x) * (v.y - w.y) - (v.x - w.x) * (u.y - w.y);
    const d1 = cross(p, a, b);
    const d2 = cross(p, b, c);
    const d3 = cross(p, c, a);
    const hasNegative = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPositive = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNegative && hasPositive);
};
