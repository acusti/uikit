// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';

import { useStyles } from './useStyles.js';

type Props = {
    children: string;
    precedence?: string;
};

const Style = ({ children, precedence = 'medium' }: Props) => {
    // Minify CSS styles by replacing consecutive whitespace (including \n) with ' '
    const styles = useStyles(children);
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/canary.d.ts
    // https://react.dev/reference/react-dom/components/style#props
    return (
        // @ts-expect-error @types/react is missing new <style> props
        // eslint-disable-next-line react/no-unknown-property
        <style href={styles} precedence={precedence}>
            {styles}
        </style>
    );
};

export default Style;
