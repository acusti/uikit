import {
    getCanonicalRequest,
    getHeadersWithAuthorization,
    getRegionFromResource,
} from './utils.js';

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

    describe('getCanonicalRequest', () => {
        it('builds an AWS SigV4 canonical request string from request object', () => {
            // Example request from docs
            const requestURL =
                'https://iam.amazonaws.com/?Action=ListUsers&Version=2010-05-08';
            const fetchOptions = {
                body: '',
                method: 'GET',
                headers: {
                    Host: 'iam.amazonaws.com',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'X-Amz-Date': DATE_TIME_STRING,
                },
            };

            const canonicalRequest = `GET
/
Action=ListUsers&Version=2010-05-08
content-type:application/x-www-form-urlencoded; charset=utf-8
host:iam.amazonaws.com
x-amz-date:${DATE_TIME_STRING}

content-type;host;x-amz-date
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`;

            expect(getCanonicalRequest(requestURL, fetchOptions)).toBe(canonicalRequest);
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
