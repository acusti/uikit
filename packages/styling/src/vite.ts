import type { Plugin } from 'vite';

import { relative, resolve, sep } from 'node:path';

import replaceText from './replaceText.js';

export type Options = {
    /**
     * Put ahead of every href. React keeps one stylesheet per href in a
     * document, so a library built with this plugin needs one of its own,
     * such as its package name (`@scope/pkg/`), to keep its sheets from
     * sharing an href with the app’s or another library’s.
     */
    prefix?: string;
    /**
     * The directory each sheet’s href is relative to, resolved against the
     * Vite root, which it defaults to. The server and client builds must use
     * the same one, since the client finds a server-rendered sheet by its
     * href.
     */
    root?: string;
    /**
     * Leave the CSS text out of this build’s client bundle. Turn it on only
     * for a client whose pages are server-rendered with this plugin too.
     */
    stripClientText?: boolean;
};

const QUERY = '?style';
const PREFIX = '\0style-sheet:';
// the virtual id ends in `.js` so that Vite’s CSS plugins, which claim any id
// ending in `.css` (with or without a query), leave it alone
const SUFFIX = '.style.js';

/**
 * Turns `import sheet from './x.css?style'` into a sheet for `<Style>`:
 * `{ href, css }`, or `{ href, url }` in a client build that strips the text.
 *
 * 1. The href is `prefix` and the file’s path from `root`, so it is the same
 *    in every environment and no two files in a build share one.
 * 2. The text is Vite’s own `?inline` output, so it is processed and minified
 *    as an inline stylesheet always is.
 * 3. With `stripClientText`, a client build gets the URL of the same output
 *    emitted as a `.css` asset (`?url`) in place of the text. A server-rendered
 *    page already carries the text of every sheet it drew, and React reads a
 *    hoisted `<style>`’s children only when no `<style data-href>` in the
 *    document lists its href, so the client fetches only sheets the page
 *    didn’t draw.
 * 4. In dev, the module accepts updates to its stylesheet and rewrites the
 *    text in place, since React never updates the text of a hoisted `<style>`
 *    whose href it has already inserted.
 */
export default function styleSheets({
    prefix = '',
    root = '.',
    stripClientText = false,
}: Options = {}): Plugin {
    // Each hook has a filter, so Rolldown (Vite 8) calls into JavaScript only
    // for the ids it handles. The guards repeat them for a Vite that doesn’t
    // apply hook filters.
    return {
        enforce: 'pre',
        load: {
            filter: { id: /^\0style-sheet:/ },
            handler(id) {
                if (!id.startsWith(PREFIX)) return;
                const { config, mode } = this.environment;
                const isClient = config.consumer === 'client';
                const file = id.slice(PREFIX.length, -SUFFIX.length);
                const path = relative(resolve(config.root, root), file)
                    .split(sep)
                    .join('/');
                // encoded, since a space would split the href in the
                // space-separated list a server render puts in `data-href`
                const href = JSON.stringify(encodeURI(`${prefix}${path}`));
                if (stripClientText && isClient && mode === 'build') {
                    return `import url from ${JSON.stringify(`${file}?url`)};\nexport default { href: ${href}, url };\n`;
                }
                const inline = JSON.stringify(`${file}?inline`);
                const code = [
                    `import css from ${inline};`,
                    `const sheet = { css, href: ${href} };`,
                    'export default sheet;',
                ];
                if (isClient && mode === 'dev') {
                    code.push(
                        'if (import.meta.hot) {',
                        `    const replaceText = ${replaceText.toString()};`,
                        `    import.meta.hot.accept(${inline}, (module) => replaceText(sheet, module?.default));`,
                        '}',
                    );
                }
                return `${code.join('\n')}\n`;
            },
        },
        name: '@acusti/styling',
        resolveId: {
            filter: { id: /\?style$/ },
            async handler(source, importer) {
                if (!source.endsWith(QUERY)) return;
                const resolved = await this.resolve(
                    source.slice(0, -QUERY.length),
                    importer,
                    { skipSelf: true },
                );
                if (resolved == null) return;
                return `${PREFIX}${resolved.id}${SUFFIX}`;
            },
        },
    };
}
