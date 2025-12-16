import { getFirstOrNull, getFirstOrThrow } from '$lib/utils';
import { and, eq } from 'drizzle-orm';
import { ResultAsync } from 'neverthrow';
import { db } from '.';
import { sessionTable, userTable } from './schema';
import { getRequestEvent } from '$app/server';

export async function getUserByEmail(email: string) {
	return await db.select().from(userTable).where(eq(userTable.email, email)).then(getFirstOrNull);
}

export async function createUser(user: typeof userTable.$inferInsert) {
	return await ResultAsync.fromPromise(
		db.insert(userTable).values(user).returning().then(getFirstOrThrow),
		(e) => {
			console.error("failed to create user:", e);
			return `Failed to create user`;
		}
	);
}
export async function updateRefreshSession(sessionId: number) {
	return await ResultAsync.fromPromise(
		db
			.update(sessionTable)
			.set({ issuedAt: Math.floor(Date.now() / 1000) })
			.where(eq(sessionTable.id, sessionId))
			.returning()
			.then(getFirstOrThrow),
		(e) => {
			console.error("failed to update session:", e);
			return `Failed to update refresh session`;
		}
	);
}
export async function getUserById(userId: number) {
	return await db.select().from(userTable).where(eq(userTable.id, userId)).then(getFirstOrNull);
}
export async function createRefreshSession(user: { id: number; email: string }) {
	return await db
		.insert(sessionTable)
		.values({
			userId: user.id,
			userAgent: getRequestEvent().request.headers.get('user-agent') || 'unknown',
			issuedAt: Math.floor(Date.now() / 1000)
		})
		.returning()
		.then(getFirstOrThrow);
}
export async function getUserSessions(userId: any) {
	return await db.select().from(sessionTable).where(eq(sessionTable.userId, userId));
}
export async function deleteSessionById(sessionId: number, userId: number) {
	return ResultAsync.fromPromise(
		db
			.delete(sessionTable)
			.where(and(eq(sessionTable.id, sessionId), eq(sessionTable.userId, userId))),
		(e) => {
			console.error("failed to delete session:", e);
			return `Failed to delete session`;
		}
	);
}
