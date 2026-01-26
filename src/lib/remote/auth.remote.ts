import { resolve } from '$app/paths';
import { form, getRequestEvent, query } from '$app/server';
import { userTable } from '$lib/server/db/schema';
import { error, fail, redirect, type RemoteQueryFunction } from '@sveltejs/kit';
import * as v from 'valibot';
import { decodeJwtFromCookie, setJwtCookie } from '../server/auth/jwt';
import { sendOTPCode, verifyOTP } from '../server/auth/auth';
import { AUTH_QUERIES } from '../server/auth/queries';

const FIVE_MINUTES_IN_SECONDS = 5 * 60;
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export const loginWithEmail = form(
	v.object({ email: v.pipe(v.string(), v.email()) }),
	async ({ email }) => {
		sendOTPCode(email);

		await setJwtCookie({
			name: 'verification',
			payload: { email },
			expiration: FIVE_MINUTES_IN_SECONDS
		});

		redirect(302, resolve('/otp'));
	}
);

export const verifyOTPForm = form(v.object({ otp: v.number() }), async ({ otp }) => {
	const payload = await decodeJwtFromCookie<{ email: string }>('verification');
	if (!payload) redirect(302, resolve('/login'));
	const { email } = payload;

	if (!verifyOTP(otp, email)) {
		fail(400, { message: 'OTP not valid. Try resending it' });
	}

	let user = await AUTH_QUERIES.getUserByEmail(email);
	if (!user) {
		const userResult = await AUTH_QUERIES.createUser({ email });
		user = userResult.match(
			(u) => u,
			(e) => error(500, e)
		);
	}

	const session = await AUTH_QUERIES.createRefreshSession(user);

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
	let user = await decodeJwtFromCookie<typeof userTable.$inferSelect>('user');
	if (user) return user;

	const refresh = await decodeJwtFromCookie<{ userId: number; sessionId: number }>('refresh');
	if (!refresh) return null;

	user = await AUTH_QUERIES.getUserById(refresh.userId);

	const updateRefreshResult = await AUTH_QUERIES.updateRefreshSession(refresh.sessionId);
	const updatedRefresh = updateRefreshResult.match(
		(r) => r,
		(e) => null
	);

	if (!updatedRefresh) return null;

	await setJwtCookie({
		name: 'user',
		payload: user!,
		expiration: FIVE_MINUTES_IN_SECONDS
	});

	await setJwtCookie({
		name: 'refresh',
		payload: { userId: refresh.userId, sessionId: updatedRefresh.id },
		expiration: THIRTY_DAYS_IN_SECONDS
	});

	return user;
});
export const getUserOrLogin = query(async () => {
	const user = await getUser();
	if (!user) redirect(302, resolve('/login'));
	return user;
});

export const getAllSessions = query(async () => {
	const user = await getUserOrLogin();
	return await AUTH_QUERIES.getUserSessions(user.id);
});

export const deleteSession = form(v.object({ sessionId: v.number() }), async ({ sessionId }) => {
	// await getAllSessions.refresh();
	const user = await getUserOrLogin();

	if (sessionId === (await decodeJwtFromCookie<{ sessionId: number }>('refresh'))?.sessionId) {
		await signOut();
		redirect(302, resolve('/login'));
	}

	const result = await AUTH_QUERIES.deleteSessionById(sessionId, user.id);
	return result.match(
		(r) => r,
		(e) => {
			error(500, e);
		}
	);
});

export const signOut = form(async () => {
	const { cookies } = getRequestEvent();
	cookies.delete('user', {
		path: '/'
	});
	cookies.delete('refresh', {
		path: '/'
	});
});
