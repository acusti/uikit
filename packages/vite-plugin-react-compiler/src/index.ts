import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

import {
    type OxcError,
    type ReactCompilerOptions,
    type SourceMap,
    transform,
} from 'oxc-transform-react';
import { createFilter, type FilterPattern, type Plugin } from 'vite';

export type Options = {
    /**
     * Modules to exclude from the compiler pass (takes precedence over
     * include).
     * @default /[/\\]node_modules[/\\]/
     */
    exclude?: FilterPattern;
    /**
     * Modules to run the compiler pass on.
     * @default /\.[jt]sx?$/
     */
    include?: FilterPattern;
    /**
     * Cache transform results by module id + content hash so repeated
     * transforms of identical content (e.g. one per environment in
     * multi-environment builds) only run the compiler once per file.
     * @default true
     */
    memoize?: boolean;
    /**
     * Options passed verbatim to React Compiler, using the same names as
     * babel-plugin-react-compiler (compilationMode, panicThreshold
     * (defaults to 'none'), target (defaults to '19'), environment, etc.).
     * Set reportDiagnostics to true to have the compiler’s recoverable
     * diagnostics (e.g. bail-outs) reported as build warnings.
     */
    compiler?: ReactCompilerOptions;
};

type CachedTransform = {
    hash: string;
    result: Promise<TransformOutput>;
};

type TransformOutput = { code: string; map?: SourceMap };

const defaultExclude = /[/\\]node_modules[/\\]/;
const defaultInclude = /\.[jt]sx?$/;

export default function vitePluginReactCompiler(options: Options = {}): Plugin {
    const filter = createFilter(
        options.include ?? defaultInclude,
        options.exclude ?? defaultExclude,
    );
    const isMemoizing = options.memoize !== false;
    // one entry per module id, replaced whenever the content hash changes;
    // holds the promise so overlapping transforms of identical content
    // (e.g. concurrent client + SSR environments) share a single run
    const cache = new Map<string, CachedTransform>();

    return {
        enforce: 'pre',
        name: 'vite-plugin-react-compiler',
        transform(code, id) {
            // vite module ids can carry a query suffix (e.g. sub-request
            // queries from other plugins); filter, cache, and compile by
            // the underlying file path — like @vitejs/plugin-react — so
            // the cache stays one-entry-per-file and sourcemap sources
            // don’t include vite queries
            const [filepath] = id.split('?');
            if (!filter(filepath)) return null;

            const run = async (): Promise<TransformOutput> => {
                const transformed = await transform(filepath, code, {
                    // leave JSX for vite’s own pipeline (refresh, dev runtime)
                    jsx: 'preserve',
                    reactCompiler: options.compiler ?? {},
                    sourcemap: true,
                });

                // fatal means a parse failure, rejected options, or a
                // diagnostic escalated by panicThreshold: no code was
                // emitted, so break the build like a Babel syntax error
                // would, forwarding the first error’s position so vite can
                // report the location alongside oxc’s own code frames
                if (transformed.fatal) {
                    this.error(
                        transformed.errors.map(formatDiagnostic).join('\n'),
                        getPosition(Buffer.from(code, 'utf8'), transformed.errors[0]),
                    );
                }

                // anything left in errors is recoverable (the code was
                // emitted): the compiler’s bail-outs and rule suppressions,
                // present only once reportDiagnostics is on, and oxc’s own
                // non-fatal diagnostics (e.g. a partially supported
                // typescript namespace), which vite’s oxc pass never sees
                // because the typescript is already stripped; oxc labels
                // the compiler’s diagnostics severity 'Error', so warn
                // about each one at its own position rather than failing
                // the build
                if (transformed.errors.length > 0) {
                    const utf8Code = Buffer.from(code, 'utf8');
                    for (const error of transformed.errors) {
                        this.warn(formatDiagnostic(error), getPosition(utf8Code, error));
                    }
                }

                return { code: transformed.code, map: transformed.map };
            };

            if (!isMemoizing) return run();

            const hash = createHash('sha1').update(code).digest('hex');
            const cached = cache.get(filepath);
            if (cached?.hash === hash) return cached.result;

            const result = run();
            cache.set(filepath, { hash, result });
            // drop failed transforms so the next request retries them
            result.catch(() => {
                if (cache.get(filepath)?.result === result) cache.delete(filepath);
            });
            return result;
        },
    };
}

// oxc’s message followed by its code frame (when it has one)
function formatDiagnostic(error: OxcError): string {
    return error.codeframe ? `${error.message}\n${error.codeframe}` : error.message;
}

// oxc label offsets are utf-8 byte offsets, but rollup’s pos argument
// indexes the (utf-16) code string; takes the code already encoded as utf-8
// so callers converting several positions encode it once
function getPosition(utf8Code: Buffer, error: OxcError | undefined): number | undefined {
    const byteStart = error?.labels[0]?.start;
    return byteStart == null
        ? undefined
        : utf8Code.subarray(0, byteStart).toString('utf8').length;
}
