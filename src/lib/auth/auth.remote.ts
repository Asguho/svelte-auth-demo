import { resolve } from '$app/paths';
import { form, getRequestEvent, query } from '$app/server';
import { sessionTable, userTable } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { decodeJwtFromCookie, setJwtCookie } from './jwt';
import { sendOTPCode, verifyOTP } from './auth';
import { createUser, getUserByEmail } from '$lib/server/db/queries';
import { db } from '$lib/server/db';
import { getFirstOrThrow } from '$lib/utils';
import { eq } from 'drizzle-orm';

const FIVE_MINUTES_IN_SECONDS = 5 * 60;
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export const loginWithEmail = form(
	v.object({ email: v.pipe(v.string(), v.email()) }),
	async ({ email }) => {
		await sendOTPCode(email);

		await setJwtCookie({
			name: 'verification',
			payload: { email },
			expiration: FIVE_MINUTES_IN_SECONDS
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

	const session = await db.insert(sessionTable).values({
		userId: user.id,
		userAgent: getRequestEvent().request.headers.get('user-agent') || 'unknown',
		issuedAt: Math.floor(Date.now() / 1000)
	}).returning().then(getFirstOrThrow);

	await setJwtCookie({
		name: 'refresh',
		payload: { userId: user.id, sessionId: session.id },
		expiration: THIRTY_DAYS_IN_SECONDS
	});

	await setJwtCookie({
		name: 'user',
		payload: user,
		expiration: FIVE_MINUTES_IN_SECONDS
	});

	redirect(302, resolve('/'));
});

export const getUser = query(async () => {
	{ // try to get user from short lived token
		const user = await decodeJwtFromCookie<typeof userTable.$inferSelect>('user');
		if (user) {
			return user;
		}
	}

	{ // try to refresh
		const refresh = await decodeJwtFromCookie<{ userId: number; sessionId: number }>('refresh');
		if (!refresh) return null;
		const user = await db.select().from(userTable).where(eq(userTable.id, refresh.userId)).then(getFirstOrThrow);
		await setJwtCookie({
			name: 'user',
			payload: user,
			expiration: FIVE_MINUTES_IN_SECONDS
		});
		const updatedRefresh = await db.update(sessionTable).set({ issuedAt: Math.floor(Date.now() / 1000) }).where(eq(sessionTable.id, refresh.sessionId)).returning().then(getFirstOrThrow);
		await setJwtCookie({
			name: 'refresh',
			payload: { userId: refresh.userId, sessionId: updatedRefresh.id },
			expiration: THIRTY_DAYS_IN_SECONDS
		});
		return user;
	}

});

export const signOut = form(async () => {
	const { cookies } = getRequestEvent();
	cookies.delete('user', {
		path: '/'
	});
});
