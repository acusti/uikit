import * as React from 'react';

import { unregisterStyles, updateStyles } from './';

const { useEffect, useRef } = React;

type Props = {
    ownerDocument?: Document;
    styles: string;
};

const Style = ({ ownerDocument = document, styles }: Props) => {
    const previousStylesRef = useRef('');
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
        [ownerDocument],
    );

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
