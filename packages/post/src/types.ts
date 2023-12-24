export type FetchHeaders = Record<string, string>;

// Make RequestInit.signal compatible with import("https").RequestOptions.signal
type _RequestInit = Omit<RequestInit, 'signal'> & {
    signal?: AbortSignal;
};

export type FetchOptionsWithBody = Omit<_RequestInit, 'body' | 'headers'> & {
    body: string;
    headers?: FetchHeaders;
};

export type FetchOptionsWithQuery = Omit<_RequestInit, 'body' | 'headers'> & {
    body?: never;
    headers?: FetchHeaders;
    query: string;
    variables?: object;
};

export type FetchOptions = FetchOptionsWithBody | FetchOptionsWithQuery;

export type RequestOptions = Omit<_RequestInit, 'headers'> & { headers: FetchHeaders };
