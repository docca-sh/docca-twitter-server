import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TwitterError } from './types.js';

const { me } = vi.hoisted(() => ({ me: vi.fn() }));
vi.mock('twitter-api-v2', () => ({
    TwitterApi: class { v2 = { me }; },
}));
import { TwitterClient } from './twitter-api.js';

describe('TwitterClient error normalization', () => {
    beforeEach(() => {
        me.mockReset();
        vi.spyOn(console, 'info').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => vi.restoreAllMocks());

    it.each([null, undefined, 'network failed', {}])('normalizes unexpected rejection %j', async (error) => {
        me.mockRejectedValue(error);
        const client = new TwitterClient({ appKey: 'test', appSecret: 'test' });
        await expect(client.getMe()).rejects.toMatchObject({
            name: 'TwitterError', code: 'internal_error', status: 500,
            message: 'An unexpected error occurred',
        });
    });

    it('preserves an existing TwitterError', async () => {
        const error = new TwitterError('Slow down', 'rate_limit_exceeded', 429);
        me.mockRejectedValue(error);
        const client = new TwitterClient({ appKey: 'test', appSecret: 'test' });
        await expect(client.getMe()).rejects.toBe(error);
    });

    it('preserves API error details', async () => {
        me.mockRejectedValue({ message: 'Unauthorized', code: 'unauthorized', status: 401 });
        const client = new TwitterClient({ appKey: 'test', appSecret: 'test' });
        await expect(client.getMe()).rejects.toMatchObject({
            name: 'TwitterError', message: 'Unauthorized', code: 'unauthorized', status: 401,
        });
    });
});
