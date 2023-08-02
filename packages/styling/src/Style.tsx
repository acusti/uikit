import * as React from 'react';

import {
    getRegisteredStyles,
    registerStyles,
    unregisterStyles,
    updateStyles,
} from './style-registry.js';

const { useCallback, useEffect, useMemo, useRef, useState } = React;

type Props = {
    children: string;
};

const Style = ({ children }: Props) => {
    // Minify CSS styles by replacing consecutive whitespace (including \n) with ' '
    const styles = useMemo(() => children.replace(/\s+/gm, ' '), [children]);
    const [ownerDocument, setOwnerDocument] = useState<Document | null>(null);
    const isMountedRef = useRef<boolean>(false);

    useEffect(() => {
        isMountedRef.current = true;
        unregisterStyles({ ownerDocument: 'global', styles });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Avoid duplicate style rendering during SSR via style registry
    if (!isMountedRef.current) {
        if (getRegisteredStyles({ ownerDocument: 'global', styles })) return null;
        registerStyles({ ownerDocument: 'global', styles });
    }

    return <style dangerouslySetInnerHTML={{ __html: styles }} ref={handleRef} />;
};

export default Style;
