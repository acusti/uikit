import { fromEnv } from '@aws-sdk/credential-providers';
import nodeFetch from 'node-fetch';

import { getHeadersWithAuthorization } from './utils.js';

import { AWSOptions, FetchOptions, FetchOptionsWithBody } from './types.js';

const executeFetch = typeof fetch === 'undefined' ? nodeFetch : fetch;

const trimQuery = (query: string) => query.trim().replace(/\n +/g, ' ');

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
        fetchOptions as FetchOptionsWithBody,
        awsOptions as AWSOptions,
    );

    const response = await executeFetch(resource, request);
    return await response.json();
};

export { appSyncFetch, getHeadersWithAuthorization };
