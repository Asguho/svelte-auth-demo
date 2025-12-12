import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const client = new SQL(env.DATABASE_URL);

export const db = drizzle({ client, schema });
