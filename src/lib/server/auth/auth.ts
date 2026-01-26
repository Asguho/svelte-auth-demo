import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { AUTH_SECRET } from '$env/static/private';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';
import { RateLimiter } from './rateLimiter';

const FIVE_MINUTES = 5 * 60;

const secret = Buffer.from(AUTH_SECRET, 'base64');
const rateLimiter = new RateLimiter(10, 1000 * 60 * 15); // 10 attemps every 15 minutes

function sendEmail(otpCode: string, email: string) {
	if (dev) {
		console.log(`Sending ${otpCode} to ${email}`);
	} else {
		//!TODO
		error(500, 'NOT IMPLEMENTED');
	}
}

export function sendOTPCode(email: string) {
	rateLimiter.check(getRequestEvent().getClientAddress());

	const otp = generateTOTP(Buffer.concat([secret, Buffer.from(email)]), FIVE_MINUTES, 6);
	sendEmail(otp, email);
}

export function verifyOTP(otp: number, email: string) {
	rateLimiter.check(getRequestEvent().getClientAddress());

	return verifyTOTPWithGracePeriod(
		Buffer.concat([secret, Buffer.from(email)]),
		FIVE_MINUTES,
		6,
		otp.toString(),
		FIVE_MINUTES
	);
}

export function deleteAuthCookies() {
	const { cookies } = getRequestEvent();
	cookies.delete('user', {
		path: '/'
	});
	cookies.delete('refresh', {
		path: '/'
	});
}
