import { EUploadMimeType, TwitterApi, TwitterApiTokens, UserV2 } from 'twitter-api-v2';
import { PostedTweet, Tweet, TwitterError, TwitterUser } from './types.js';

export class TwitterClient {
    private client: TwitterApi;
    private rateLimitMap = new Map<string, number>();
    private me: UserV2 | undefined;

    constructor(credentials: TwitterApiTokens) {
        this.client = new TwitterApi(credentials);
        console.info('Twitter API client initialized');
    }

    async getMe() {
        try {
            if (!this.me) {
                const endpoint = 'users/me';
                await this.checkRateLimit(endpoint);
                const res = await this.client.v2.me();
                this.me = res.data;
            }
            return this.me;
        } catch (error) {
            this.handleApiError(error);
        }
    }

    async postTweet(text: string, images?: string[]): Promise<PostedTweet> {
        try {
            const endpoint = 'tweets/create';
            await this.checkRateLimit(endpoint);
            const mediaIds: string[] = [];
            for (const image of images?.slice(0, 4) ?? []) {
                const mediaType = (image.split('.').pop() ?? 'image/jpeg') as EUploadMimeType;
                const buffer = await fetch(image);
                const arrayBuffer = await (await buffer.blob()).arrayBuffer();
                const mediaId = await this.client.v2.uploadMedia(Buffer.from(arrayBuffer), {
                    media_category: 'tweet_image',
                    media_type: mediaType,
                });
                mediaIds.push(mediaId);
            }
            const response = await this.client.v2.tweet({
                text,
                media: {
                    media_ids: mediaIds.length && mediaIds as any,
                }
            });

            console.info(`Tweet posted successfully with ID: ${response.data.id}`);

            return {
                id: response.data.id,
                text: response.data.text
            };
        } catch (error) {
            this.handleApiError(error);
        }
    }

    async searchTweets(query: string, count: number): Promise<{ tweets: Tweet[], users: TwitterUser[] }> {
        try {
            const endpoint = 'tweets/search';
            await this.checkRateLimit(endpoint);

            const response = await this.client.v2.search(query, {
                max_results: count,
                expansions: ['author_id'],
                'tweet.fields': ['public_metrics', 'created_at'],
                'user.fields': ['username', 'name', 'verified']
            });

            console.info(`Fetched ${response.tweets.length} tweets for query: "${query}"`);

            const tweets = response.tweets.map(tweet => ({
                id: tweet.id,
                text: tweet.text,
                authorId: tweet.author_id ?? '',
                metrics: {
                    likes: tweet.public_metrics?.like_count ?? 0,
                    retweets: tweet.public_metrics?.retweet_count ?? 0,
                    replies: tweet.public_metrics?.reply_count ?? 0,
                    quotes: tweet.public_metrics?.quote_count ?? 0
                },
                createdAt: tweet.created_at ?? ''
            }));

            const users = response.includes.users.map(user => ({
                id: user.id,
                username: user.username,
                name: user.name,
                verified: user.verified ?? false
            }));

            return { tweets, users };
        } catch (error) {
            this.handleApiError(error);
        }
    }
    
    async likeTweet(tweetId: string) {
        try {
            const endpoint = `tweets/${tweetId}/like`;
            await this.checkRateLimit(endpoint);
            const me = await this.getMe()
            const res = await this.client.v2.like(me.id, tweetId);
            return res;
        } catch (error) {
            this.handleApiError(error);
        }
    }

    private async checkRateLimit(endpoint: string): Promise<void> {
        const lastRequest = this.rateLimitMap.get(endpoint);
        if (lastRequest) {
            const timeSinceLastRequest = Date.now() - lastRequest;
            if (timeSinceLastRequest < 1000) { // Basic rate limiting
                throw new TwitterError(
                    'Rate limit exceeded',
                    'rate_limit_exceeded',
                    429
                );
            }
        }
        this.rateLimitMap.set(endpoint, Date.now());
    }

    private handleApiError(error: unknown): never {
        if (error instanceof TwitterError) {
            throw error;
        }

        // Handle twitter-api-v2 errors
        const apiError = error as any;
        if (apiError.code) {
            throw new TwitterError(
                apiError.message || 'Twitter API error',
                apiError.code,
                apiError.status
            );
        }

        // Handle unexpected errors
        console.error('Unexpected error in Twitter client:', error);
        throw new TwitterError(
            'An unexpected error occurred',
            'internal_error',
            500
        );
    }
}