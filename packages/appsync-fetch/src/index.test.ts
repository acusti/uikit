import { jest } from '@jest/globals';
jest.mock('node-fetch');
import fetch from 'node-fetch';

import { appSyncFetch } from './index.js';

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

const DATE_TIME_STRING = '20150830T123600Z';
// @ts-ignore
global.Date = class _Date {
    toISOString() {
        // ISO version of the example DATE_TIME_STRING
        return '2015-08-30T12:36:00.000Z';
    }
};

describe.skip('appSyncFetch', () => {
    const authorizationStart = `AWS4-HMAC-SHA256 Credential=${SECRET_ACCESS_KEY}/20150830/${REGION}/appsync/aws4_request`;

    it('converts passed in query to a trimmed JSON string body', async () => {
        // @ts-ignore
        fetch.mockReturnValue(
            Promise.resolve({
                json: () => ({ data: { listItems: { items: [] } } }),
            }),
        );

        await appSyncFetch(
            RESOURCE,
            { query: QUERY },
            {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
                sessionToken: SESSION_TOKEN,
            },
        );

        expect(fetch).toBeCalledWith(RESOURCE, {
            body:
                '{"query": "query ListItems($userID: ID) { listItems(userID: $userID) { items { createdAt id } } }',
            headers: {
                Authorization: `${authorizationStart}, SignedHeaders=content-type;date;host, Signature=f8987bee7755e6dccc74025fa432286a48784bdf0d2cc74588108e6dc14ab348`,
                'Content-Type': 'application/json',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            },
        });
        // Set up mocks to check how it calls fetch
        // expect(response).toBe(REGION);
    });
});
