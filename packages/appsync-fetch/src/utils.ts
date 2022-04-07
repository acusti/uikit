import { BinaryToTextEncoding, createHash, createHmac } from 'crypto';
import type { FetchHeaders, FetchOptionsWithBody } from '@acusti/post';

import type { AWSOptions } from './types.js';

const SERVICE = 'appsync';
// @ts-ignore expected type error from this simple browser/node-agnostic check
const REGION: string = typeof process === 'undefined' ? '' : process.env.REGION;

const encrypt = (
    key: string | Uint8Array,
    src: string,
    encoding?: BinaryToTextEncoding,
) => {
    const hmac = createHmac('sha256', key);
    const data = hmac.update(src);
    return encoding ? data.digest(encoding) : data.digest();
};

const getHash = (src: string = '') => {
    const hash = createHash('sha256');
    const data = hash.update(src);
    return data.digest('hex');
};

const getNormalizedHeaders = (headers: FetchHeaders | undefined) => {
    if (!headers) return [];

    return Object.keys(headers)
        .map((key) => ({ key: key.toLowerCase(), value: headers[key] }))
        .sort((a, b) => (a.key < b.key ? -1 : 1));
};

/**
 * @private
 * Create canonical headers
 *
<pre>
CanonicalHeaders =
    CanonicalHeadersEntry0 + CanonicalHeadersEntry1 + ... + CanonicalHeadersEntryN
CanonicalHeadersEntry =
    Lowercase(HeaderName) + ':' + Trimall(HeaderValue) + '\n'
</pre>
 */
const getCanonicalHeaders = (headers: FetchHeaders | undefined) => {
    const normalizedHeaders = getNormalizedHeaders(headers);
    if (!headers || !normalizedHeaders.length) return '';

    return normalizedHeaders.reduce((acc, { key, value }) => {
        value = value ? value.trim().replace(/\s{2,}/g, ' ') : '';
        return acc + key + ':' + value + '\n';
    }, '');
};

/**
 * @private
 * The list of headers that were included in the canonical headers
 * For HTTP/1.1 requests, the host header must be included as a signed header.
 * For HTTP/2 requests that include the :authority header instead of the host header,
 * you must include the :authority header as a signed header. If you include a date or
 * x-amz-date header, you must also include that header in the list of signed headers.
 */
const getSignedHeaders = (headers: FetchHeaders | undefined) =>
    getNormalizedHeaders(headers)
        .map(({ key }) => key)
        .join(';');

/**
 * @private
 * Create a canonical request
 * Refer to {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html|Create a Canonical Request}
 *
<pre>
CanonicalRequest =
    HTTPRequestMethod + '\n' +
    CanonicalURI + '\n' +
    CanonicalQueryString + '\n' +
    CanonicalHeaders + '\n' +
    SignedHeaders + '\n' +
    HexEncode(Hash(RequestPayload))
</pre>
 */
const getCanonicalString = (resource: string, fetchOptions: FetchOptionsWithBody) => {
    const url = new URL(resource);
    // Canonical query string parameter names must be sorted
    url.searchParams.sort();

    return [
        fetchOptions.method,
        url.pathname,
        url.searchParams.toString(),
        getCanonicalHeaders(fetchOptions.headers),
        getSignedHeaders(fetchOptions.headers),
        getHash(fetchOptions.body || ''),
    ].join('\n');
};

const getRegionFromResource = (resource: string) => {
    const { host } = new URL(resource);

    const matched = host.match(/([^.]+)\.(?:([^.]*)\.)?amazonaws\.com$/);
    // The region will be the third subdomain within the URL host
    let region = matched && matched[2];
    return region || '';
};

const getCredentialScope = ({
    dateString,
    region,
    service,
}: {
    dateString: string;
    region: string;
    service: string;
}) => `${dateString}/${region}/${service}/aws4_request`;

/**
 * @private
 * Create a string to sign
 * Refer to {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html|Create String to Sign}
 */
const getStringToSign = ({
    algorithm,
    canonicalString,
    dateTimeString,
    scope,
}: {
    algorithm: string;
    canonicalString: string;
    dateTimeString: string;
    scope: string;
}) => [algorithm, dateTimeString, scope, getHash(canonicalString)].join('\n');

/**
 * @private
 * Create signing key
 * Refer to {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html|Calculate Signature}
 */
const getSigningKey = ({
    dateString,
    region,
    secretAccessKey,
    service,
}: {
    dateString: string;
    region: string;
    secretAccessKey: string;
    service: string;
}) => {
    const key = 'AWS4' + secretAccessKey;
    const keyDate = encrypt(key, dateString);
    const keyRegion = encrypt(keyDate, region);
    const keyService = encrypt(keyRegion, service);
    return encrypt(keyService, 'aws4_request');
};

const getSignature = (signingKey: string | Uint8Array, stringToSign: string) =>
    encrypt(signingKey, stringToSign, 'hex');

/**
 * @private
 * Create authorization headers to include in the HTTP request
 * Refer to {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-add-signature-to-request.html|Add signature to request}
 */
const getAuthorizationHeader = ({
    accessKeyId,
    algorithm,
    scope,
    signature,
    signedHeaders,
}: {
    accessKeyId: string;
    algorithm: string;
    scope: string;
    signature: string | Uint8Array;
    signedHeaders: string;
}) =>
    [
        algorithm + ' Credential=' + accessKeyId + '/' + scope,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + signature,
    ].join(', ');

const getHeadersWithAuthorization = (
    resource: string,
    fetchOptions: FetchOptionsWithBody,
    {
        accessKeyId,
        region = REGION || getRegionFromResource(resource),
        secretAccessKey,
        service = SERVICE,
        sessionToken,
    }: AWSOptions,
) => {
    const date = new Date();
    const dateTimeString = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateString = dateTimeString.substring(0, 8);
    const algorithm = 'AWS4-HMAC-SHA256';

    const { host } = new URL(resource);

    let headers: FetchHeaders = fetchOptions.headers || {};

    headers.accept = '*/*';
    if (!headers['content-type']) {
        headers['content-type'] = 'application/json; charset=UTF-8';
    }
    headers.date = dateTimeString;
    headers.host = host;
    if (sessionToken) {
        headers['x-amz-security-token'] = sessionToken;
    }

    // Ensure there is no redundant authorization or x-amz-date header
    delete headers.authorization;
    delete headers['x-amz-date'];

    const scope = getCredentialScope({ dateString, region, service });
    const signingKey = getSigningKey({ dateString, region, secretAccessKey, service });
    const canonicalString = getCanonicalString(resource, { ...fetchOptions, headers });
    const stringToSign = getStringToSign({
        algorithm,
        canonicalString,
        dateTimeString,
        scope,
    });

    const authorizationHeader = getAuthorizationHeader({
        accessKeyId,
        algorithm,
        scope,
        signature: getSignature(signingKey, stringToSign),
        signedHeaders: getSignedHeaders(headers),
    });

    headers.authorization = authorizationHeader;

    return headers;
};

export {
    getAuthorizationHeader,
    getCanonicalHeaders,
    getCanonicalString,
    getCredentialScope,
    getHeadersWithAuthorization,
    getRegionFromResource,
    getSignature,
    getSignedHeaders,
    getSigningKey,
    getStringToSign,
};
