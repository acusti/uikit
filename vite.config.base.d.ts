import type { UserConfig } from 'vite';

export const defineConfig: (options?: {
    build?: UserConfig['build'];
    css?: UserConfig['css'];
    entry?: string[];
    formats?: string[];
    plugins?: NonNullable<UserConfig['plugins']>;
    target?: string;
}) => UserConfig;

export const compilerOptions: {
    environment: {
        enableTreatRefLikeIdentifiersAsRefs: boolean;
    };
    logger: {
        logEvent: (filename: string, event: { detail?: unknown; kind?: string }) => void;
    };
    reportableLevels: Set<string>;
};
