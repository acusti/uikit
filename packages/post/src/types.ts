import type { RequestOptions as _RequestOptions } from 'node:https';

export type FetchHeaders = { [key: string]: string };

export type FetchOptionsWithBody = _RequestOptions & {
    body: string;
    headers?: FetchHeaders;
};

export type FetchOptionsWithQuery = _RequestOptions & {
    body?: never;
    headers?: FetchHeaders;
    query: string;
    variables?: object;
};

export type FetchOptions = FetchOptionsWithBody | FetchOptionsWithQuery;

export type RequestOptions = _RequestOptions & { headers: FetchHeaders };
