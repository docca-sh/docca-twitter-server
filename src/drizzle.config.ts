import { defineConfig } from 'drizzle-kit';
import { env } from './configs/env.js';

if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for drizzle-kit configuration.');
}

export default defineConfig({
    schema: './src/configs/db/schema.ts',
    out: './src/configs/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: env.DATABASE_URL,
    },
});
