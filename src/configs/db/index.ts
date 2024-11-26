// Make sure to install the 'pg' package
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { env } from '../env.js';

const { Pool } = pg;

if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to initialize the database connection.');
}

const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
