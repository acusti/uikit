import webcrypto from '@acusti/webcrypto';

import type { AWSOptions as _AWSOptions, FetchHeaders, FetchOptions } from './types.js';

export type AWSOptions = _AWSOptions;

type FetchOptionsWithHeaders = Omit<FetchOptions, 'headers'> & {
    headers: FetchHeaders;
};

const universalBtoa = (text: string) => {
    try {
        return btoa(text);
    } catch (err) {
        return Buffer.from(text).toString('base64');
    }
};

const subtleCrypto = webcrypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const DEFAULT_ALGORITHM = 'SHA-256';
const DEFAULT_SERVICE = 'appsync';
// @ts-expect-error expected type error from this simple browser/node-agnostic check
const REGION: string = typeof process === 'undefined' ? '' : process.env.REGION;

const decodeArrayBuffer = (buffer: ArrayBuffer, encoding: string) => {
    const uint8Array = new Uint8Array(buffer);
    switch (encoding) {
        case 'base64':
            return universalBtoa(String.fromCharCode(...uint8Array));
        case 'hex':
            // https://stackoverflow.com/a/70790307/333625
            return uint8Array.reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
        default:
            return decoder.decode(uint8Array);
    }
};

const encrypt = async (payload: {
    algorithm?: string;
    data: string;
    encoding?: string;
    key: string | Uint8Array;
}) => {
    const keyArray =
        typeof payload.key === 'string' ? encoder.encode(payload.key) : payload.key;
    const algorithm = { hash: payload.algorithm ?? DEFAULT_ALGORITHM, name: 'HMAC' };
    const key = await subtleCrypto.importKey('raw', keyArray, algorithm, false, ['sign']);
    const signature = await subtleCrypto.sign('hmac', key, encoder.encode(payload.data));
    if (!payload.encoding) return new Uint8Array(signature);
    return decodeArrayBuffer(signature, payload.encoding);
};

const hash = async ({
    algorithm = DEFAULT_ALGORITHM,
    data,
    encoding,
}: {
    algorithm?: string;
    data: string;
    encoding: string;
}) => {
    const _hash = await subtleCrypto.digest({ name: algorithm }, encoder.encode(data));
    return decodeArrayBuffer(_hash, encoding);
};

const getNormalizedHeaders = (headers: FetchHeaders) =>
    Object.keys(headers)
        .map((key) => ({ key: key.toLowerCase(), value: headers[key] }))
        .sort((a, b) => (a.key < b.key ? -1 : 1));

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
const getCanonicalHeaders = (headers: FetchHeaders) => {
    const normalizedHeaders = getNormalizedHeaders(headers);
    if (!normalizedHeaders.length) return '';

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
const getSignedHeaders = (headers: FetchHeaders) =>
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
const getCanonicalString = async (
    resource: string,
    fetchOptions: FetchOptionsWithHeaders,
) => {
    const url = new URL(resource);
    // Canonical query string parameter names must be sorted
    url.searchParams.sort();
    let bodyHash = '';
    if (fetchOptions.headers['x-amz-content-sha256'] === 'UNSIGNED-PAYLOAD') {
        bodyHash = 'UNSIGNED-PAYLOAD';
    } else {
        // If this is *not* an unsigned payload, than sign it with a hexencoded hash
        const body = typeof fetchOptions.body === 'string' ? fetchOptions.body : '';
        bodyHash = await hash({ data: body, encoding: 'hex' });
    }

    return [
        fetchOptions.method,
        url.pathname,
        url.searchParams.toString(),
        getCanonicalHeaders(fetchOptions.headers),
        getSignedHeaders(fetchOptions.headers),
        bodyHash,
    ].join('\n');
};

const getRegionFromResource = (resource: string) => {
    const { host } = new URL(resource);

    const matched = host.match(/([^.]+)\.(?:([^.]*)\.)?amazonaws\.com$/);
    // The region will be the third subdomain within the URL host
    const region = matched && matched[2];
    return region ?? '';
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
const getStringToSign = async ({
    algorithm,
    canonicalString,
    dateTimeString,
    scope,
}: {
    algorithm: string;
    canonicalString: string;
    dateTimeString: string;
    scope: string;
}) =>
    [
        algorithm,
        dateTimeString,
        scope,
        await hash({ data: canonicalString, encoding: 'hex' }),
    ].join('\n');

/**
 * @private
 * Create signing key
 * Refer to {@link http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html|Calculate Signature}
 */
const getSigningKey = async ({
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
    const keyDate = await encrypt({ data: dateString, key });
    const keyRegion = await encrypt({ data: region, key: keyDate });
    const keyService = await encrypt({ data: service, key: keyRegion });
    return await encrypt({ data: 'aws4_request', key: keyService });
};

const getSignature = async (signingKey: string | Uint8Array, stringToSign: string) =>
    (await encrypt({ data: stringToSign, encoding: 'hex', key: signingKey })) as string;

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
    signature: string;
    signedHeaders: string;
}) =>
    [
        algorithm + ' Credential=' + accessKeyId + '/' + scope,
        'SignedHeaders=' + signedHeaders,
        'Signature=' + signature,
    ].join(', ');

const getHeadersWithAuthorization = async (
    resource: string,
    fetchOptions: FetchOptions,
    {
        accessKeyId,
        region = REGION || getRegionFromResource(resource),
        secretAccessKey,
        service = DEFAULT_SERVICE,
        sessionToken,
    }: AWSOptions,
) => {
    const date = new Date();
    const dateTimeString = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateString = dateTimeString.substring(0, 8);
    const algorithm = 'AWS4-HMAC-SHA256';

    const { host } = new URL(resource);

    const headers: FetchHeaders = fetchOptions.headers ?? {};

    headers.host = host;
    headers['x-amz-date'] = dateTimeString;

    if (!headers.accept) {
        headers.accept = '*/*';
    }

    if (!headers['content-type']) {
        headers['content-type'] = 'application/json; charset=UTF-8';
    }

    if (sessionToken) {
        headers['x-amz-security-token'] = sessionToken;
    }

    if (typeof fetchOptions.body !== 'string') {
        headers['x-amz-content-sha256'] = 'UNSIGNED-PAYLOAD';
    }

    // Ensure there is no redundant authorization or date header
    delete headers.authorization;
    delete headers.date;

    const scope = getCredentialScope({ dateString, region, service });
    const signingKey = await getSigningKey({
        dateString,
        region,
        secretAccessKey,
        service,
    });
    const canonicalString = await getCanonicalString(resource, {
        ...fetchOptions,
        headers,
    });
    const stringToSign = await getStringToSign({
        algorithm,
        canonicalString,
        dateTimeString,
        scope,
    });

    headers.authorization = getAuthorizationHeader({
        accessKeyId,
        algorithm,
        scope,
        signature: await getSignature(signingKey, stringToSign),
        signedHeaders: getSignedHeaders(headers),
    });

    // Need to use host to sign, but don’t return it (it’s a forbidden header name)
    delete headers.host;

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
