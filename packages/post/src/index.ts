import http, { IncomingMessage } from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

import type {
    FetchHeaders,
    FetchOptions,
    FetchOptionsWithBody,
    FetchOptionsWithQuery,
} from './types.js';
import { getRequestOptionsAndBody } from './utils.js';

export { getBodyFromQuery, getRequestOptionsAndBody } from './utils.js';
export type { FetchHeaders, FetchOptions, FetchOptionsWithBody, FetchOptionsWithQuery };

type UnknownGQLResponseJSON = {
    data?: unknown;
    errors: Array<{ message: string }>;
};

export const post = async <ResponseJSON>(url: string, options: FetchOptions) => {
    const parsedURL = new URL(url);
    if (parsedURL.protocol !== 'https:' && parsedURL.protocol !== 'http:') {
        const urlScheme = parsedURL.protocol.replace(/:$/, '');
        throw new TypeError(
            `@acusti/post cannot load ${url}. URL scheme "${urlScheme}" is not supported.`,
        );
    }

    const { request } = parsedURL.protocol === 'http:' ? http : https;

    const { body, requestOptions } = getRequestOptionsAndBody(options);

    let data = '';
    const response: IncomingMessage = await new Promise((resolve, reject) => {
        const clientRequest = request(
            parsedURL,
            requestOptions,
            (response: IncomingMessage) => {
                response.on('data', (chunk: string) => {
                    data += chunk;
                });

                response.on('end', () => {
                    resolve(response);
                });
            },
        );

        clientRequest.on('error', (error: Error) => {
            reject(error);
        });

        clientRequest.write(body);
        clientRequest.end();
    });

    // Check for 4xx and 5xx responses and throw with the response
    if (response.statusCode && response.statusCode >= 400) {
        const messageBase = `Received ${response.statusCode} response`;
        const error: Error & {
            response?: IncomingMessage;
            responseJSON?: ResponseJSON;
            responseText?: string;
        } = new Error(messageBase);
        error.response = response;
        error.responseText = data || response.statusMessage;
        if (error.responseText) {
            error.message += ': ' + error.responseText;
        }

        try {
            error.responseJSON = JSON.parse(data) as ResponseJSON;
            const { errors } = error.responseJSON as UnknownGQLResponseJSON;
            if (errors) {
                error.message =
                    `: ${messageBase}` +
                    errors.reduce(
                        (acc: string, error: { message: string } | null) =>
                            acc + acc ? '\n' : '' + error?.message,
                        '',
                    );
            }
        } catch (innerError) {
            // no need for separate inner error handling
        }

        throw error;
    }

    try {
        return JSON.parse(data) as ResponseJSON;
    } catch (error) {
        // If response was a 204 No content or just empty, error is from parsing non-existent JSON
        if (
            response.statusCode === 204 ||
            (response.headers['content-length'] === '0' && response.statusCode === 200)
        ) {
            return {} as ResponseJSON;
        }

        // If error came from JSON parsing, use response.statusText as message and throw
        if (error instanceof SyntaxError && error.message.indexOf('JSON') !== -1) {
            let errorMessage = `Received ${response.statusCode} response`;
            if (response.statusMessage) {
                errorMessage += ': ' + response.statusMessage;
            }
            throw new Error(errorMessage);
        }

        // Else rethrow the error as is
        throw error;
    }
};
