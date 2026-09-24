import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, varchar, timestamp, check } from 'drizzle-orm/pg-core';

export const userTable = pgTable(
	'user',
	{
		id: serial('id').primaryKey(),
		email: varchar().unique().notNull()
	},
	(table) => [check('user_email_lowercase', sql`${table.email} = lower(${table.email})`)]
);

export const sessionTable = pgTable('session', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	issuedAt: timestamp('issued_at').notNull().defaultNow(),
	userAgent: varchar('user_agent').notNull()
});
