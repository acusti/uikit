import * as React from 'react';

import { unregisterStyles, updateStyles } from './style-registry.js';

const { useCallback, useEffect, useRef, useState } = React;

type Props = {
    children: string;
};

const makeMinifyStyles = () => {
    let lastStyles = '';
    let lastMinified = '';
    return (styles: string) => {
        if (styles === lastStyles) return lastMinified;
        lastStyles = styles;
        lastMinified = styles.replace(/\s+/gm, ' ');
        return lastMinified;
    };
};

const Style = ({ children: styles }: Props) => {
    const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);
    const minifyStylesRef = useRef(makeMinifyStyles());
    styles = minifyStylesRef.current(styles);

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

    const handleRef = useCallback((element: HTMLElement | null) => {
        if (!element) return;
        setOwnerDocument(element.ownerDocument);
    }, []);

    if (ownerDocument) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: styles,
            }}
            ref={handleRef}
        />
    );
};

export default Style;
