import crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const webcrypto: Crypto = crypto.webcrypto as any;

export default webcrypto;
