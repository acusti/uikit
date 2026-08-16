import fs from 'node:fs/promises';
import { type Plugin, transformWithOxc } from 'vite';

import {
    COMPONENT_OPTION_NAMES,
    type ComponentOptions,
    generateComponentModule,
} from './generate.js';

export type { ComponentOptions } from './generate.js';

export type Options = {
    /**
     * Options controlling the generated component modules: dimensions, icon,
     * and svgProps — a deliberately small subset of svgr’s Config, with the
     * same semantics. The name is carried over from the plugin’s original
     * svgr implementation.
     */
    svgrOptions?: ComponentOptions;
};

const svgReactImportFilter = /\.svg\?react$/;
// virtual module prefix (Rollup/Vite convention)
const VIRTUAL_PREFIX = '\0vite-plugin-svg-react:';
const virtualModuleFilter = /^\0vite-plugin-svg-react:/;

export default function vitePluginSVGReact(options: Options = {}): Plugin {
    // Reject unrecognized options — a typo at the top level (svgOptions) or
    // svgr options this plugin doesn’t carry over (namedExport, titleProp,
    // …) — instead of silently ignoring them: a silently dropped option
    // surfaces as broken imports or missing behavior with an error that
    // points nowhere near the cause, and only TypeScript consumers get a
    // compile-time diagnostic.
    const unsupportedTopLevel = Object.keys(options).filter(
        (name) => name !== 'svgrOptions',
    );
    if (unsupportedTopLevel.length > 0) {
        throw new Error(
            `vite-plugin-svg-react: unsupported options: ${unsupportedTopLevel.join(', ')}. ` +
                'The only supported option is svgrOptions.',
        );
    }
    const unsupportedOptions = Object.keys(options.svgrOptions ?? {}).filter(
        (name) => !COMPONENT_OPTION_NAMES.has(name),
    );
    if (unsupportedOptions.length > 0) {
        throw new Error(
            `vite-plugin-svg-react: unsupported svgrOptions: ${unsupportedOptions.join(', ')}. ` +
                `Supported options: ${Array.from(COMPONENT_OPTION_NAMES).join(', ')} ` +
                '(see the README’s Options section).',
        );
    }

    const componentOptions: ComponentOptions = options.svgrOptions ?? {};
    let development = false;
    return {
        configResolved(config) {
            // Match the jsx transform of the main pipeline (dev runtime
            // outside `vite build`) so dev SSR doesn’t import
            // react/jsx-runtime from these virtual modules only — the dep
            // scanner can’t crawl them (.svg imports are treated as assets),
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
            // the virtual id hides the on-disk source from Rollup, so
            // editing the SVG wouldn’t invalidate this module otherwise
            this.addWatchFile(filePath);
            const svg = await fs.readFile(filePath, 'utf-8');

            const code = generateComponentModule(svg, filePath, componentOptions);

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

            // return a virtual module ID that won’t be parsed as a real file
            // the \0 prefix tells Vite/Rollup this is a virtual module
            return { id: VIRTUAL_PREFIX + resolved.id };
        },
    };
}
