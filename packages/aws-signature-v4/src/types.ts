export type AWSOptions = {
    accessKeyId: string;
    region?: string;
    secretAccessKey: string;
    service?: string;
    sessionToken?: string;
};

export type FetchHeaders = Record<string, string>;

export type FetchOptions = {
    headers?: FetchHeaders;
    // Make RequestInit.signal compatible with import("https").RequestOptions.signal
    signal?: AbortSignal;
} & Omit<RequestInit, 'headers' | 'signal'>;
