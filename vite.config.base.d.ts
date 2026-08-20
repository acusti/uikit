import type { UserConfig } from 'vite';

export const defineConfig: (options?: {
    build?: UserConfig['build'];
    css?: UserConfig['css'];
    entry?: string[];
    formats?: string[];
    plugins?: NonNullable<UserConfig['plugins']>;
    react?: boolean | 'no-compiler';
    target?: string;
}) => UserConfig;

export const compilerOptions: {
    environment: {
        enableTreatRefLikeIdentifiersAsRefs: boolean;
    };
};
