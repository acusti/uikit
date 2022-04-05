import { jest } from '@jest/globals';

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
// @ts-ignore
global.Date = class _Date {
    toISOString() {
        // ISO version of the example DATE_TIME_STRING
        return '2015-08-30T12:36:00.000Z';
    }
};

const mockNodeFetch = jest.fn(async () => ({
    json: async () => RESPONSE_AS_JSON,
}));

jest.unstable_mockModule('node-fetch', () => ({
    default: mockNodeFetch,
}));

const { appsyncFetch } = await import('./index.js');

describe('appsyncFetch', () => {
    const authorizationStart = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/20150830/${REGION}/appsync/aws4_request`;

    it('converts passed in query to a trimmed JSON string body', async () => {
        await appsyncFetch(
            RESOURCE,
            { query: QUERY },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(mockNodeFetch).toHaveBeenCalledTimes(1);

        expect(mockNodeFetch).toHaveBeenCalledWith(RESOURCE, {
            body: QUERY_AS_JSON_STRING,
            headers: {
                Accept: '*/*',
                Authorization: `${authorizationStart}, SignedHeaders=accept;content-type;date;host;x-amz-security-token, Signature=7d0bd4196565fc4e5fff92312c6e27989bee79d2b403cd82296837d7ae1e7e09`,
                'Content-Type': 'application/json; charset=UTF-8',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            },
            method: 'POST',
        });
    });

    it('supports converting both a query and variables to a trimmed JSON string body', async () => {
        await appsyncFetch(
            RESOURCE,
            {
                query: QUERY,
                variables: { userID: '6ac4e0ad-0268-4c5f-a559-92f1f1bf4586' },
            },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(mockNodeFetch).toHaveBeenCalledWith(RESOURCE, {
            body:
                QUERY_AS_JSON_STRING.slice(0, -1) +
                ',"variables":{"userID":"6ac4e0ad-0268-4c5f-a559-92f1f1bf4586"}}',
            headers: {
                Accept: '*/*',
                Authorization: `${authorizationStart}, SignedHeaders=accept;content-type;date;host;x-amz-security-token, Signature=4b0f6d6dcbd0f859a3fddacecb636f591a968841ae99895ca58c9fe3dfb3107b`,
                'Content-Type': 'application/json; charset=UTF-8',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
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

        expect(mockNodeFetch).toHaveBeenCalledWith(RESOURCE, {
            body: QUERY_AS_JSON_STRING,
            headers: {
                Accept: '*/*',
                Authorization: `${authorizationStart}, SignedHeaders=accept;content-type;date;host;x-amz-security-token, Signature=7d0bd4196565fc4e5fff92312c6e27989bee79d2b403cd82296837d7ae1e7e09`,
                'Content-Type': 'application/json; charset=UTF-8',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
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
