import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const REGION = 'us-west-2';
const HOST = `abcdefghijklmnopqrstuvwxyz.appsync-api.${REGION}.amazonaws.com`;
const RESOURCE = `https://${HOST}/graphql`;
const ACCESS_KEY_ID = 'ASIA1ABCDEF2GHIJKLMO';
const SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
const SESSION_TOKEN = 'thisisafakesessiontoken';

const QUERY = `
    query ListItems($userID: ID) {
        listItems(userID: $userID) {
            items {
                createdAt
                id
            }
        }
    }
`;

const QUERY_AS_JSON_STRING =
    '{"query":"query ListItems($userID: ID) { listItems(userID: $userID) { items { createdAt id } } }"}';

const RESPONSE_AS_JSON = { data: { listItems: { items: [] } } };

const DATE_TIME_STRING = '20150830T123600Z';

const QUERY_ONLY_SIGNATURE =
    '1a978b7ed853f34303cb9ca91f41a18263deacc0b97eda68e208fddeb4a963af';

// eslint-disable-next-line @typescript-eslint/require-await
const mockPost = vi.fn(async () => RESPONSE_AS_JSON);

vi.mock('@acusti/post', async () => {
    const actualPost = await vi.importActual('@acusti/post');
    return { ...actualPost, post: mockPost };
});

const { getBodyFromQuery } = await import('@acusti/post');
const { appsyncFetch } = await import('./index.js');

describe('appsyncFetch', () => {
    const authorizationStart = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/20150830/${REGION}/appsync/aws4_request`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const originalToISOString = Date.prototype.toISOString;

    beforeAll(() => {
        // ISO version of the example DATE_TIME_STRING
        Date.prototype.toISOString = () => '2015-08-30T12:36:00.000Z'; // eslint-disable-line no-extend-native
    });

    afterAll(() => {
        Date.prototype.toISOString = originalToISOString; // eslint-disable-line no-extend-native
    });

    it('converts passed in query to a trimmed JSON string body', async () => {
        const fetchOptions = { query: QUERY };
        const body = getBodyFromQuery(fetchOptions);
        await appsyncFetch(RESOURCE, fetchOptions, {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
            sessionToken: SESSION_TOKEN,
        });

        expect(mockPost).toHaveBeenCalledTimes(1);

        expect(mockPost).toHaveBeenCalledWith(RESOURCE, {
            body: QUERY_AS_JSON_STRING,
            headers: {
                accept: '*/*',
                authorization: `${authorizationStart}, SignedHeaders=accept;content-length;content-type;host;x-amz-date;x-amz-security-token, Signature=${QUERY_ONLY_SIGNATURE}`,
                'content-length': String(body.length),
                'content-type': 'application/json; charset=UTF-8',
                'x-amz-date': DATE_TIME_STRING,
                'x-amz-security-token': SESSION_TOKEN,
            },
            method: 'POST',
        });
    });

    it('supports converting both a query and variables to a trimmed JSON string body', async () => {
        const fetchOptions = {
            query: QUERY,
            variables: { userID: '6ac4e0ad-0268-4c5f-a559-92f1f1bf4586' },
        };
        const body = getBodyFromQuery(fetchOptions);

        await appsyncFetch(RESOURCE, fetchOptions, {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
            sessionToken: SESSION_TOKEN,
        });

        expect(mockPost).toHaveBeenCalledWith(RESOURCE, {
            body,
            headers: {
                accept: '*/*',
                authorization: `${authorizationStart}, SignedHeaders=accept;content-length;content-type;host;x-amz-date;x-amz-security-token, Signature=1c5ce65140d54b043959ca1aba80405d7903ce083307748363657d54d1852dfc`,
                'content-length': String(body.length),
                'content-type': 'application/json; charset=UTF-8',
                'x-amz-date': DATE_TIME_STRING,
                'x-amz-security-token': SESSION_TOKEN,
            },
            method: 'POST',
        });
    });

    it('supports directly passing the request body as a string', async () => {
        await appsyncFetch(
            RESOURCE,
            { body: QUERY_AS_JSON_STRING },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(mockPost).toHaveBeenCalledWith(RESOURCE, {
            body: QUERY_AS_JSON_STRING,
            headers: {
                accept: '*/*',
                authorization: `${authorizationStart}, SignedHeaders=accept;content-length;content-type;host;x-amz-date;x-amz-security-token, Signature=${QUERY_ONLY_SIGNATURE}`,
                'content-length': String(QUERY_AS_JSON_STRING.length),
                'content-type': 'application/json; charset=UTF-8',
                'x-amz-date': DATE_TIME_STRING,
                'x-amz-security-token': SESSION_TOKEN,
            },
            method: 'POST',
        });

        await appsyncFetch(
            RESOURCE,
            // @ts-expect-error you can only pass a body OR a query, never both
            { body: QUERY_AS_JSON_STRING, query: QUERY },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );
    });

    it('directly returns the resolved result of calling response.json()', async () => {
        const result = await appsyncFetch(
            RESOURCE,
            { query: QUERY },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(result).toEqual(RESPONSE_AS_JSON);
    });
});
