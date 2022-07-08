const globalObject = typeof self !== 'undefined' ? self : window;

export default globalObject.crypto;
