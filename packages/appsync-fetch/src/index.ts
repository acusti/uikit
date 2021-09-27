import { fromEnv } from '@aws-sdk/credential-providers';
import nodeFetch from 'node-fetch';

import { getHeadersWithAuthorization } from './utils.js';

import { AWSOptions, FetchOptions, FetchOptionsWithBody } from './types.js';

const executeFetch = typeof fetch === 'undefined' ? nodeFetch : fetch;

const trimQuery = (query: string) => query.trim().replace(/\n +/g, ' ');

type NetworkError = Error & { response?: ResponseInit };

const appSyncFetch = async (
    resource: string,
    fetchOptions: FetchOptions,
    awsOptions: Partial<AWSOptions> = {},
) => {
    let request: FetchOptionsWithBody;

    if ('query' in fetchOptions) {
        let { query, variables, ...restOfRequest } = fetchOptions;
        query = trimQuery(query);
        request = {
            ...restOfRequest,
            body: JSON.stringify(variables ? { query, variables } : { query }),
        };
    } else {
        request = fetchOptions;
    }

    request.method = 'POST';

    if (awsOptions.accessKeyId == null) {
        const credentials = await fromEnv()();
        const _awsOptions: AWSOptions = { ...awsOptions, ...credentials };
        awsOptions = _awsOptions;
    }

    request.headers = getHeadersWithAuthorization(
        resource,
        request as FetchOptionsWithBody,
        awsOptions as AWSOptions,
    );

    // Allow fetch to throw in case of pre-request error
    const response = await executeFetch(resource, request);

    // Check for 4xx and 5xx responses and throw with the response
    if (response.status >= 400) {
        let errorMessage = `Received ${response.status} response`;

        try {
            const responseJSON = await response.json();
            errorMessage +=
                ': ' +
                responseJSON.errors.reduce(
                    (acc: string, err: { errorType?: string; message: string }) =>
                        acc + acc ? '\n' : '' + err.message,
                    '',
                );
        } catch (err) {
            const responseText = await response.text();
            errorMessage += ': ' + responseText;
        }

        const error: NetworkError = new Error(errorMessage);
        error.response = response;
        throw error;
    }

    try {
        return await response.json();
    } catch (error) {
        // If response was a 204 No content or just empty, error is from parsing non-existent JSON
        if (response.status === 204) return response;
        if (response.headers.get('content-length') === '0' && response.status === 200) {
            return response;
        }

        // If error came from JSON parsing, use response.statusText as message and throw
        if (error instanceof SyntaxError && error.message.indexOf('JSON') !== -1) {
            throw new Error(response.statusText);
        }

        // Else rethrow the error as is
        throw error;
    }
};

export { appSyncFetch, getHeadersWithAuthorization };
