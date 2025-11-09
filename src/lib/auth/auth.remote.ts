import { resolve } from '$app/paths';
import { form, getRequestEvent, query } from '$app/server';
import { getOrCreateUser } from '$lib/server/db/queries';
import { error, redirect, type Cookies } from '@sveltejs/kit';
import * as v from 'valibot';
import {
	extractEmailFromVerificationJWTCookie,
	getJWT,
	sendOTPCode,
	setVerificationJWTCookie,
	verifyAndDecodeJWT,
	verifyOTP
} from './auth';
import { ResultAsync } from 'neverthrow';
import { userTable } from '$lib/server/db/schema';


export const loginWithEmail = form(
	v.object({ email: v.pipe(v.string(), v.email()) }),
	async ({ email }) => {
		await sendOTPCode(email);
		
		await setVerificationJWTCookie(email);
		
		redirect(302, resolve('/opt'));
	}
);

export const verifyOTPForm = form(v.object({ otp: v.number() }), async ({ otp }) => {
	if (verifyOTP(otp)) {
		const email = await extractEmailFromVerificationJWTCookie();
		
		const user = await getOrCreateUser(email);
		if(user.isErr()){
			error(500, user.error)
		}
		
		const { cookies } = getRequestEvent();
		const userJWT = await getJWT(user, 60 * 60 * 24 * 7);
		cookies.set('user-jwt', userJWT, {
			path: '/'
		});
		redirect(302, resolve("/"))
	}
});

type User = typeof userTable.$inferSelect;

export const getUser = query(async () => {
	const { cookies } = getRequestEvent();
	const userJWT = cookies.get('user-jwt');
	if(!userJWT) return null;
	
	const user = await decodeUserJWT(userJWT);
	return user;
});

async function decodeUserJWT(userJWT: string) {
	return ((await verifyAndDecodeJWT(userJWT)) as any).value as User;
}

