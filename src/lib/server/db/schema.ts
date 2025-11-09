import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	id: serial('id').primaryKey(),
	email: varchar().unique().notNull()
});
