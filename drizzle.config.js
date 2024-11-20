import { defineConfig } from 'drizzle-kit';
import { env } from './src/configs/env.js';
export default defineConfig({
    schema: './src/configs/db/schema.ts',
    out: './src/configs/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: env.DATABASE_URL,
    },
});
