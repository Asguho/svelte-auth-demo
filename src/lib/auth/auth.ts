import { dev } from '$app/environment';
import { AUTH_SECRET } from '$env/static/private';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';

const secret = Buffer.from(AUTH_SECRET, 'base64');

export function sendOTPCode(email: string) {
	const otp = generateTOTP(secret, 30, 6);
	if (dev) {
		console.log(`Sending ${otp} to ${email}`);
	} else {
		//!TODO
		error(500, 'NOT IMPLEMENTED');
	}
}
export function verifyOTP(otp: number) {
	return verifyTOTPWithGracePeriod(secret, 30, 6, otp.toString(), 60);
}
