import React from 'react';

import { useStyles } from './useStyles.js';

type Props = {
    children: string;
    href?: string;
    precedence?: string;
};

const Style = ({ children, href: _href, precedence = 'medium' }: Props) => {
    // Minify CSS styles by replacing consecutive whitespace (including \n) with ' '
    const { href, styles } = useStyles(children, _href);
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/canary.d.ts
    // https://react.dev/reference/react-dom/components/style#props
    return (
        <style href={href} precedence={precedence}>
            {styles}
        </style>
    );
};

export default Style;
