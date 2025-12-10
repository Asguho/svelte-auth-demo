import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import type { userTable } from '$lib/server/db/schema';
import { generateTOTP, verifyTOTPWithGracePeriod } from '@oslojs/otp';
import { error } from '@sveltejs/kit';
import { setJwtCookie, verifyAndDecodeJWT } from './jwt';
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

async function decodeJwtFromCookie<T>(name: string) {
	const { cookies } = getRequestEvent();
	const jwt = cookies.get(name);
	if (!jwt) return null;
	try {
		return (await verifyAndDecodeJWT(jwt)) as T;
	} catch {
		return null;
	}
}

export async function decodeVerificationJWTCookie() {
	return decodeJwtFromCookie<{ email: string }>('verification');
}
export async function setVerificationJWTCookie(email: string) {
	await setJwtCookie({
		name: 'verification',
		payload: { email },
		expiration: 60 * 60 * 24 * 30
	});
}


export async function decodeUserJWT() {
	return decodeJwtFromCookie<typeof userTable.$inferSelect>('user-jwt');
}

export async function setUserJWTCookie(user: object) {
	await setJwtCookie({
		name: 'user-jwt',
		payload: { value: user },
		expiration: 60 * 60 * 24 * 7
	});
}

