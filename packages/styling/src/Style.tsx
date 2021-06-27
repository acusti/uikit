import * as React from 'react';

import { unregisterStyles, updateStyles } from './style-registry.js';

const { useEffect, useRef } = React;

type Props = {
    children: string;
    ownerDocument?: Document;
};

const Style = ({ children: styles, ownerDocument = document }: Props) => {
    // const [ownerDocument, setOwnerDocument] = useState(ownerDocumentFromProps || document);
    // useEffect(() => {
    //     if (!ownerDocumentFromProps) return;
    //     setOwnerDocument(ownerDocumentFromProps);
    // }, [ownerDocumentFromProps]);
    // const setRef = useCallback((element: HTMLElement | null) => {
    //     if (!element) return;
    //     setOwnerDocument(element.ownerDocument);
    // }, []);

    useEffect(
        () => () => {
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

    return null;
    // if (ownerDocument) return null;
    // return <span ref={setRef} />;
};

export default Style;
