import { createHash } from 'node:crypto';
import path from 'node:path';

import { getErrorMessage } from './errors.js';
import { getRootElementOffset } from './parse.js';

/**
 * An OXVG optimiser config: the `Jobs` object `@oxvg/napi`’s `optimise`
 * takes, where each key names a job and its value that job’s parameters.
 *
 * Deliberately `object` and not `Record<string, unknown>`: `Jobs` is an
 * interface, and TypeScript gives interfaces no implicit index signature, so
 * a `Jobs` value — what `extend` returns — isn’t assignable to a Record.
 * The plugin rejects a non-object (and null, and an array) at config time,
 * which is the part a type can’t enforce for a plain-JS vite.config anyway.
 */
export type OptimizeConfig = object;

/** Optimize an SVG source, naming its file path in any error it throws. */
export type Optimizer = (svg: string, filePath: string) => string;

// The slice of @oxvg/napi this plugin uses, described structurally rather
// than imported from the package’s own types: @oxvg/napi is an optional peer
// dependency, so a type import would leave an unresolvable module specifier
// in this package’s published .d.ts for every install that doesn’t have it.
// Consumers who do install it can still type their own config against the
// real thing, with `satisfies Jobs` at the call site (see the README).
type OXVG = {
    // a Record rather than OptimizeConfig: the result gets destructured, so
    // it has to be indexable here even though callers only pass it along
    extend: (
        preset: { type: 'Default' },
        config?: OptimizeConfig,
    ) => Record<string, unknown>;
    optimise: (svg: string, config?: OptimizeConfig) => string;
};

// The parameters of OXVG’s prefixIds job, as far as this plugin reads them
type PrefixIdsJob = {
    delim: string;
    prefix: { type: 'Default' } | { type: 'None' } | { field0: string; type: 'Prefix' };
    prefixClassNames: boolean;
    prefixIds: boolean;
};

// Everything but a line feed, so blanking the prolog preserves line and
// column. \n only is deliberate, and enough: under CRLF the \r sits at the
// end of a line, so blanking it moves nothing, and OXVG counts lines by \n
// alone — a file using lone \r line endings reports line 1 whether or not
// the prolog is touched. parseSVG’s own positions count the same way, so the
// two agree on such a file rather than one being a regression on the other.
const NON_NEWLINE_REGEX = /[^\n]/g;
const OXVG_MODULE = '@oxvg/napi';

/**
 * What separates a file’s prefix from the id it’s applied to. The prefix
 * ends in a hash, so the delimiter only has to be unambiguous against that:
 * `_` is, and unlike the `-` that joins the base name to the hash, it stays
 * legible in a CSS selector, valid in an XML name, and needs no escaping
 * anywhere an app might reference the resulting id.
 */
export const PREFIX_DELIMITER = '_';

// What `optimize: true` runs: OXVG’s default preset, whose cleanupIds
// minifies every file’s ids down to the same `a` and `b`, plus prefixIds
// with a per-file prefix (resolved below) to make them unique again once
// components are inlined together. Class names aren’t prefixed: nothing in
// the preset renames a class, and an app’s CSS is more likely to select by
// class than by id.
const getDefaultConfig = (extend: OXVG['extend']): OptimizeConfig =>
    extend(
        { type: 'Default' },
        {
            prefixIds: {
                delim: PREFIX_DELIMITER,
                prefix: { type: 'Default' },
                prefixClassNames: false,
                prefixIds: true,
            } satisfies PrefixIdsJob,
        },
    );

const isPrefixIdsJob = (value: unknown): value is PrefixIdsJob =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { prefix?: unknown }).prefix === 'object' &&
    (value as { prefix: null | object }).prefix !== null;

// the config’s prefixIds job if it asks for the default prefix, which is the
// one this plugin resolves per file
const getFilePrefixedJob = (config: OptimizeConfig): null | PrefixIdsJob => {
    const { prefixIds } = config as { prefixIds?: unknown };
    if (!isPrefixIdsJob(prefixIds) || prefixIds.prefix.type !== 'Default') {
        return null;
    }
    return prefixIds;
};

/**
 * The id prefix for an SVG file: its base name, sanitized to the characters
 * an id keeps unescaped in CSS, plus a short hash of its path relative to
 * the vite root. The hash is what makes `icons/small/arrow.svg` and
 * `icons/large/arrow.svg` differ; hashing the relative path rather than the
 * absolute one keeps the output identical across machines and checkouts.
 */
export const getIdPrefix = (filePath: string, root: string): string => {
    const relativePath = path.relative(root, filePath).split(path.sep).join('/');
    const hash = createHash('sha256').update(relativePath).digest('hex').slice(0, 4);
    const baseName = path
        .basename(filePath)
        .replace(/\.[^.]*$/, '')
        .replace(/[^0-9A-Za-z_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    // an id that starts with a digit or a hyphen has to be escaped in a CSS
    // selector and isn’t a valid XML name; a leading underscore is both
    const name = /^[A-Za-z_]/.test(baseName) ? baseName : `_${baseName}`;
    return `${name}-${hash}`;
};

const importOXVG = async (): Promise<OXVG> => {
    try {
        const oxvg: unknown = await import('@oxvg/napi');
        return oxvg as OXVG;
    } catch (error) {
        // covers both a missing package and a missing platform binary,
        // which is the same fix from the consumer’s side
        throw new Error(
            `vite-plugin-svg-react: the optimize option needs ${OXVG_MODULE}, which failed to load. ` +
                `Install it (npm install --save-dev ${OXVG_MODULE}) or remove the optimize option.`,
            { cause: error },
        );
    }
};

let oxvgPromise: null | Promise<OXVG> = null;

// Memoized so the native module loads once per process rather than once per
// SVG — but a failure isn’t memoized, or the error would outlive its own
// advice: Node doesn’t cache a rejected dynamic import, and vite restarts
// its config in-process while this module instance survives, so installing
// @oxvg/napi and saving vite.config again has to be able to succeed instead
// of replaying “which failed to load” at a consumer who just fixed it.
const loadOXVG = async (): Promise<OXVG> => {
    oxvgPromise ??= importOXVG();
    try {
        return await oxvgPromise;
    } catch (error) {
        oxvgPromise = null;
        throw error;
    }
};

/**
 * Build the optimizer for an `optimize` option that isn’t `false`, loading
 * @oxvg/napi and running the resolved config once so that a missing package
 * or a config OXVG rejects fails here — where the message can name the
 * option — rather than on the first `.svg?react` import, where it would name
 * whichever SVG happened to get there first.
 */
export async function createOptimizer(
    options: OptimizeConfig | true,
    root: string,
): Promise<Optimizer> {
    const { extend, optimise } = await loadOXVG();
    // a config object is handed to `optimise` verbatim, because that’s what
    // `optimise` does with it — an OXVG config isn’t merged into a preset,
    // it *is* the job list (`{ mergePaths: … }` means “only merge paths”),
    // and quietly adding or dropping jobs would make the option something
    // other than the passthrough it’s documented as. The one value filled
    // in is a prefixIds prefix of `{ type: 'Default' }`, which means nothing
    // without a path (see getFilePrefixedJob), and only that value.
    const config = options === true ? getDefaultConfig(extend) : options;
    const filePrefixedJob = getFilePrefixedJob(config);
    const getConfig = (filePath: string): OptimizeConfig => {
        if (filePrefixedJob == null) return config;
        // a spread keeps the job at its existing key, though OXVG runs jobs
        // in its own fixed order (cleanupIds before prefixIds) regardless
        return {
            ...config,
            prefixIds: {
                ...filePrefixedJob,
                prefix: { field0: getIdPrefix(filePath, root), type: 'Prefix' },
            },
        };
    };

    const optimizer: Optimizer = (svg, filePath) => {
        // OXVG refuses a document with a DTD outright, and its parser has no
        // use for the rest of the prolog either, all of which component
        // generation discards anyway — so the prolog is blanked out rather
        // than cut off. OXVG accepts the leading whitespace, and keeping the
        // bytes means the line:column in its errors still points where the
        // file actually is: cutting an 8-line Illustrator prolog reported
        // line 1 for what the editor calls line 8.
        //
        // What blanking can’t carry over is a doctype’s internal subset,
        // the one part of the prolog the root element can depend on: classic
        // Illustrator (10–CS4) declares its Adobe namespaces as entities
        // there. Those references outlive the prolog, so OXVG fails the file
        // with `unknown entity reference` — one of a few tolerances that
        // `optimize` gives up, documented in the README under the option.
        const offset = getRootElementOffset(svg);
        const source =
            offset <= 0
                ? svg
                : svg.slice(0, offset).replace(NON_NEWLINE_REGEX, ' ') +
                  svg.slice(offset);
        try {
            return optimise(source, getConfig(filePath));
        } catch (error) {
            throw new Error(
                `vite-plugin-svg-react: failed to optimize ${filePath}: ${getErrorMessage(error)}`,
                { cause: error },
            );
        }
    };

    try {
        // resolved for a stand-in path, so what’s validated is the shape
        // that runs, prefix included
        optimise(
            '<svg xmlns="http://www.w3.org/2000/svg"/>',
            getConfig(path.join(root, 'icon.svg')),
        );
    } catch (error) {
        throw new Error(
            `vite-plugin-svg-react: OXVG rejected the optimize config: ${getErrorMessage(error)} ` +
                '(see the README’s Options section).',
            { cause: error },
        );
    }
    return optimizer;
}
