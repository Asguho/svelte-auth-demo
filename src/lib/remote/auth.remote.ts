import { resolve } from '$app/paths';
import { form, query } from '$app/server';
import { sessionTable, userTable } from '#lib/server/db/schema.js';
import { error, invalid, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { createJwtCookieAccessors } from '../server/auth/jwt';
import {
	deleteAuthCookies,
	sendOTPCode,
	verifyEmailVerificationToken,
	verifyOTP
} from '../server/auth/auth';
import { AUTH_QUERIES } from '../server/auth/queries';

const FIVE_MINUTES_IN_SECONDS = 5 * 60;
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
const [getUserFromCookie, setUserCookie] =
	createJwtCookieAccessors<typeof userTable.$inferSelect>('user');
const [getSessionFromCookie, setSessionCookie] =
	createJwtCookieAccessors<typeof sessionTable.$inferSelect>('session');
const [getVerificationFromCookie, setVerificationCookie] = createJwtCookieAccessors<{
	email: string;
}>('verification');

async function signIn(email: string) {
	let user = await AUTH_QUERIES.getUserByEmail(email);
	if (!user) {
		const userResult = await AUTH_QUERIES.createUser({ email });
		user = userResult.match(
			(u) => u,
			(e) => error(500, e)
		);
	}

	const session = await AUTH_QUERIES.createRefreshSession(user.id);

	await setSessionCookie({
		payload: session,
		expiration: THIRTY_DAYS_IN_SECONDS
	});

	await setUserCookie({
		payload: user,
		expiration: FIVE_MINUTES_IN_SECONDS
	});

	redirect(302, resolve('/'));
}

export const loginWithEmail = form(
	v.object({
		email: v.pipe(v.string(), v.toLowerCase(), v.email()),
		token: v.optional(v.string())
	}),
	async ({ email, token }) => {
		if (token && (await verifyEmailVerificationToken(email, token))) return signIn(email);

		await sendOTPCode(email);
		await setVerificationCookie({ payload: { email }, expiration: FIVE_MINUTES_IN_SECONDS });
		redirect(302, resolve('otp'));
	}
);

export const verifyOTPForm = form(v.object({ otp: v.number() }), async ({ otp }) => {
	const payload = await getVerificationFromCookie();
	if (!payload) redirect(302, resolve('login'));
	const { email } = payload;

	if (!verifyOTP(otp, email)) invalid('OTP not valid. Try resending it');

	return signIn(email);
});

export const getUser = query(async () => {
	let session = await getSessionFromCookie();
	if (!session) return null;

	let user = await getUserFromCookie();
	if (user) return { ...user, sessionId: session.id };

	user = await AUTH_QUERIES.getUserById(session.userId);
	if (!user) error(500, 'User deleted');

	// await setUserCookie({
	// 	payload: user,
	// 	expiration: FIVE_MINUTES_IN_SECONDS
	// });

	const updatedSessionResult = await AUTH_QUERIES.updateRefreshSession(session.id);
	session = updatedSessionResult.unwrapOr(null);
	if (!session) return null;

	// await setSessionCookie({
	// 	payload: session,
	// 	expiration: THIRTY_DAYS_IN_SECONDS
	// });

	return { ...user, sessionId: session.id };
});

export const getUserOrLogin = query(async () => {
	const user = await getUser();
	if (!user) redirect(302, resolve('login'));
	return user;
});

export const getAllSessions = query(async () => {
	const user = await getUserOrLogin();
	return await AUTH_QUERIES.getUserSessions(user.id);
});

async function removeSession(sessionId: number, userId: number) {
	const result = await AUTH_QUERIES.deleteSessionById(sessionId, userId);
	if (result.isErr()) error(500, result.error);
}

export const deleteSession = form(v.object({ sessionId: v.number() }), async ({ sessionId }) => {
	const user = await getUserOrLogin();
	await removeSession(sessionId, user.id);

	if (sessionId === user.sessionId) {
		deleteAuthCookies();
		redirect(302, resolve('login'));
	}

	await getAllSessions().refresh();
});

export const signOut = form(async () => {
	const session = await getSessionFromCookie();
	if (session) await removeSession(session.id, session.userId);
	deleteAuthCookies();
});
