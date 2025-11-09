import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { AUTH_SECRET } from '$env/static/private';
import type { userTable } from '$lib/server/db/schema';
import {
	createJWTSignatureMessage,
	encodeJWT,
	joseAlgorithmHS256,
	JWSRegisteredHeaders,
	JWTRegisteredClaims,
	parseJWT
} from '@oslojs/jwt';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';
import crypto from 'node:crypto';

const secret = Buffer.from(AUTH_SECRET, "base64");
const key = await crypto.webcrypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [
	'sign', 'verify'
]);

console.log(secret.toString('base64'));

export function sendOTPCode(email: string) {
	const otp = generateTOTP(secret, 30, 6);
	if (dev) {
		console.log(`Sending ${otp} to ${email}`);
	} else {
		//!TODO
		throw error(500, 'NOT IMPLEMENTED');
	}
}
export function verifyOTP(otp: number) {
	return verifyTOTPWithGracePeriod(secret, 30, 6, otp.toString(), 60);
}

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



// helpers
interface VerificationJWTPayload {
    email: string
}
export async function getEmailFromVerificationJWT(verificationJWT:string){
    const payload  = await verifyAndDecodeJWT(verificationJWT) as VerificationJWTPayload
    return payload.email
}
export async function setVerificationJWTCookie(email: string) {
	const { cookies } = getRequestEvent();

	const jwt = await getJWT({ email }, 60 * 60 * 24 * 30);

	cookies.set('verification', jwt, {
		path: '/',
	});
}
export async function extractEmailFromVerificationJWTCookie() {
	const { cookies } = getRequestEvent();
	const verificationJWT = cookies.get("verification")
	if(!verificationJWT) error(500, "No verification cookie present. Use the same browser for the hole auth flow")
	const email = await getEmailFromVerificationJWT(verificationJWT)
	return email
}
type User = typeof userTable.$inferSelect;
export async function decodeUserJWT(userJWT: string) {
	return ((await verifyAndDecodeJWT(userJWT)) as any).value as User;
}

