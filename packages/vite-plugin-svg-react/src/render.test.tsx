// @vitest-environment happy-dom
// End-to-end tests: run SVG fixtures through the plugin's load hook (module
// generation + oxc compilation), import the compiled modules, render the
// components with @testing-library/react, and assert on the resulting DOM.
import { cleanup, render } from '@testing-library/react';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type ComponentType, createRef, type SVGProps } from 'react';
import { build } from 'vite';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import vitePluginSVGReact, { type Options } from './index.js';

type SVGComponent = ComponentType<SVGProps<SVGSVGElement>>;

// compiled modules must live inside the package so that their react imports
// resolve; the directory is removed again when the tests finish
const OUTPUT_DIRECTORY = join(import.meta.dirname, '..', '.test-tmp');

let moduleCount = 0;

async function loadFixture({
    command = 'build',
    fixture,
    svgrOptions,
}: {
    command?: 'build' | 'serve';
    fixture: string;
    svgrOptions?: Options['svgrOptions'];
}): Promise<Record<string, SVGComponent>> {
    const plugin = vitePluginSVGReact({ svgrOptions });
    const configResolved = plugin.configResolved as (config: {
        command: 'build' | 'serve';
    }) => void;
    configResolved({ command });

    const filePath = join(import.meta.dirname, 'fixtures', fixture);
    const load = plugin.load as (id: string) => Promise<{ code: string }>;
    const { code } = await load(`\0vite-plugin-svg-react:${filePath}`);

    moduleCount += 1;
    const modulePath = join(OUTPUT_DIRECTORY, `module-${moduleCount}.mjs`);
    await mkdir(OUTPUT_DIRECTORY, { recursive: true });
    await writeFile(modulePath, code);
    return (await import(pathToFileURL(modulePath).href)) as Record<string, SVGComponent>;
}

afterEach(cleanup);

afterAll(async () => {
    await rm(OUTPUT_DIRECTORY, { force: true, recursive: true });
});

describe('rendered SVG components', () => {
    it('renders the edge-cases fixture with converted attributes and no stripped nodes', async () => {
        const { default: Icon } = await loadFixture({ fixture: 'edge-cases.svg' });
        const { container } = render(<Icon />);

        // comments, doctype, and the XML prolog never reach the DOM
        expect(container.innerHTML).not.toContain('<!--');
        expect(container.innerHTML).not.toContain('DOCTYPE');

        const svg = container.querySelector('svg')!;
        // kebab-case presentation attributes render via their camelCase props
        expect(svg.getAttribute('stroke-width')).toBe('1.5');
        expect(svg.getAttribute('fill-rule')).toBe('evenodd');
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
        // class → className
        expect(svg.getAttribute('class')).toBe('icon-root');
        // numeric-looking values survive the {number} conversion
        expect(svg.getAttribute('width')).toBe('24');

        // <title>/<desc> keep their entity-decoded text content
        expect(container.querySelector('title')?.textContent).toBe('Fancy & Icon ©');
        expect(container.querySelector('desc')?.textContent).toBe(
            'An icon with {braces} and "quotes"',
        );

        // nested defs/use: xlink:href renders through xlinkHref
        expect(container.querySelector('defs linearGradient stop')).not.toBeNull();
        const use = container.querySelector('use')!;
        expect(use.getAttribute('xlink:href')).toBe('#gradient');
        expect(use.getAttribute('xml:lang')).toBe('en');

        // style strings become style objects; data-*/aria-* pass through
        const path = container.querySelector('path')!;
        expect(path.style.fill).toBe('red');
        expect(path.style.getPropertyValue('--brand')).toBe('#f00');
        expect(path.getAttribute('data-part')).toBe('path');
        expect(path.getAttribute('aria-hidden')).toBe('true');

        // text content with braces, quotes, and backslashes renders verbatim
        expect(container.querySelector('text')?.textContent).toBe(
            'Braces {and} "quotes" \\ backslash',
        );
    });

    it('spreads consumer props onto the root <svg>, overriding its attributes', async () => {
        const { default: Icon } = await loadFixture({ fixture: 'edge-cases.svg' });
        const { container } = render(
            <Icon className="overridden" role="img" width={32} />,
        );
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('class')).toBe('overridden');
        expect(svg.getAttribute('role')).toBe('img');
        expect(svg.getAttribute('width')).toBe('32');
    });

    it('preserves CDATA content in <style> elements', async () => {
        const { default: Icon } = await loadFixture({ fixture: 'cdata.svg' });
        const { container } = render(<Icon />);
        expect(container.querySelector('style')?.textContent).toBe(
            '.cls > .nested { fill: red; }',
        );
    });

    it('renders when compiled against the dev jsx runtime (serve)', async () => {
        const { default: Icon } = await loadFixture({
            command: 'serve',
            fixture: 'cdata.svg',
        });
        const { container } = render(<Icon />);
        expect(container.querySelector('rect')?.getAttribute('class')).toBe('cls');
    });

    it('exposes a named ReactComponent export with exportType: named', async () => {
        const { ReactComponent } = await loadFixture({
            fixture: 'cdata.svg',
            svgrOptions: { exportType: 'named' },
        });
        const { container } = render(<ReactComponent />);
        expect(container.querySelector('svg')).not.toBeNull();
    });

    it('forwards refs to the root <svg> with ref: true', async () => {
        const { default: Icon } = await loadFixture({
            fixture: 'cdata.svg',
            svgrOptions: { ref: true },
        });
        const ref = createRef<SVGSVGElement>();
        render(<Icon ref={ref} />);
        expect(ref.current?.tagName.toLowerCase()).toBe('svg');
    });

    it('applies icon and svgProps options to the root <svg>', async () => {
        const { default: Icon } = await loadFixture({
            fixture: 'cdata.svg',
            svgrOptions: { icon: true, svgProps: { role: 'img' } },
        });
        const { container } = render(<Icon />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('width')).toBe('1em');
        expect(svg.getAttribute('height')).toBe('1em');
        expect(svg.getAttribute('role')).toBe('img');
    });

    // The tests above hand the load hook a pre-built virtual id; this one
    // runs a real `vite build` so the `.svg?react` import travels Vite's own
    // resolution and plugin pipeline (enforce: 'pre' ordering ahead of asset
    // handling, resolveId → virtual id → load), then renders the bundle.
    it('transforms an .svg?react import end to end through a real Vite build', async () => {
        await mkdir(OUTPUT_DIRECTORY, { recursive: true });
        const entryPath = join(OUTPUT_DIRECTORY, 'entry.ts');
        const svgPath = join(import.meta.dirname, 'fixtures', 'cdata.svg');
        await writeFile(entryPath, `export { default } from '${svgPath}?react';\n`);

        const result = (await build({
            build: {
                lib: {
                    entry: entryPath,
                    fileName: () => 'bundle.mjs',
                    formats: ['es'],
                },
                minify: false,
                rollupOptions: {
                    external: ['react', 'react/jsx-runtime'],
                },
                write: false,
            },
            configFile: false,
            logLevel: 'silent',
            plugins: [vitePluginSVGReact()],
        })) as Array<{ output: Array<{ code: string }> }>;

        const chunk = result[0].output[0];
        // built (not served) modules compile against the production runtime
        expect(chunk.code).toContain('react/jsx-runtime');

        const bundlePath = join(OUTPUT_DIRECTORY, 'bundle.mjs');
        await writeFile(bundlePath, chunk.code);
        const { default: Icon } = (await import(
            pathToFileURL(bundlePath).href
        )) as Record<string, SVGComponent>;
        const { container } = render(<Icon />);
        expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 4 4');
        expect(container.querySelector('rect')?.getAttribute('class')).toBe('cls');
    });
});
