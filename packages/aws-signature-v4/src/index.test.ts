import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
    getCanonicalString,
    getHeadersWithAuthorization,
    getRegionFromResource,
} from './index.js';

export {}; // empty export to make this file a module

const REGION = 'us-west-2';
const HOST = `abcdefghijklmnopqrstuvwxyz.appsync-api.${REGION}.amazonaws.com`;
const RESOURCE = `https://${HOST}/graphql`;
const ACCESS_KEY_ID = 'ASIA1ABCDEF2GHIJKLMO';
const SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY';
const SESSION_TOKEN = 'thisisafakesessiontoken';

const DATE_TIME_STRING = '20150830T123600Z';

describe('utils', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const originalToISOString = Date.prototype.toISOString;

    beforeAll(() => {
        // ISO version of the example DATE_TIME_STRING
        Date.prototype.toISOString = () => '2015-08-30T12:36:00.000Z'; // eslint-disable-line no-extend-native
    });

    afterAll(() => {
        // eslint-disable-next-line no-extend-native, @typescript-eslint/no-unsafe-assignment
        Date.prototype.toISOString = originalToISOString;
    });

    describe('getRegionFromResource', () => {
        it('extracts the AWS region from passed in resource URL', () => {
            expect(getRegionFromResource(RESOURCE)).toBe(REGION);
        });
    });

    describe('getCanonicalString', () => {
        it('builds an AWS SigV4 canonical request string from request object', async () => {
            // Example request from docs
            const requestURL =
                'https://iam.amazonaws.com/?Action=ListUsers&Version=2010-05-08';
            const fetchOptions = {
                body: '',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
                    host: 'iam.amazonaws.com',
                    'x-amz-date': DATE_TIME_STRING,
                },
                method: 'GET',
            };

            const canonicalString = `GET
/
Action=ListUsers&Version=2010-05-08
content-type:application/x-www-form-urlencoded; charset=utf-8
host:iam.amazonaws.com
x-amz-date:${DATE_TIME_STRING}

content-type;host;x-amz-date
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;

            expect(await getCanonicalString(requestURL, fetchOptions)).toBe(
                canonicalString,
            );
        });
    });

    describe('getHeadersWithAuthorization', () => {
        const authorizationStart = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/20150830/${REGION}/appsync/aws4_request`;

        it('adds authorization headers to request headers based on passed in values', async () => {
            expect(
                await getHeadersWithAuthorization(
                    RESOURCE,
                    { body: '{"query": "query listItems{}"}', method: 'POST' },
                    {
                        accessKeyId: ACCESS_KEY_ID,
                        secretAccessKey: SECRET_ACCESS_KEY,
                        sessionToken: SESSION_TOKEN,
                    },
                ),
            ).toEqual({
                accept: '*/*',
                authorization: `${authorizationStart}, SignedHeaders=accept;content-type;host;x-amz-date;x-amz-security-token, Signature=13e3c68981d700f280432ea4f869407f3c26599fde3581a3f3b8684b9b178ccb`,
                'content-type': 'application/json; charset=UTF-8',
                'x-amz-date': DATE_TIME_STRING,
                'x-amz-security-token': SESSION_TOKEN,
            });
        });

        it('merges authorization headers over top of any existing request headers', async () => {
            expect(
                await getHeadersWithAuthorization(
                    RESOURCE,
                    {
                        body: '{"query": "query listItems{}"}',
                        headers: {
                            authorization: 'open sesame',
                            'cache-control': 'only-if-cached',
                            host: 'foo.bar',
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
                accept: '*/*',
                authorization: `${authorizationStart}, SignedHeaders=accept;cache-control;content-type;host;x-amz-date;x-amz-security-token, Signature=b54bda159a3da79539e690db3aff77f143575056b79f131d55fb122b4185bfda`,
                'cache-control': 'only-if-cached', // host and authorization are overwritten
                'content-type': 'application/json; charset=UTF-8',
                'x-amz-date': DATE_TIME_STRING,
                'x-amz-security-token': SESSION_TOKEN,
            });
        });
    });
});
