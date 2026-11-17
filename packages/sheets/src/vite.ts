import { existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { defaultClientConditions, normalizePath, type Plugin } from 'vite';

import replaceText from './replaceText.js';

export type Options = {
    /**
     * Builds a component library in one of the two forms it publishes:
     * - `'default'`: each sheet compiled to `{ href, css }`, and
     *   `@acusti/sheets` replaced by a few lines that render plain `<style>`
     *   elements, so the output imports nothing from it and works in any
     *   React 19 app.
     * - `'raw'`: each `?sheet` import kept, carrying its href, with the
     *   library’s processed CSS emitted next to the output, and
     *   `@acusti/sheets` left external, for an app whose plugin strips the
     *   text. Publish it under the `acusti-sheets` export condition, which the
     *   plugin turns on for an app’s client.
     */
    library?: 'default' | 'raw';
    /**
     * Put ahead of every href. React keeps one stylesheet per href in a
     * document, so a library built with this plugin needs one of its own,
     * such as its package name (`@scope/pkg/`), to keep its sheets from
     * sharing an href with the app’s or another library’s.
     */
    prefix?: string;
    /**
     * The directory each sheet’s href is relative to, resolved against the
     * Vite root (the default). Left out, a sheet’s href is its path from the
     * Vite root, e.g. `src/card.css`. The server and client builds must use the
     * same one, since the client finds a server-rendered sheet by its href.
     */
    root?: string;
    /**
     * Leave the CSS text out of this build’s client bundle. Only worth it when
     * the pages are server-rendered: the client fetches each sheet a page is
     * missing. A library build ignores it.
     */
    stripClientCSS?: boolean;
};

const QUERY = '?sheet';
// a raw library build’s import carries the sheet’s href: `./x.css?sheet=<href>`
const HREF_QUERY = /\?sheet=([^&?]*)$/;
const PREFIX = '\0style-sheet:';
// The export condition under which a library publishes its raw build. A change
// to that build’s format gets a new one (`acusti-sheets-v2`), and the plugin
// keeps adding this one for as long as it still reads this format.
const CONDITION = 'acusti-sheets';
const PACKAGE = '@acusti/sheets';
const INLINE_RUNTIME = '\0acusti-sheets:inline';
// What a default library build renders in place of `@acusti/sheets`. Its
// sheets always carry their text, so a plain hoisted `<style>` does.
const INLINE_RUNTIME_CODE = `import { jsx } from 'react/jsx-runtime';
export function Style({ precedence = 'medium', sheet }) {
    return jsx('style', { children: sheet.css, href: sheet.href, precedence });
}
export function RuntimeStyle({ children, href, precedence = 'medium' }) {
    return jsx('style', { children, href: encodeURI(href), precedence });
}
export function StyleProvider({ children }) {
    return children;
}
`;
// the virtual id ends in `.js` so that Vite’s CSS plugins, which claim any id
// ending in `.css` (with or without a query), leave it alone
const SUFFIX = '.sheet.js';

// what reading a sheet’s processed CSS needs from a plugin context
type LoadContext = {
    load: (options: { id: string }) => Promise<null | { code?: null | string }>;
    resolve: (source: string, importer?: string) => Promise<null | { id: string }>;
};

// and what emitting it needs
type EmitContext = LoadContext & {
    emitFile: (file: { fileName: string; source: string; type: 'asset' }) => unknown;
    error: (message: string) => never;
};

// a raw library build’s sheet, and the module that imports it
type RawSheet = { file: string; importer?: string };

/**
 * Turns `import sheet from './x.css?sheet'` into a sheet for `<Style>`:
 * `{ href, css }`, or `{ href, url }` in a client build that strips the text.
 *
 * 1. The href is `prefix` and the file’s path from `root`, so it is the same
 *    in every environment and no two files in a build share one.
 * 2. The text is Vite’s own `?inline` output and is processed and minified like
 *    the rest of your CSS files.
 * 3. With `stripClientCSS`, a client build gets the URL of the same output
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
    library,
    prefix = '',
    root = '.',
    stripClientCSS = false,
}: Options = {}): Plugin {
    // the hrefs a raw library build’s imports carry, by the virtual id of
    // their sheet, which is the string `load` gets
    const givenHrefs = new Map<string, string>();
    // A raw library build’s sheets, by their path in its output, and the ones
    // this build has emitted. A watch rebuild empties the output, so it
    // emits them all again.
    const rawSheets = new Map<string, RawSheet>();
    const emitted = new Set<string>();
    // emits a raw sheet’s processed CSS at its path in the output, once a build
    const emitSheet = async (context: EmitContext, path: string, sheet: RawSheet) => {
        if (emitted.has(path)) return;
        // marked before the read, so that another importer resolving the same
        // sheet meanwhile doesn’t emit it too
        emitted.add(path);
        const css = await readProcessedCSS(context, sheet);
        if (css == null) context.error(`unexpected ?inline output for ${sheet.file}`);
        context.emitFile({ fileName: path, source: css, type: 'asset' });
    };
    const getHref = (viteRoot: string, file: string) =>
        encodeURI(`${prefix}${getPath(resolve(viteRoot, root), file)}`);
    // Each hook has a filter, so Rolldown (Vite 8) calls into JavaScript only
    // for the ids it handles. The guards repeat them for Vite 6.0–6.2, whose
    // dev server ignores hook filters.
    return {
        // On a watch rebuild, Rolldown (Vite 8) resolves each import again,
        // and `resolveId` emits its sheet, but Rollup (Vite 6 and 7) reuses
        // the resolutions of an importer that didn’t change, so this emits
        // the sheets it already knows, failing the rebuild on a CSS error as
        // `resolveId` would. Rolldown can’t load anything from here.
        async buildStart() {
            emitted.clear();
            if (library !== 'raw' || 'rolldownVersion' in this.meta) return;
            for (const [path, sheet] of rawSheets) {
                // A sheet whose file is gone isn’t emitted, but its path is
                // watched, so that putting it back rebuilds with it. (Rollup
                // keeps the resolution of an importer that didn’t change.)
                if (!existsSync(sheet.file)) {
                    this.addWatchFile(sheet.file);
                    continue;
                }
                await emitSheet(this, path, sheet);
            }
        },
        // An app’s client resolves a dual-published library to its raw build.
        // Its server keeps the default one, which Node loads for a dependency
        // Vite leaves external, so both render a sheet under the same href.
        configEnvironment(name, config) {
            if (library != null) return;
            const consumer = config.consumer ?? (name === 'client' ? 'client' : 'server');
            if (consumer !== 'client') return;
            // Vite concatenates the conditions an environment already has
            // with these, so only the defaults are needed for one that has none
            const conditions =
                config.resolve?.conditions == null
                    ? [CONDITION, ...defaultClientConditions]
                    : [CONDITION];
            // A raw build’s `@acusti/sheets` resolves from the app’s root, so
            // that a linked library shares the app’s copy, and its context.
            return { resolve: { conditions, dedupe: [PACKAGE] } };
        },
        enforce: 'pre',
        // turns what a library build’s README instructions rule out into an
        // error at that build, rather than at an app that uses it
        generateBundle(_options, bundle) {
            if (library == null) return;
            for (const chunk of Object.values(bundle)) {
                if (chunk.type !== 'chunk') continue;
                const imports = [...chunk.imports, ...chunk.dynamicImports];
                if (library === 'default' && imports.includes(PACKAGE)) {
                    this.error(
                        `${chunk.fileName} imports ${PACKAGE}, which a default library build replaces: take it off the build’s \`external\` list`,
                    );
                }
                if (
                    library === 'raw' &&
                    chunk.fileName.includes('/') &&
                    imports.some((id) => HREF_QUERY.test(id))
                ) {
                    this.error(
                        `${chunk.fileName} imports its sheets from paths relative to the output’s root, so a raw library build’s chunks must sit there`,
                    );
                }
            }
        },
        load: {
            filter: { id: [/^\0style-sheet:/, /^\0acusti-sheets:inline$/] },
            handler(id) {
                if (id === INLINE_RUNTIME) return INLINE_RUNTIME_CODE;
                if (!id.startsWith(PREFIX)) return;
                const { config, mode } = this.environment;
                const isClient = config.consumer === 'client';
                const file = normalizePath(
                    resolve(config.root, id.slice(PREFIX.length, -SUFFIX.length)),
                );
                // encoded, since a space would split the href in the
                // space-separated list a server render puts in `data-href`
                const href = JSON.stringify(
                    givenHrefs.get(id) ?? getHref(config.root, file),
                );
                // a library’s default build always keeps the text, which its
                // plain `<style>`s render
                if (stripClientCSS && library == null && isClient && mode === 'build') {
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
        name: '@acusti/sheets',
        resolveId: {
            filter: { id: [/\?sheet(=[^&?]*)?$/, /^@acusti\/sheets$/] },
            async handler(source, importer) {
                if (source === PACKAGE) {
                    if (library === 'default') return INLINE_RUNTIME;
                    if (library === 'raw') return { external: true, id: PACKAGE };
                    return;
                }
                const given = HREF_QUERY.exec(source);
                if (!source.endsWith(QUERY) && given == null) return;
                const resolved = await this.resolve(
                    source.slice(0, source.lastIndexOf(QUERY)),
                    importer,
                    { skipSelf: true },
                );
                if (resolved == null) return;
                if (library === 'raw') {
                    const { config } = this.environment;
                    const path = getPath(config.root, resolved.id);
                    if (path.startsWith('../')) {
                        this.error(
                            `${resolved.id} is outside the Vite root, so a raw library build can’t emit it next to its output`,
                        );
                    }
                    const sheet = { file: resolved.id, importer };
                    rawSheets.set(path, sheet);
                    await emitSheet(this, path, sheet);
                    // relative to the output’s root, where a library’s entry is
                    const href = encodeURIComponent(getHref(config.root, resolved.id));
                    return { external: true, id: `./${path}?sheet=${href}` };
                }
                // A build that keeps comments (a library’s, by default) names
                // each module by its id, so a build’s is relative to the Vite
                // root. Dev keeps the absolute path: it serves the module at a
                // URL made from the id, where `..` segments would collapse.
                const { config, mode } = this.environment;
                const file =
                    mode === 'build' ? getPath(config.root, resolved.id) : resolved.id;
                const id = `${PREFIX}${file}${SUFFIX}`;
                if (given != null) givenHrefs.set(id, decodeURIComponent(given[1]!));
                return id;
            },
        },
    };
}

function getPath(from: string, file: string) {
    return relative(from, file).split(sep).join('/');
}

// A library’s own processed CSS for a sheet, as `?inline` gives it, so that
// an app adopts the text its default build carries. Null when nothing loads.
async function readProcessedCSS(context: LoadContext, { file, importer }: RawSheet) {
    const inline = await context.resolve(`${file}?inline`, importer);
    const loaded = inline == null ? null : await context.load({ id: inline.id });
    const css = /^export default ("(?:[^"\\]|\\.)*");?\s*$/.exec(loaded?.code ?? '');
    return css == null ? null : (JSON.parse(css[1]!) as string);
}
