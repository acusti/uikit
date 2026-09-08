import fs from 'node:fs/promises';
import { type Plugin, transformWithOxc } from 'vite';

import {
    COMPONENT_OPTION_NAMES,
    type ComponentOptions,
    generateComponentModule,
    getComponentOptionsError,
} from './generate.js';
import { createOptimizer, type OptimizeConfig, type Optimizer } from './optimize.js';

export type { ComponentOptions } from './generate.js';
export type { OptimizeConfig } from './optimize.js';

export type Options = {
    /**
     * Optimize each SVG with OXVG before it’s converted to a component.
     * `true` runs OXVG’s default preset minus cleanupIds, so no id or class
     * name is renamed; an object is an OXVG config used as-is.
     *
     * Needs the optional @oxvg/napi peer dependency installed.
     *
     * @default false
     */
    optimize?: boolean | OptimizeConfig;
    /**
     * Options shaping the generated <svg> element (dimensions, icon, svgProps)
     * with the same semantics as svgr’s options of the same names.
     */
    svg?: ComponentOptions;
};

const OPTION_NAMES: ReadonlySet<string> = new Set(['optimize', 'svg']);
const svgReactImportFilter = /\.svg\?react$/;
// virtual module prefix (Rollup/Vite convention)
const VIRTUAL_PREFIX = '\0vite-plugin-svg-react:';
const virtualModuleFilter = /^\0vite-plugin-svg-react:/;

export default function vitePluginSVGReact(options: Options = {}): Plugin {
    // Reject unrecognized options — a typo at the top level, the pre-rework
    // svgrOptions key, or svgr options this plugin doesn’t carry over
    // (namedExport, titleProp, …) — instead of silently ignoring them: a
    // silently dropped option surfaces as broken imports or missing behavior
    // with an error that points nowhere near the cause, and only TypeScript
    // consumers get a compile-time diagnostic.
    const unsupportedTopLevel = Object.keys(options).filter(
        (name) => !OPTION_NAMES.has(name),
    );
    if (unsupportedTopLevel.length > 0) {
        // point migrations from the svgr-era API (this plugin ≤ 0.1 and
        // vite-plugin-svgr) at the renamed, narrowed shape
        const hint = unsupportedTopLevel.includes('svgrOptions')
            ? 'svgrOptions was renamed to svg and narrowed to dimensions, icon, and svgProps (see the README’s Options section).'
            : `Supported options: ${Array.from(OPTION_NAMES).join(', ')}.`;
        throw new Error(
            `vite-plugin-svg-react: unsupported options: ${unsupportedTopLevel.join(', ')}. ${hint}`,
        );
    }
    // a non-object svg value would slip past the key check below —
    // Object.keys(true) is empty, so every option silently defaults, and
    // Object.keys('icon') yields character indices and a nonsense message
    if (
        options.svg !== undefined &&
        (typeof options.svg !== 'object' ||
            options.svg === null ||
            Array.isArray(options.svg))
    ) {
        throw new Error(
            'vite-plugin-svg-react: svg must be an object with dimensions, icon, ' +
                'and/or svgProps (see the README’s Options section).',
        );
    }
    const unsupportedOptions = Object.keys(options.svg ?? {}).filter(
        (name) => !COMPONENT_OPTION_NAMES.has(name),
    );
    if (unsupportedOptions.length > 0) {
        throw new Error(
            `vite-plugin-svg-react: unsupported svg options: ${unsupportedOptions.join(', ')}. ` +
                `Supported options: ${Array.from(COMPONENT_OPTION_NAMES).join(', ')} ` +
                '(see the README’s Options section).',
        );
    }

    // `false` and `true` both have to be spellable, so this reads the value
    // rather than its presence; anything that isn’t a boolean or a config
    // object would reach OXVG as one and be silently ignored there
    const { optimize = false } = options;
    if (
        typeof optimize !== 'boolean' &&
        (typeof optimize !== 'object' || optimize === null || Array.isArray(optimize))
    ) {
        throw new Error(
            'vite-plugin-svg-react: optimize must be a boolean or an OXVG config object ' +
                '(see the README’s Options section).',
        );
    }

    // null when optimization is off; narrowing here keeps the setting’s two
    // live shapes (the default preset, or a config object) intact downstream
    const optimizeSetting = optimize === false ? null : optimize;

    const componentOptions: ComponentOptions = options.svg ?? {};
    // option values, not just their names: svgProps reaches the generated
    // module verbatim, so an invalid one has to fail here rather than as a
    // JSX parse error attributed to whichever SVG happened to be loaded first
    const componentOptionsError = getComponentOptionsError(componentOptions);
    if (componentOptionsError != null) {
        throw new Error(
            `vite-plugin-svg-react: ${componentOptionsError} (see the README’s Options section).`,
        );
    }
    let development = false;
    // memoized: the plugin loads @oxvg/napi and validates the config once,
    // then every load shares the resulting optimizer
    let optimizerPromise: null | Promise<Optimizer> = null;
    const getOptimizer = (setting: OptimizeConfig | true) =>
        (optimizerPromise ??= createOptimizer(setting));
    return {
        async configResolved(config) {
            // Match the jsx transform of the main pipeline (dev runtime
            // outside `vite build`) so dev SSR doesn’t import
            // react/jsx-runtime from these virtual modules only — the dep
            // scanner can’t crawl them (.svg imports are treated as assets),
            // so that lone import gets discovered mid-first-request and
            // forces a cold-cache re-optimization. See “Why the dev JSX
            // runtime in dev matters” in the README.
            development = config.command === 'serve';
            // resolve the optimizer at config time so a missing @oxvg/napi or
            // a config OXVG rejects fails with a message naming the option,
            // rather than on the first .svg?react import with one naming
            // whichever SVG got there first
            if (optimizeSetting != null) await getOptimizer(optimizeSetting);
        },
        enforce: 'pre',
        async load(id) {
            if (!virtualModuleFilter.test(id)) return;
            // extract the real file path from the virtual ID
            const filePath = id.slice(VIRTUAL_PREFIX.length);
            // the virtual id hides the on-disk source from Rollup, so
            // editing the SVG wouldn’t invalidate this module otherwise
            this.addWatchFile(filePath);
            let svg = await fs.readFile(filePath, 'utf-8');
            if (optimizeSetting != null) {
                svg = (await getOptimizer(optimizeSetting))(svg, filePath);
            }

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
