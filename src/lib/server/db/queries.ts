import { getFirstOrNull, getFirstOrThrow } from '$lib/utils';
import { eq } from 'drizzle-orm';
import { ResultAsync } from 'neverthrow';
import { db } from '.';
import { userTable } from './schema';

export async function getUserByEmail(email: string) {
	return await db.select().from(userTable).where(eq(userTable.email, email)).then(getFirstOrNull);
}

export async function createUser(user: typeof userTable.$inferInsert) {
	return await ResultAsync.fromPromise(
		db.insert(userTable).values(user).returning().then(getFirstOrThrow),
		(e) => {
			console.error(e);
			return `Failed to create user`;
		}
	)
}