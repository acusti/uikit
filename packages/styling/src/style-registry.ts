type StyleRegistry = Map<
    string,
    Map<Document, { element: HTMLStyleElement; referenceCount: number }>
>;

const styleRegistry: StyleRegistry = new Map();

type Payload = { ownerDocument: Document; styles: string };

export const registerStyles = ({ ownerDocument, styles }: Payload) => {
    if (!styles) return;

    const stylesMap = styleRegistry.get(styles);
    const existingStylesItem = stylesMap?.get(ownerDocument);

    if (existingStylesItem) {
        existingStylesItem.referenceCount++;
        return;
    }

    const element = ownerDocument.createElement('style');
    element.innerHTML = styles;
    ownerDocument.head.appendChild(element);
    const stylesItem = { element, referenceCount: 1 };

    if (stylesMap) {
        stylesMap.set(ownerDocument, stylesItem);
        return;
    }

    styleRegistry.set(styles, new Map([[ownerDocument, stylesItem]]));
};

export const unregisterStyles = ({ ownerDocument, styles }: Payload) => {
    if (!styles) return;

    const stylesMap = styleRegistry.get(styles);
    const stylesItem = stylesMap?.get(ownerDocument);
    if (!stylesMap || !stylesItem) return;

    stylesItem.referenceCount--;
    if (stylesItem.referenceCount) return;

    // If no more references to these styles in this document, remove <style> element from the DOM
    const { parentElement } = stylesItem.element;
    if (parentElement) {
        parentElement.removeChild(stylesItem.element);
    }
    // Then remove the document Map
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
