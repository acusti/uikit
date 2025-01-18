export type FetchHeaders = Record<string, string>;

export type FetchOptions = FetchOptionsWithBody | FetchOptionsWithQuery;

export type FetchOptionsWithBody = {
    body: string;
    headers?: FetchHeaders;
} & Omit<_RequestInit, 'body' | 'headers'>;

export type FetchOptionsWithQuery = {
    body?: never;
    headers?: FetchHeaders;
    query: string;
    variables?: object;
} & Omit<_RequestInit, 'body' | 'headers'>;

export type RequestOptions = { headers: FetchHeaders } & Omit<_RequestInit, 'headers'>;

// Make RequestInit.signal compatible with import("https").RequestOptions.signal
type _RequestInit = { signal?: AbortSignal } & Omit<RequestInit, 'signal'>;
