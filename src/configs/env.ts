import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']).default('development'),
        PORT: z.coerce.number().default(3000),
        TWITTER_API_KEY: z.string(),
        TWITTER_API_SECRET: z.string(),
        DATABASE_URL: z.string().optional(),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
