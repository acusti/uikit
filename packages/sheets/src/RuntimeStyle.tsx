export type RuntimeStyleProps = {
    /** the CSS text */
    children: string;
    /**
     * Names the sheet. React keeps one stylesheet per href and never updates
     * it, so to get updated CSS to show up in the DOM, you need to also change
     * the href. It is URI-encoded, since React can’t hydrate a hoisted
     * `<style>` whose href has a space.
     */
    href: string;
    /** defaults to `medium` */
    precedence?: string;
};

/**
 * Renders CSS built while the app runs as a hoisted `<style>`, among the
 * sheets of its precedence in render order. CSS that can live in a `.css` file
 * belongs in a `<Style>` instead: this text never passes through the plugin,
 * so it isn’t minified and it ships in client JavaScript, regardless of the
 * `stripClientCSS` setting.
 */
export default function RuntimeStyle({
    children,
    href,
    precedence = 'medium',
}: RuntimeStyleProps) {
    return (
        <style href={encodeURI(href)} precedence={precedence}>
            {children}
        </style>
    );
}
