import type {
    FetchHeaders,
    FetchOptions,
    FetchOptionsWithQuery,
    RequestOptions,
} from './types.js';

const trimQuery = (query: string) => query.trim().replace(/\n +/g, ' ');

export const getBodyFromQuery = ({ query, variables }: FetchOptionsWithQuery) => {
    query = trimQuery(query);
    return JSON.stringify(variables ? { query, variables } : { query });
};

export const getRequestOptionsAndBody = (
    options: FetchOptions,
): { body: string; requestOptions: RequestOptions } => {
    // @ts-expect-error FetchOptions can only have a body OR a query
    let { body = '', method = 'POST', query = '', variables, ...baseOptions } = options;

    if (query) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        body = getBodyFromQuery({ query, variables });
    }

    // Lowercase all headers to make them consistent
    let headers = options.headers ?? {};
    headers = Object.keys(headers).reduce((acc: FetchHeaders, key) => {
        acc[key.toLowerCase()] = headers[key];
        return acc;
    }, {});

    if (!headers['content-length']) {
        headers['content-length'] = String(body.length);
    }

    if (!headers['content-type']) {
        headers['content-type'] = 'application/json; charset=UTF-8';
    }

    return {
        body,
        requestOptions: {
            ...baseOptions,
            headers,
            method,
        },
    };
};
