import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import type { userTable } from '$lib/server/db/schema';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';
import { decodeJwtFromCookie, setJwtCookie } from './jwt';
import { AUTH_SECRET } from '$env/static/private';

const secret = Buffer.from(AUTH_SECRET, "base64");

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




