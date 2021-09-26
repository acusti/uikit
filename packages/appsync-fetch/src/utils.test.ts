import { getHeadersWithAuthorization, getRegionFromResource } from './utils.js';

const REGION = 'us-west-2';
const HOST = `abcdefghijklmnopqrstuvwxyz.appsync-api.${REGION}.amazonaws.com`;
const RESOURCE = `https://${HOST}/graphql`;
const ACCESS_KEY_ID = 'wJalrXUtnFEMI';
const SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
const SESSION_TOKEN = 'thisisafakesessiontoken';

const DATE_TIME_STRING = '20150830T123600Z';
// @ts-ignore
global.Date = class _Date {
    toISOString() {
        // ISO version of the example DATE_TIME_STRING
        return '2015-08-30T12:36:00.000Z';
    }
};

describe('utils', () => {
    describe('getRegionFromResource', () => {
        it('extracts the AWS region from passed in resource URL', () => {
            expect(getRegionFromResource(RESOURCE)).toBe(REGION);
        });
    });

    describe('getHeadersWithAuthorization', () => {
        const authorizationStart = `AWS4-HMAC-SHA256 Credential=${SECRET_ACCESS_KEY}/20150830/${REGION}/appsync/aws4_request`;

        it('adds authorization headers to request headers based on passed in values', () => {
            expect(
                getHeadersWithAuthorization(
                    RESOURCE,
                    { body: '{"query": "query listItems{}"}', method: 'POST' },
                    {
                        accessKeyId: ACCESS_KEY_ID,
                        secretAccessKey: SECRET_ACCESS_KEY,
                        sessionToken: SESSION_TOKEN,
                    },
                ),
            ).toEqual({
                Authorization: `${authorizationStart}, SignedHeaders=content-type;date;host, Signature=92ba632438d73ad88fd51a046857033d6ed5ccd5220b70d241a5d382f583fee3`,
                'Content-Type': 'application/json',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            });
        });

        it('merges authorization headers over top of any existing request headers', () => {
            expect(
                getHeadersWithAuthorization(
                    RESOURCE,
                    {
                        body: '{"query": "query listItems{}"}',
                        headers: {
                            Authorization: 'open sesame',
                            host: 'foo.bar',
                            'Cache-Control': 'only-if-cached',
                        },
                        method: 'POST',
                    },
                    {
                        accessKeyId: ACCESS_KEY_ID,
                        secretAccessKey: SECRET_ACCESS_KEY,
                        sessionToken: SESSION_TOKEN,
                    },
                ),
            ).toEqual({
                'Cache-Control': 'only-if-cached', // host and authorization are overwritten
                Authorization: `${authorizationStart}, SignedHeaders=cache-control;content-type;date;host, Signature=001f381ce1a1bc77637429707359d2ad4c37e3ead3e2215edcf5b158709f0a33`,
                'Content-Type': 'application/json',
                Date: DATE_TIME_STRING,
                Host: HOST,
                'X-Amz-Security-Token': SESSION_TOKEN,
            });
        });
    });
});
