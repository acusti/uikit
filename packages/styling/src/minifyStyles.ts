// TODO use techniques from https://github.com/jbleuzen/node-cssmin/blob/master/cssmin.js
// (check https://github.com/jbleuzen/node-cssmin/pull/19/files also)
export function minifyStyles(styles: string) {
    // Minify CSS styles by replacing consecutive whitespace (including \n) with ' '
    return styles.replace(/\s+/gm, ' ');
}

export default minifyStyles;
