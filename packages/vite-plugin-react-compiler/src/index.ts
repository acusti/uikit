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
    result: { code: string; map?: SourceMap };
};

const defaultExclude = /node_modules/;
const defaultInclude = /\.[jt]sx?$/;

export default function vitePluginReactCompiler(options: Options = {}): Plugin {
    const filter = createFilter(
        options.include ?? defaultInclude,
        options.exclude ?? defaultExclude,
    );
    const isMemoizing = options.memoize !== false;
    // one entry per module id, replaced whenever the content hash changes
    const cache = new Map<string, CachedTransform>();

    return {
        enforce: 'pre',
        name: 'vite-plugin-react-compiler',
        async transform(code, id) {
            if (!filter(id)) return null;

            let hash = '';
            if (isMemoizing) {
                hash = createHash('sha1').update(code).digest('hex');
                const cached = cache.get(id);
                if (cached?.hash === hash) return cached.result;
            }

            const transformed = await transform(id, code, {
                // leave JSX for vite’s own pipeline (refresh, dev runtime)
                jsx: 'preserve',
                reactCompiler: options.reactCompiler ?? {},
                sourcemap: true,
            });

            // fatal means a parse failure or rejected options: no code was
            // emitted, so break the build like a Babel syntax error would
            if (transformed.fatal) {
                this.error(transformed.errors.map((error) => error.message).join('\n'));
            }

            const result = { code: transformed.code, map: transformed.map };
            if (isMemoizing) cache.set(id, { hash, result });
            return result;
        },
    };
}
