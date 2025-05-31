---
'@acusti/aws-signature-v4': major
---

Updated engines to require node v20+ and updated the use of webcrypto from
depending on @acusti/webcrypto (which exposed the built-in webcrypto
differently depending on the runtime) to the built-in globalThis.crypto
module.

**Note:** this is only a breaking change because previous versions of the
package were compatible with node v18, whereas this new version requires
v19 or higher. The API contract and usage is unchanged.
