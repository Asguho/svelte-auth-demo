import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { AUTH_SECRET } from '$env/static/private';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';

const secret = Buffer.from(AUTH_SECRET, 'base64');
const FIVE_MINUTES = 5 * 60;

export function sendOTPCode(email: string) {
	const otp = generateTOTP(Buffer.concat([secret, Buffer.from(email)]), FIVE_MINUTES, 6);
	if (dev) {
		console.log(`Sending ${otp} to ${email}`);
	} else {
		//!TODO
		error(500, 'NOT IMPLEMENTED');
	}
}
export function verifyOTP(otp: number, email: string) {
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
