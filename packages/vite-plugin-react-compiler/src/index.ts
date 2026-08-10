import { createHash } from 'node:crypto';

import {
    type ReactCompilerOptions,
    type SourceMap,
    transform,
} from 'oxc-transform-react';
import { createFilter, type FilterPattern, type Plugin } from 'vite';

export type Options = {
    /**
     * Modules to exclude from the compiler pass (takes precedence over
     * include).
     * @default /node_modules/
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
     */
    reactCompiler?: ReactCompilerOptions;
};

type CachedTransform = {
    hash: string;
    result: Promise<TransformOutput>;
};

type TransformOutput = { code: string; map?: SourceMap };

const defaultExclude = /node_modules/;
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
            if (!filter(id)) return null;

            const run = async (): Promise<TransformOutput> => {
                const transformed = await transform(id, code, {
                    // leave JSX for vite’s own pipeline (refresh, dev runtime)
                    jsx: 'preserve',
                    reactCompiler: options.reactCompiler ?? {},
                    sourcemap: true,
                });

                // fatal means a parse failure or rejected options: no code
                // was emitted, so break the build like a Babel syntax error
                // would, forwarding the first error’s position so vite can
                // report the location alongside oxc’s own code frames
                if (transformed.fatal) {
                    this.error(
                        transformed.errors
                            .map((error) =>
                                error.codeframe
                                    ? `${error.message}\n${error.codeframe}`
                                    : error.message,
                            )
                            .join('\n'),
                        transformed.errors[0]?.labels[0]?.start,
                    );
                }

                return { code: transformed.code, map: transformed.map };
            };

            if (!isMemoizing) return run();

            const hash = createHash('sha1').update(code).digest('hex');
            const cached = cache.get(id);
            if (cached?.hash === hash) return cached.result;

            const result = run();
            cache.set(id, { hash, result });
            // drop failed transforms so the next request retries them
            result.catch(() => {
                if (cache.get(id)?.result === result) cache.delete(id);
            });
            return result;
        },
    };
}
