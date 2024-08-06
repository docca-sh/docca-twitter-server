import { createEnv } from '@t3-oss/env-core';
import { config } from 'dotenv';
import { z } from 'zod';

config();

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']).default('development'),
        PORT: z.coerce.number().default(3000),
        TWITTER_API_KEY: z.string().min(1, 'API Key is required'),
        TWITTER_API_SECRET_KEY: z.string().min(1, 'API Secret Key is required'),
        TWITTER_ACCESS_TOKEN: z.string().min(1, 'Access Token is required'),
        TWITTER_ACCESS_TOKEN_SECRET: z.string().min(1, 'Access Token Secret is required')
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
