import * as React from 'react';

import { unregisterStyles, updateStyles } from './style-registry.js';

const { useCallback, useEffect, useRef, useState } = React;

type Props = {
    children: string;
};

const Style = ({ children: styles }: Props) => {
    const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);

    const handleRef = useCallback((element: HTMLElement | null) => {
        if (!element) return;
        setOwnerDocument(element.ownerDocument);
    }, []);

    useEffect(
        () => () => {
            if (!ownerDocument) return;
            unregisterStyles({ ownerDocument, styles });
        },
        [ownerDocument], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const previousStylesRef = useRef<string>('');

    useEffect(() => {
        if (!ownerDocument) return;

        updateStyles({
            ownerDocument,
            previousStyles: previousStylesRef.current,
            styles,
        });

        previousStylesRef.current = styles;
    }, [ownerDocument, styles]);

    if (ownerDocument) return null;

    return <style ref={handleRef}>{styles}</style>;
};

export default Style;
