export type AWSOptions = {
    accessKeyId: string;
    region?: string;
    secretAccessKey: string;
    service?: string;
    sessionToken?: string;
};

export type FetchHeaders = { [key: string]: string };

export type FetchOptions = Omit<RequestInit, 'body' | 'headers' | 'signal'> & {
    body: string;
    headers?: FetchHeaders;
    // Make RequestInit.signal compatible with import("https").RequestOptions.signal
    signal?: AbortSignal;
};
