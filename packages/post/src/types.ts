import type { RequestOptions as _RequestOptions } from 'node:https';

export type FetchHeaders = { [key: string]: string };

export type FetchOptionsWithBody = Omit<_RequestOptions, 'body' | 'headers'> & {
    body: string;
    headers?: FetchHeaders;
};

export type FetchOptionsWithQuery = Omit<_RequestOptions, 'body' | 'headers'> & {
    body?: never;
    headers?: FetchHeaders;
    query: string;
    variables?: object;
};

export type FetchOptions = FetchOptionsWithBody | FetchOptionsWithQuery;

export type RequestOptions = Omit<_RequestOptions, 'headers'> & { headers: FetchHeaders };
