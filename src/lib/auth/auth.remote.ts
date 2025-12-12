import { resolve } from '$app/paths';
import { form, getRequestEvent, query } from '$app/server';
import type { userTable } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { decodeJwtFromCookie, setJwtCookie } from './jwt';
import { sendOTPCode, verifyOTP } from './auth';
import { createUser, getUserByEmail } from '$lib/server/db/queries';

export const loginWithEmail = form(
	v.object({ email: v.pipe(v.string(), v.email()) }),
	async ({ email }) => {
		await sendOTPCode(email);

		await setJwtCookie({
			name: 'verification',
			payload: { email },
			expiration: 60 * 5 // 5 minutes
		});

		redirect(302, resolve('/otp'));
	}
);

export const verifyOTPForm = form(v.object({ otp: v.number() }), async ({ otp }) => {
	if (!verifyOTP(otp)) {
		fail(400, { message: 'OTP not valid. Try resending it' });
	}

	const payload = await decodeJwtFromCookie<{ email: string }>('verification');
	if (!payload) redirect(302, resolve('/login'));
	const { email } = payload;

	let user = await getUserByEmail(email);
	if (!user) {
		const userResult = await createUser({ email });
		user = userResult.match(
			(u) => u,
			(e) => error(500, e)
		);
	}

	await setJwtCookie({
		name: 'session',
		payload: user,
		expiration: 60 * 60 * 24 * 7
	});

	redirect(302, resolve('/'));
});

export const getUser = query(async () => {
	const user = await decodeJwtFromCookie<typeof userTable.$inferSelect>('session');
	return user;
});

export const signOut = form(async () => {
	const { cookies } = getRequestEvent();
	cookies.delete('session', {
		path: '/'
	});
});
