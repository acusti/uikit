type StyleRegistry = Map<
    string,
    Map<Document | 'global', { element: HTMLStyleElement | null; referenceCount: number }>
>;

const styleRegistry: StyleRegistry = new Map();

type Payload = { ownerDocument: Document | 'global'; styles: string };

export const getRegisteredStyles = ({ ownerDocument, styles }: Payload) => {
    if (!styles) return null;
    const stylesMap = styleRegistry.get(styles);
    if (!stylesMap) return null;
    return stylesMap.get(ownerDocument) || null;
};

export const registerStyles = ({ ownerDocument, styles }: Payload) => {
    if (!styles) return;

    const existingStylesItem = getRegisteredStyles({ ownerDocument, styles });
    if (existingStylesItem) {
        existingStylesItem.referenceCount++;
        return;
    }

    if (ownerDocument === 'global') {
        styleRegistry.set(
            styles,
            new Map([[ownerDocument, { element: null, referenceCount: 1 }]]),
        );
        return;
    }

    const element = ownerDocument.createElement('style');
    element.setAttribute('data-ukt-styling', '');
    element.innerHTML = styles;
    ownerDocument.head.appendChild(element);
    const stylesItem = { element, referenceCount: 1 };

    const stylesMap = styleRegistry.get(styles);
    if (stylesMap) {
        stylesMap.set(ownerDocument, stylesItem);
        return;
    }

    styleRegistry.set(styles, new Map([[ownerDocument, stylesItem]]));
};

export const unregisterStyles = ({ ownerDocument, styles }: Payload) => {
    if (!styles) return;

    const stylesItem = getRegisteredStyles({ ownerDocument, styles });
    if (!stylesItem) return;

    stylesItem.referenceCount--;
    if (stylesItem.referenceCount) return;

    // If no more references to these styles in this document, remove <style> element from the DOM
    if (stylesItem.element) {
        const { parentElement } = stylesItem.element;
        if (parentElement) {
            parentElement.removeChild(stylesItem.element);
        }
    }

    // Then remove the document Map
    const stylesMap = styleRegistry.get(styles)!;
    stylesMap.delete(ownerDocument);

    if (stylesMap.size) return;
    // If no more references to these styles in any document, remove it entirely
    styleRegistry.delete(styles);
};

type UpdatePayload = { ownerDocument: Document; previousStyles: string; styles: string };

export const updateStyles = ({
    ownerDocument,
    previousStyles,
    styles,
}: UpdatePayload) => {
    if (previousStyles === styles) return;

    if (previousStyles) {
        unregisterStyles({ ownerDocument, styles: previousStyles });
    }

    registerStyles({ ownerDocument, styles });
};
