import { joseAlgorithmHS256, createJWTSignatureMessage, encodeJWT, JWSRegisteredHeaders, JWTRegisteredClaims, parseJWT } from '@oslojs/jwt';
import crypto from 'node:crypto';
import { AUTH_SECRET } from '$env/static/private';
import { getRequestEvent } from '$app/server';

const secret = Buffer.from(AUTH_SECRET, "base64");

const key = await crypto.webcrypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign', 'verify'
]);

export async function getJWT(payload: object, expiration: number) {
    const headerJSON = JSON.stringify({
        alg: joseAlgorithmHS256,
        typ: 'JWT'
    });
    const payloadJSON = JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + expiration,
        ...payload
    });
    const signatureBuffer = await crypto.webcrypto.subtle.sign(
        'HMAC',
        key,
        createJWTSignatureMessage(headerJSON, payloadJSON)
    );
    const jwt = encodeJWT(headerJSON, payloadJSON, new Uint8Array(signatureBuffer));
    return jwt;
}

export async function verifyAndDecodeJWT(jwt: string) {
    const [header, payload, signature, signatureMessage] = parseJWT(jwt);
    const headerParameters = new JWSRegisteredHeaders(header);
    if (headerParameters.algorithm() !== joseAlgorithmHS256) {
        throw new Error('Unsupported algorithm');
    }
    const validSignature = await crypto.webcrypto.subtle.verify('HMAC', key, signature, signatureMessage);
    if (!validSignature) throw new Error('Invalid signature');

    const claims = new JWTRegisteredClaims(payload);
    if (claims.hasExpiration() && !claims.verifyExpiration()) throw new Error('Expired token');
    if (claims.hasNotBefore() && !claims.verifyNotBefore()) throw new Error('Token not valid yet');

    return payload;
}
export async function setJwtCookie({ name, payload, expiration }: { name: string; payload: object; expiration: number; }) {
    const { cookies } = getRequestEvent();

    const jwt = await getJWT(payload, expiration);

    cookies.set(name, jwt, {
        path: '/'
    });
}
export async function decodeJwtFromCookie<T>(name: string) {
    const { cookies } = getRequestEvent();
    const jwt = cookies.get(name);
    if (!jwt) return null;
    try {
        return (await verifyAndDecodeJWT(jwt)) as T;
    } catch {
        return null;
    }
}

