import nodeFetch from 'node-fetch';

import { getHeadersWithAuthorization } from './utils.js';

import { AWSOptions, FetchOptions, FetchOptionsWithBody } from './types.js';

const executeFetch = typeof fetch === 'undefined' ? nodeFetch : fetch;

const trimQuery = (query: string) => query.trim().replace(/\n +/g, ' ');

type GQLResponse = {
    data?: object;
    errors?: Array<{ errorType: string; message: string; path: Array<string> }>;
};

export type ResponseError = Error & {
    response?: ResponseInit;
    responseJSON?: GQLResponse;
    responseText?: string;
};

const ENV_KEY = 'AWS_ACCESS_KEY_ID';
const ENV_SECRET = 'AWS_SECRET_ACCESS_KEY';
const ENV_SESSION = 'AWS_SESSION_TOKEN';
const ENV_EXPIRATION = 'AWS_CREDENTIAL_EXPIRATION';

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

    if (awsOptions.accessKeyId == null && typeof process !== 'undefined') {
        // BEGIN https://github.com/aws/aws-sdk-js-v3/blob/main/packages/credential-provider-env/src/fromEnv.ts
        const accessKeyId: string | undefined = process.env[ENV_KEY];
        const secretAccessKey: string | undefined = process.env[ENV_SECRET];
        const sessionToken: string | undefined = process.env[ENV_SESSION];
        const expiry: string | undefined = process.env[ENV_EXPIRATION];
        const credentials =
            accessKeyId && secretAccessKey
                ? {
                      accessKeyId,
                      secretAccessKey,
                      ...(sessionToken && { sessionToken }),
                      ...(expiry && { expiration: new Date(expiry) }),
                  }
                : { accessKeyId: '', secretAccessKey: '' };
        // END https://github.com/aws/aws-sdk-js-v3/blob/main/packages/credential-provider-env/src/fromEnv.ts
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
        const messageBase = `Received ${response.status} response`;
        const error: ResponseError = new Error(messageBase);
        error.response = response;
        error.responseText = await response.text();
        if (error.responseText) {
            error.message += ': ' + error.responseText;
        }

        try {
            error.responseJSON = (await response.json()) as GQLResponse;
            const { errors } = error.responseJSON;
            if (errors) {
                error.message =
                    `: ${messageBase}` +
                    errors.reduce(
                        (acc: string, { message }) => (acc + acc ? '\n' : '' + message),
                        '',
                    );
            }
        } catch (innerError) {}

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
