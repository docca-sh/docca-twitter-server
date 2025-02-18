// API Response types
export interface TweetMetrics {
    likes: number;
    retweets: number;
}

export interface PostedTweet {
    id: string;
    text: string;
}

export interface Tweet {
    id: string;
    text: string;
    authorId: string;
    metrics: TweetMetrics;
    createdAt: string;
}

export interface TwitterUser {
    id: string;
    username: string;
}

// Error types
export class TwitterError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status?: number
    ) {
        super(message);
        this.name = 'TwitterError';
    }

    static isRateLimit(error: unknown): error is TwitterError {
        return error instanceof TwitterError && error.code === 'rate_limit_exceeded';
    }
}

// Response formatter types
export interface FormattedTweet {
    position: number;
    author: {
        username: string;
    };
    content: string;
    metrics: TweetMetrics;
    url: string;
}

export interface SearchResponse {
    query: string;
    count: number;
    tweets: FormattedTweet[];
}