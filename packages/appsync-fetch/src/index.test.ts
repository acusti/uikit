import { jest } from '@jest/globals';

const REGION = 'us-west-2';
const HOST = `abcdefghijklmnopqrstuvwxyz.appsync-api.${REGION}.amazonaws.com`;
const RESOURCE = `https://${HOST}/graphql`;
const ACCESS_KEY_ID = 'wJalrXUtnFEMI';
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

jest.unstable_mockModule('node-fetch', async () => ({
    default: jest.fn(async () => ({
        json: async () => RESPONSE_AS_JSON,
    })),
}));

const nodeFetch = await import('node-fetch');
const { appSyncFetch } = await import('./index.js');

describe('appSyncFetch', () => {
    const authorizationStart = `AWS4-HMAC-SHA256 Credential=${SECRET_ACCESS_KEY}/20150830/${REGION}/appsync/aws4_request`;

    it('converts passed in query to a trimmed JSON string body', async () => {
        await appSyncFetch(
            RESOURCE,
            { query: QUERY },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(nodeFetch.default).toBeCalledWith(RESOURCE, {
            body: QUERY_AS_JSON_STRING,
            headers: {
                Authorization: `${authorizationStart}, SignedHeaders=content-type;date;host, Signature=e5fbde76d239a74dd590f5afeef2661532d743b7cac789ad4b86072767270b58`,
                'Content-Type': 'application/json',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            },
            method: 'POST',
        });
    });

    it('supports converting both a query and variables to a trimmed JSON string body', async () => {
        await appSyncFetch(
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

        expect(nodeFetch.default).toBeCalledWith(RESOURCE, {
            body:
                QUERY_AS_JSON_STRING.slice(0, -1) +
                ',"variables":{"userID":"6ac4e0ad-0268-4c5f-a559-92f1f1bf4586"}}',
            headers: {
                Authorization: `${authorizationStart}, SignedHeaders=content-type;date;host, Signature=e5fbde76d239a74dd590f5afeef2661532d743b7cac789ad4b86072767270b58`,
                'Content-Type': 'application/json',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            },
            method: 'POST',
        });
    });

    it('supports directly passing the request body as a string', async () => {
        await appSyncFetch(
            RESOURCE,
            { body: QUERY_AS_JSON_STRING },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(nodeFetch.default).toBeCalledWith(RESOURCE, {
            body: QUERY_AS_JSON_STRING,
            headers: {
                Authorization: `${authorizationStart}, SignedHeaders=content-type;date;host, Signature=e5fbde76d239a74dd590f5afeef2661532d743b7cac789ad4b86072767270b58`,
                'Content-Type': 'application/json',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            },
            method: 'POST',
        });

        await appSyncFetch(
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
        const result = await appSyncFetch(
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
