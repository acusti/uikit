import { getHeadersWithAuthorization } from '@acusti/aws-signature-v4';
import type { AWSOptions } from '@acusti/aws-signature-v4';
import { getRequestOptionsAndBody, post } from '@acusti/post';
import type { FetchOptions, FetchOptionsWithBody } from '@acusti/post';

// Reference: https://docs.aws.amazon.com/appsync/latest/devguide/troubleshooting-and-common-mistakes.html
export type GraphQLResponseError = {
    errorType: string;
    locations: Array<{ column: number; line: number }>;
    message: string;
    path: Array<string>;
};

const ENV_KEY = 'AWS_ACCESS_KEY_ID';
const ENV_SECRET = 'AWS_SECRET_ACCESS_KEY';
const ENV_SESSION = 'AWS_SESSION_TOKEN';
const ENV_EXPIRATION = 'AWS_CREDENTIAL_EXPIRATION';

const appsyncFetch = async <Result>(
    resource: string,
    fetchOptions: FetchOptions,
    awsOptions: Partial<AWSOptions> = {},
): Promise<{ data?: Result; errors?: Array<GraphQLResponseError> }> => {
    type ResponseJSON = { data?: Result; errors?: Array<GraphQLResponseError> };

    const { body, requestOptions } = getRequestOptionsAndBody(fetchOptions);
    const request = { ...requestOptions, body };

    if (awsOptions.accessKeyId == null && typeof process !== 'undefined') {
        // BEGIN https://github.com/aws/aws-sdk-js-v3/blob/main/packages/credential-provider-env/src/fromEnv.ts
        const accessKeyId: string | undefined = process.env[ENV_KEY];
        const secretAccessKey: string | undefined = process.env[ENV_SECRET];
        const sessionToken: string | undefined = process.env[ENV_SESSION];
        const expiry: string | undefined = process.env[ENV_EXPIRATION];
        const credentials =
            accessKeyId && secretAccessKey
                ? {
                      accessKeyId,
                      secretAccessKey,
                      ...(sessionToken && { sessionToken }),
                      ...(expiry && { expiration: new Date(expiry) }),
                  }
                : { accessKeyId: '', secretAccessKey: '' };
        // END https://github.com/aws/aws-sdk-js-v3/blob/main/packages/credential-provider-env/src/fromEnv.ts
        const _awsOptions: AWSOptions = { ...awsOptions, ...credentials };
        awsOptions = _awsOptions;
    }

    request.headers = await getHeadersWithAuthorization(
        resource,
        request as FetchOptionsWithBody,
        awsOptions as AWSOptions,
    );

    return await post<ResponseJSON>(resource, request);
};

export { appsyncFetch, getHeadersWithAuthorization };
