import { getBestMatch } from '@acusti/matchmaking';
import { type SyntheticEvent } from 'react';

import { type Item } from './Dropdown.js';

export const ITEM_SELECTOR = `[data-ukt-item], [data-ukt-value]`;

export const getItemElements = (dropdownElement: HTMLElement | null) => {
    if (!dropdownElement) return null;

    const bodyElement = dropdownElement.querySelector('.uktdropdown-body');
    if (!bodyElement) return null;

    let items: HTMLCollection | NodeListOf<Element> =
        bodyElement.querySelectorAll(ITEM_SELECTOR);

    if (items.length) return items;
    // If no items found via [data-ukt-item] or [data-ukt-value] selector,
    // use first instance of multiple children found
    items = bodyElement.children;
    while (items.length === 1) {
        if (items[0].children == null) break;
        items = items[0].children;
    }
    // If unable to find an element with more than one child, treat direct child as items
    if (items.length === 1) {
        items = bodyElement.children;
    }
    return items;
};

export const getActiveItemElement = (dropdownElement: HTMLElement | null) => {
    if (!dropdownElement) return null;
    return dropdownElement.querySelector('[data-ukt-active]') as HTMLElement | null;
};

const clearItemElementsState = (itemElements: Array<HTMLElement>) => {
    itemElements.forEach((itemElement) => {
        if (itemElement.hasAttribute('data-ukt-active')) {
            delete itemElement.dataset.uktActive;
        }
    });
};

type BaseSetActiveItemPayload = {
    dropdownElement: HTMLElement;
    element?: null;
    event: Event | SyntheticEvent<HTMLElement>;
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
      } & Omit<BaseSetActiveItemPayload, 'isExactMatch' | 'text'>)) => {
    const items = getItemElements(dropdownElement);
    if (!items) return;

    const itemElements = Array.from(items) as Array<HTMLElement>;
    if (!itemElements.length) return;

    const lastIndex = itemElements.length - 1;
    const currentActiveIndex = itemElements.findIndex((itemElement) =>
        itemElement.hasAttribute('data-ukt-active'),
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
            return;
        }

        const itemTexts = itemElements.map((itemElement) => itemElement.innerText);
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

    const nextActiveItem = items[nextActiveIndex] as HTMLElement | null;
    if (nextActiveItem == null || nextActiveIndex === currentActiveIndex) return;

    // Clear any existing active dropdown body item state
    clearItemElementsState(itemElements);
    nextActiveItem.setAttribute('data-ukt-active', '');
    const label = nextActiveItem.innerText;
    const value = nextActiveItem.dataset.uktValue ?? label;
    onActiveItem?.({ element: nextActiveItem, event, label, value });
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
};
