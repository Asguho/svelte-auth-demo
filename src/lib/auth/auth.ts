import { dev } from '$app/environment';
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

const secret = crypto.randomBytes(32);
const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, [
	'sign'
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

export async function getVerificationJWT(email: string) {
	const headerJSON = JSON.stringify({
		alg: joseAlgorithmHS256,
		typ: 'JWT'
	});
	const payloadJSON = JSON.stringify({
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
		email: email
	});
	const signatureBuffer = await crypto.subtle.sign(
		'HMAC',
		key,
		createJWTSignatureMessage(headerJSON, payloadJSON)
	);
	const jwt = encodeJWT(headerJSON, payloadJSON, new Uint8Array(signatureBuffer));
	return jwt;
}

export async function getEmailFromVerificationJWT(jwt: string) {
	const [header, payload, signature, signatureMessage] = parseJWT(jwt);
	const headerParameters = new JWSRegisteredHeaders(header);
	if (headerParameters.algorithm() !== joseAlgorithmHS256) {
		throw new Error('Unsupported algorithm');
	}
	const validSignature = await crypto.subtle.verify('HMAC', key, signature, signatureMessage);
	if (!validSignature) throw new Error('Invalid signature');

	const claims = new JWTRegisteredClaims(payload);
	if (claims.hasExpiration() && !claims.verifyExpiration()) throw new Error('Expired token');

	if (claims.hasNotBefore() && !claims.verifyNotBefore()) throw new Error('Token not valid yet');
}
