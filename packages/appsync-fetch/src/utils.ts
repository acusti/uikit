import sha256 from '@aws-crypto/sha256-js';
import { toHex } from '@aws-sdk/util-hex-encoding';

import { AWSOptions, FetchHeaders, FetchOptionsWithBody } from './types.js';

const SERVICE = 'appsync';
// @ts-ignore expected type error from this simple browser/node-agnostic check
const REGION: string = typeof process === 'undefined' ? '' : process.env.REGION;

const { Sha256 } = sha256;

const encrypt = (key: string | Uint8Array, src: string, encoding: string = '') => {
    const hash = new Sha256(key);
    hash.update(src);
    const result = hash.digestSync();
    if (encoding === 'hex') {
        return toHex(result);
    }
    return result;
};

const getHash = (src: string) => {
    const arg = src || '';
    const hash = new Sha256();
    hash.update(arg);
    return toHex(hash.digestSync());
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
    if (!headers) return '';
    const headerKeys = Object.keys(headers);
    if (!headerKeys.length) return '';

    return (
        headerKeys
            .map((key) => ({
                key: key.toLowerCase(),
                value: headers[key] ? headers[key].trim().replace(/\s+/g, ' ') : '',
            }))
            .sort((a, b) => (a.key < b.key ? -1 : 1))
            .map((item) => item.key + ':' + item.value)
            .join('\n') + '\n'
    );
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
    Object.keys(headers || {})
        .map((key) => key.toLowerCase())
        .sort()
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
const getCanonicalRequest = (resource: string, fetchOptions: FetchOptionsWithBody) => {
    const url = new URL(resource);

    return [
        fetchOptions.method,
        url.pathname,
        url.search,
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
    canonicalRequest,
    dateTimeString,
    scope,
}: {
    algorithm: string;
    canonicalRequest: string;
    dateTimeString: string;
    scope: string;
}) => [algorithm, dateTimeString, scope, getHash(canonicalRequest)].join('\n');

/**
 * @private
 * Create signing key
 * Refer to {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html|Calculate Signature}
 */
const getSigningKey = ({
    accessKeyId = '',
    dateString,
    region,
    service,
}: {
    accessKeyId?: string;
    dateString: string;
    region: string;
    service: string;
}) => {
    const key = 'AWS4' + accessKeyId;
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
    algorithm,
    scope,
    secretAccessKey,
    signature,
    signedHeaders,
}: {
    algorithm: string;
    scope: string;
    secretAccessKey: string;
    signature: string | Uint8Array;
    signedHeaders: string;
}) =>
    [
        algorithm + ' Credential=' + secretAccessKey + '/' + scope,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + signature,
    ].join(', ');

const getHeadersWithAuthorization = (
    resource: string,
    fetchOptions: FetchOptionsWithBody,
    {
        accessKeyId,
        secretAccessKey,
        region = REGION || getRegionFromResource(resource),
        service = SERVICE,
        sessionToken,
    }: AWSOptions,
) => {
    const date = new Date();
    const dateTimeString = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateString = dateTimeString.substr(0, 8);
    const algorithm = 'AWS4-HMAC-SHA256';

    const { host } = new URL(resource);

    let headers: FetchHeaders = fetchOptions.headers || {};

    headers['Content-Type'] = 'application/json';
    headers.Date = dateTimeString;
    headers.Host = host;

    delete headers.authorization;
    delete headers.Authorization;
    delete headers.date;
    delete headers.host;
    delete headers['content-type'];
    delete headers['x-amz-date'];
    delete headers['X-Amz-Date'];
    delete headers['x-amz-security-token'];
    delete headers['X-Amz-Security-Token'];

    const scope = getCredentialScope({ dateString, region, service });
    const signingKey = getSigningKey({ accessKeyId, dateString, region, service });
    const canonicalRequest = getCanonicalRequest(resource, { ...fetchOptions, headers });
    const stringToSign = getStringToSign({
        algorithm,
        canonicalRequest,
        dateTimeString,
        scope,
    });

    const authorizationHeader = getAuthorizationHeader({
        algorithm,
        secretAccessKey,
        scope,
        signature: getSignature(signingKey, stringToSign),
        signedHeaders: getSignedHeaders(headers),
    });

    headers['Authorization'] = authorizationHeader;
    if (sessionToken) {
        headers['X-Amz-Security-Token'] = sessionToken;
    }

    return headers;
};

export {
    getAuthorizationHeader,
    getCanonicalHeaders,
    getCanonicalRequest,
    getCredentialScope,
    getHeadersWithAuthorization,
    getRegionFromResource,
    getSignature,
    getSignedHeaders,
    getSigningKey,
    getStringToSign,
};
