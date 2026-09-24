import { createEmailVerificationNonce } from '#lib/server/auth/auth.js';

export const load = async () => ({ nonce: await createEmailVerificationNonce() });
