export type FetchHeaders = { [key: string]: string };

export type FetchOptionsWithBody = RequestInit & {
    body: string;
    headers?: FetchHeaders;
};
export type FetchOptionsWithQuery = RequestInit & {
    body?: never;
    headers?: FetchHeaders;
    query: string;
    variables?: object;
};

export type FetchOptions = FetchOptionsWithBody | FetchOptionsWithQuery;

export type AWSOptions = {
    accessKeyId: string;
    region?: string;
    secretAccessKey: string;
    service?: string;
    sessionToken?: string;
};
