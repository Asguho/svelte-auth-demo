import { err, ok, okAsync, ResultAsync } from 'neverthrow';
import { db } from '.';
import { userTable } from './schema';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(email: string) {
	return await ResultAsync.fromPromise(
		db.select().from(userTable).where(eq(userTable.email, email)),
		(e) => {
			console.error(e);
			return `Database query error`;
		}
	).andThen((users) => {
		if (users.length > 0) {
			return okAsync(users[0]);
		}
		return ResultAsync.fromPromise(
			db.insert(userTable).values({ email: email }).returning(),
			(e) => {
				console.error(e);
				return `Database insert error`;
			}
		).map((insertedUsers) => insertedUsers[0]);
	});
}
