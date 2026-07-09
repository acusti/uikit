import { createContext } from 'react';

import { type Item } from './Dropdown.js';

export type DropdownContextValue = {
    registerSubmenu: (registration: SubmenuRegistration) => () => void;
};

export type SubmenuRegistration = {
    element: HTMLElement;
    onActiveItem?: (payload: Item) => void;
    onClose?: () => unknown;
    onOpen?: () => unknown;
    onSubmitItem?: (payload: Item) => void;
};

// Provided by a menu Dropdown; a Dropdown that finds this context renders as a
// submenu (parent item + data-ukt-submenu) instead of a root dropdown.
export const DropdownContext = createContext<DropdownContextValue | null>(null);

export type MenubarContextValue = {
    moveOpen: (fromElement: HTMLElement, direction: -1 | 1) => void;
    notifyClosed: (element: HTMLElement) => void;
    notifyOpened: (element: HTMLElement) => void;
    registerMember: (member: MenubarMember) => () => void;
};

export type MenubarMember = {
    close: () => void;
    element: HTMLElement;
    focusTrigger: () => void;
    isOpen: () => boolean;
    open: () => void;
};

export const MenubarContext = createContext<MenubarContextValue | null>(null);
