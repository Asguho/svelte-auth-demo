import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

if (!DATABASE_URL) throw 'Database Url not set';

const client = new SQL(DATABASE_URL);

export const db = drizzle({ client, schema });
