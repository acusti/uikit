import { useStyles } from './useStyles.js';

type Props = {
    children: string;
    href?: string;
    precedence?: string;
};

const Style = ({ children, href: _href, precedence = 'medium' }: Props) => {
    // Minify CSS styles to prevent unnecessary cache misses
    const { href, styles } = useStyles(children, _href);

    return (
        <style href={href} precedence={precedence}>
            {styles}
        </style>
    );
};

export default Style;
