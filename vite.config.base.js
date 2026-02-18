import dts from 'unplugin-dts/vite';
import { defineConfig as defineConfigVite } from 'vite';

export const defineConfig = (options = {}) => {
    const {
        build: buildOptions,
        css,
        entry = ['src/index.ts'],
        formats = ['es'],
        plugins = [],
        target,
    } = options;

    return defineConfigVite({
        build: {
            lib: {
                entry,
                fileName: (_format, entryName) => `${entryName}.js`,
                formats,
            },
            minify: false,
            rollupOptions: {
                external: [
                    /^node:/,
                    /^@acusti\//,
                    'clsx',
                    'react',
                    'react/compiler-runtime',
                    'react/jsx-runtime',
                    'react-dom',
                ],
            },
            sourcemap: true,
            ...(target ? { target } : {}),
            ...(buildOptions ?? {}),
        },
        ...(css ? { css } : {}),
        plugins: [...plugins, dts({ exclude: ['**/*.test.ts', '**/*.test.tsx'] })],
    });
};

// React Compiler https://github.com/reactwg/react-compiler/discussions/36#discussioncomment-11285011
export const compilerOptions = {
    environment: {
        enableTreatRefLikeIdentifiersAsRefs: true,
    },
    logger: {
        logEvent(filename, event) {
            if (event.kind !== 'CompileError') return;
            console.log(
                'React Compiler logger',
                filename,
                JSON.stringify(event.detail, null, 2),
            );
        },
    },
    // https://github.com/facebook/react/blob/5c56b87/compiler/packages/babel-plugin-react-compiler/src/CompilerError.ts#L11-L39
    reportableLevels: new Set([
        'CannotPreserveMemoization',
        'InvalidConfig',
        'InvalidJS',
        'InvalidReact',
        'Invariant',
        'Todo',
    ]),
};
