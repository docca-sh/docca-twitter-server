import { describe, it, expect } from 'vitest';

describe('types.ts', () => {
    describe('module import', () => {
        it('should import without throwing', async () => {
            const module = await import('./types.js');
            expect(module).toBeDefined();
            expect(module.TwitterError).toBeDefined();
        });
    });

    describe('TwitterError', () => {
        it.todo('should create error with message, code, and status');
        it.todo('should have name TwitterError');

        describe('isRateLimit', () => {
            it.todo('should return true for rate limit errors');
            it.todo('should return false for other errors');
        });
    });
});
