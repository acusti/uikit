export type StyleTextProps = {
    /** the CSS text */
    children: string;
    /**
     * Names the sheet. React keeps one stylesheet per href and never updates
     * its text, so CSS that changes needs an href that changes with it. It is
     * URI-encoded, since React can’t hydrate a hoisted `<style>` whose href
     * has a space.
     */
    href: string;
    /** defaults to `medium` */
    precedence?: string;
};

/**
 * Renders CSS generated at runtime as a hoisted `<style>`, among the sheets of
 * its precedence in render order.
 */
export default function StyleText({
    children,
    href,
    precedence = 'medium',
}: StyleTextProps) {
    return (
        <style href={encodeURI(href)} precedence={precedence}>
            {children}
        </style>
    );
}
