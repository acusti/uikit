import { type Config, transform } from '@svgr/core';
import jsx from '@svgr/plugin-jsx';
import fs from 'node:fs/promises';
import { type Plugin, transformWithOxc } from 'vite';

export type Options = {
    /**
     * Options passed to @svgr/core’s transform, shallow-merged over the
     * defaults ({ exportType: 'default', jsxRuntime: 'automatic',
     * plugins: [jsx], typescript: true }).
     */
    svgrOptions?: Config;
};

const svgReactImportFilter = /\.svg\?react$/;
// virtual module prefix (Rollup/Vite convention)
const VIRTUAL_PREFIX = '\0vite-plugin-svg-react:';
const virtualModuleFilter = /^\0vite-plugin-svg-react:/;

const defaultSVGROptions: Config = {
    exportType: 'default',
    jsxRuntime: 'automatic',
    plugins: [jsx],
    typescript: true,
};

export default function vitePluginSVGReact(options: Options = {}): Plugin {
    const svgrOptions = { ...defaultSVGROptions, ...options.svgrOptions };
    let development = false;
    return {
        configResolved(config) {
            // Match the jsx transform of the main pipeline (dev runtime
            // outside `vite build`) so dev SSR doesn't import
            // react/jsx-runtime from these virtual modules only — the dep
            // scanner can't crawl them (.svg imports are treated as assets),
            // so that lone import gets discovered mid-first-request and
            // forces a cold-cache re-optimization. See “Why the dev JSX
            // runtime in dev matters” in the README.
            development = config.command === 'serve';
        },
        enforce: 'pre',
        async load(id) {
            if (!virtualModuleFilter.test(id)) return;
            // extract the real file path from the virtual ID
            const filePath = id.slice(VIRTUAL_PREFIX.length);
            const svg = await fs.readFile(filePath, 'utf-8');

            const code = await transform(svg, svgrOptions, { filePath });

            const compiled = await transformWithOxc(code, filePath, {
                jsx: { development, runtime: 'automatic' },
                lang: 'tsx',
            });

            return { code: compiled.code, map: compiled.map };
        },
        name: 'vite-plugin-svg-react',
        async resolveId(source, importer, resolveOptions) {
            if (!svgReactImportFilter.test(source)) return null;

            // remove the ?react suffix to resolve the actual SVG file
            const svgPath = source.replace(/\?react$/, '');

            // resolve relative to importer
            const resolved = await this.resolve(svgPath, importer, {
                ...resolveOptions,
                skipSelf: true,
            });
            if (resolved == null) return null;

            // return a virtual module ID that won't be parsed as a real file
            // the \0 prefix tells Vite/Rollup this is a virtual module
            return { id: VIRTUAL_PREFIX + resolved.id };
        },
    };
}
