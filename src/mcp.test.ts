import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock environment before imports
beforeAll(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TWITTER_API_KEY', 'test-api-key');
    vi.stubEnv('TWITTER_API_SECRET', 'test-api-secret');
});

// Store registered tool handlers
const toolHandlers: Record<string, (input: any, extra: any) => Promise<any>> = {};

// Mock McpServer to capture tool registrations
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
    return {
        McpServer: class MockMcpServer {
            constructor() {}
            tool(name: string, _description: string, _schema: any, handler: any) {
                toolHandlers[name] = handler;
            }
        },
    };
});

// Mock TwitterClient
const mockTwitterClient = {
    retweet: vi.fn(),
    likeTweet: vi.fn(),
    postTweet: vi.fn(),
    getMe: vi.fn(),
    searchTweets: vi.fn(),
};

vi.mock('./twitter-api.js', () => {
    return {
        TwitterClient: class MockTwitterClient {
            constructor() {
                return mockTwitterClient;
            }
        },
    };
});

// Mock ResponseFormatter
vi.mock('./formatter.js', () => ({
    ResponseFormatter: {
        formatSearchResponse: vi.fn().mockReturnValue({ formatted: true }),
        toMcpResponse: vi.fn().mockReturnValue('formatted response'),
    },
}));

import { createMcp } from './mcp.js';
import { ResponseFormatter } from './formatter.js';

describe('mcp.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear tool handlers and re-register
        Object.keys(toolHandlers).forEach((key) => delete toolHandlers[key]);
        createMcp();
    });

    describe('createMcp', () => {
        it('should create an MCP server instance', () => {
            const mcp = createMcp();
            expect(mcp).toBeDefined();
        });

        it('should register all four tools', () => {
            expect(toolHandlers['retweet']).toBeDefined();
            expect(toolHandlers['like_tweet']).toBeDefined();
            expect(toolHandlers['post_tweet']).toBeDefined();
            expect(toolHandlers['search_tweets']).toBeDefined();
        });
    });

    describe('retweet tool', () => {
        it('should return error when oauth tokens are missing', async () => {
            const result = await toolHandlers['retweet']({ tweetId: '123' }, {});
            expect(result.content[0].text).toContain('No twitter client');
        });

        it('should return error when oauth_token is missing', async () => {
            const result = await toolHandlers['retweet']({ tweetId: '123' }, {
                _meta: { client: { oauth_token_secret: 'secret' } },
            });
            expect(result.content[0].text).toContain('No twitter client');
        });

        it('should return success message when retweet succeeds', async () => {
            mockTwitterClient.retweet.mockResolvedValue({
                data: { retweeted: true },
            });

            const result = await toolHandlers['retweet']({ tweetId: '123' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toBe('Tweet retweeted successfully!');
        });

        it('should return error message when retweet fails', async () => {
            mockTwitterClient.retweet.mockResolvedValue({
                data: { retweeted: false },
                errors: [{ message: 'Already retweeted' }],
            });

            const result = await toolHandlers['retweet']({ tweetId: '123' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Failed to retweet');
        });

        it('should handle exceptions gracefully', async () => {
            mockTwitterClient.retweet.mockRejectedValue(new Error('Network error'));

            const result = await toolHandlers['retweet']({ tweetId: '123' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Error message: Network error');
        });
    });

    describe('like_tweet tool', () => {
        it('should return error when oauth tokens are missing', async () => {
            const result = await toolHandlers['like_tweet']({ tweetId: '123' }, {});
            expect(result.content[0].text).toContain('No twitter client');
        });

        it('should return success message when like succeeds', async () => {
            mockTwitterClient.likeTweet.mockResolvedValue({
                data: { liked: true },
            });

            const result = await toolHandlers['like_tweet']({ tweetId: '123' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toBe('Tweet liked successfully!');
        });

        it('should return error message when like fails', async () => {
            mockTwitterClient.likeTweet.mockResolvedValue({
                data: { liked: false },
                errors: [{ message: 'Already liked' }],
            });

            const result = await toolHandlers['like_tweet']({ tweetId: '123' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Failed to like');
        });

        it('should handle exceptions gracefully', async () => {
            mockTwitterClient.likeTweet.mockRejectedValue(new Error('API error'));

            const result = await toolHandlers['like_tweet']({ tweetId: '123' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Error message: API error');
        });
    });

    describe('post_tweet tool', () => {
        it('should return error when oauth tokens are missing', async () => {
            const result = await toolHandlers['post_tweet']({ text: 'Hello world' }, {});
            expect(result.content[0].text).toContain('No twitter client');
        });

        it('should post tweet and return URL on success', async () => {
            mockTwitterClient.postTweet.mockResolvedValue({ id: '12345' });
            mockTwitterClient.getMe.mockResolvedValue({ username: 'testuser' });

            const result = await toolHandlers['post_tweet']({ text: 'Hello world' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Tweet posted successfully!');
            expect(result.content[0].text).toContain('https://twitter.com/testuser/status/12345');
        });

        it('should handle post tweet with images', async () => {
            mockTwitterClient.postTweet.mockResolvedValue({ id: '12345' });
            mockTwitterClient.getMe.mockResolvedValue({ username: 'testuser' });

            const result = await toolHandlers['post_tweet'](
                { text: 'Hello world', images: ['https://example.com/image.png'] },
                {
                    _meta: {
                        client: {
                            oauth_token: 'test-token',
                            oauth_token_secret: 'test-secret',
                        },
                    },
                }
            );

            expect(mockTwitterClient.postTweet).toHaveBeenCalledWith('Hello world', ['https://example.com/image.png']);
            expect(result.content[0].text).toContain('Tweet posted successfully!');
        });

        it('should handle exceptions gracefully', async () => {
            mockTwitterClient.postTweet.mockRejectedValue(new Error('Rate limited'));

            const result = await toolHandlers['post_tweet']({ text: 'Hello world' }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Error message: Rate limited');
        });
    });

    describe('search_tweets tool', () => {
        it('should return error when oauth tokens are missing', async () => {
            const result = await toolHandlers['search_tweets']({ query: 'test', count: 10 }, {});
            expect(result.content[0].text).toContain('No twitter client');
        });

        it('should search tweets and format response', async () => {
            const mockTweets = [{ id: '1', text: 'Tweet 1' }];
            const mockUsers = [{ id: 'u1', username: 'user1' }];
            mockTwitterClient.searchTweets.mockResolvedValue({ tweets: mockTweets, users: mockUsers });

            const result = await toolHandlers['search_tweets']({ query: 'test query', count: 10 }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(mockTwitterClient.searchTweets).toHaveBeenCalledWith('test query', 10);
            expect(ResponseFormatter.formatSearchResponse).toHaveBeenCalledWith('test query', mockTweets, mockUsers);
            expect(result.content[0].text).toBe('formatted response');
        });

        it('should handle exceptions gracefully', async () => {
            mockTwitterClient.searchTweets.mockRejectedValue(new Error('Search failed'));

            const result = await toolHandlers['search_tweets']({ query: 'test', count: 10 }, {
                _meta: {
                    client: {
                        oauth_token: 'test-token',
                        oauth_token_secret: 'test-secret',
                    },
                },
            });

            expect(result.content[0].text).toContain('Error message: Search failed');
        });
    });
});
