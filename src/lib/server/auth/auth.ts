import { dev } from '$app/env';
import { getRequestEvent } from '$app/server';
import { AUTH_SECRET } from '$app/env/private';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';
import { verifyEmailToken } from 'email-verification-api';
import { createJwtCookieAccessors } from './jwt';
import { RateLimiter } from './rateLimiter';

const FIVE_MINUTES = 5 * 60;
const TEN_MINUTES = 10 * 60;
const NONCE_COOKIE = 'evp-nonce';

const secret = Uint8Array.fromBase64(AUTH_SECRET);
const rateLimiter = new RateLimiter(10, 1000 * 60 * 15); // 10 attemps every 15 minutes
const [getNonceFromCookie, setNonceCookie] = createJwtCookieAccessors<{ nonce: string }>(
	NONCE_COOKIE
);

function otpKey(email: string) {
	return new Uint8Array([...secret, ...new TextEncoder().encode(email)]);
}

async function sendEmail(otpCode: string, email: string) {
	if (dev) {
		console.log(`Sending ${otpCode} to ${email}`);
	} else {
		//!TODO
		error(500, 'NO EMAIL SENDING IMPLEMENTED');
	}
}

export async function sendOTPCode(email: string) {
	rateLimiter.check(getRequestEvent().getClientAddress());
	rateLimiter.check(email);

	const otp = generateTOTP(otpKey(email), FIVE_MINUTES, 6);
	await sendEmail(otp, email);
}

export function verifyOTP(otp: number, email: string) {
	rateLimiter.check(getRequestEvent().getClientAddress());
	rateLimiter.check(email);

	return verifyTOTPWithGracePeriod(otpKey(email), FIVE_MINUTES, 6, otp.toString(), FIVE_MINUTES);
}

export async function createEmailVerificationNonce() {
	const nonce = crypto.randomUUID();
	await setNonceCookie({ payload: { nonce }, expiration: TEN_MINUTES });
	return nonce;
}

export async function verifyEmailVerificationToken(email: string, token: string) {
	const { cookies, url, getClientAddress } = getRequestEvent();
	rateLimiter.check(getClientAddress());

	const payload = await getNonceFromCookie();
	cookies.delete(NONCE_COOKIE, { path: '/' });
	if (!payload) return false;

	const result = await verifyEmailToken({
		email,
		token,
		nonce: payload.nonce,
		audience: url.origin,
		timeoutMs: 5_000
	});
	if (!result.ok) console.warn('Email verification token rejected:', result.error);
	return result.ok;
}

export function deleteAuthCookies() {
	const { cookies } = getRequestEvent();
	cookies.delete('user', {
		path: '/'
	});
	cookies.delete('session', {
		path: '/'
	});
}
