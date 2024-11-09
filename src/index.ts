#!/usr/bin/env node
import './configs/logger/index.js';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
    isInitializeRequest,
    TextContent
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import { env } from './configs/env.js';
import { ResponseFormatter } from './formatter.js';
import { TwitterClient } from './twitter-api.js';

process.on('SIGINT', async () => {
    console.error('Shutting down server...');
    process.exit(0);
});
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});
process.on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error);
});

const app = express();
app.use(express.json());

const createServer = () => {
    const mcp = new McpServer({
        name: 'twitter-mcp',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    });

    mcp.tool(
        'retweet',
        'Retweet a tweet on Twitter/X',
        {
            tweetId: z.string({ description: 'The ID of the tweet to retweet' })
                .min(1, 'Tweet ID cannot be empty')
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                if (!clientInfo?.oauth_token || !clientInfo?.oauth_token_secret) {
                    throw new Error(`No twitter client for sessionId`);
                }
                const client = new TwitterClient({
                    appKey: env.TWITTER_API_KEY,
                    appSecret: env.TWITTER_API_SECRET,
                    accessToken: clientInfo.oauth_token.toString(),
                    accessSecret: clientInfo.oauth_token_secret.toString()
                });

                const res = await client.retweet(input.tweetId);
                return {
                    content: [
                        res.data.retweeted ? {
                            type: 'text',
                            text: `Tweet retweeted successfully!`
                        } : {
                            type: 'text',
                            text: `Failed to retweet tweet! Error: ${JSON.stringify(res.errors)}`
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    mcp.tool(
        'like_tweet',
        'Like a tweet on Twitter/X',
        {
            tweetId: z.string({ description: 'The ID of the tweet to like' })
                .min(1, 'Tweet ID cannot be empty')
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                if (!clientInfo?.oauth_token || !clientInfo?.oauth_token_secret) {
                    throw new Error(`No twitter client for sessionId`);
                }
                const client = new TwitterClient({
                    appKey: env.TWITTER_API_KEY,
                    appSecret: env.TWITTER_API_SECRET,
                    accessToken: clientInfo.oauth_token.toString(),
                    accessSecret: clientInfo.oauth_token_secret.toString()
                });
                const res = await client.likeTweet(input.tweetId);
                return {
                    content: [
                        res.data.liked ? {
                            type: 'text',
                            text: `Tweet liked successfully!`
                        } : {
                            type: 'text',
                            text: `Failed to like tweet! Error: ${JSON.stringify(res.errors)}`
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    mcp.tool(
        'post_tweet',
        'Post a new tweet to Twitter/X',
        {
            text: z.string({ description: 'The content of your tweet' })
                .min(1, 'Tweet text cannot be empty')
                .max(280, 'Tweet cannot exceed 280 characters'),
            images: z.array(
                z.string({ description: 'The URL of the image to upload' })
                    .min(1, 'Image URL cannot be empty')
            )
                .max(4, 'Cannot have more than 4 images')
                .optional()
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                if (!clientInfo?.oauth_token || !clientInfo?.oauth_token_secret) {
                    throw new Error(`No twitter client for sessionId`);
                }
                const client = new TwitterClient({
                    appKey: env.TWITTER_API_KEY,
                    appSecret: env.TWITTER_API_SECRET,
                    accessToken: clientInfo.oauth_token.toString(),
                    accessSecret: clientInfo.oauth_token_secret.toString()
                });
                const tweet = await client.postTweet(input.text, input.images);
                const me = await client.getMe();

                return {
                    content: [{
                        type: 'text',
                        text: `Tweet posted successfully!\nURL: https://twitter.com/${me.username}/status/${tweet.id}`
                    }] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    );

    mcp.tool(
        'search_tweets',
        'Search for tweets on Twitter/X',
        {
            query: z.string({ description: 'Search query' }).min(1, 'Search query cannot be empty'),
            count: z.number({ description: 'Number of tweets to retrieve' }).int('Count must be an integer').min(10, 'Minimum count is 10').max(100, 'Maximum count is 100'),
        },
        async (input, extra) => {
            try {
                const clientInfo = extra._meta?.client as Record<string, string>;
                if (!clientInfo?.oauth_token || !clientInfo?.oauth_token_secret) {
                    throw new Error(`No twitter client for sessionId`);
                }
                const client = new TwitterClient({
                    appKey: env.TWITTER_API_KEY,
                    appSecret: env.TWITTER_API_SECRET,
                    accessToken: clientInfo.oauth_token.toString(),
                    accessSecret: clientInfo.oauth_token_secret.toString()
                });
                const { tweets, users } = await client.searchTweets(
                    input.query,
                    input.count
                );

                const formattedResponse = ResponseFormatter.formatSearchResponse(
                    input.query,
                    tweets,
                    users
                );

                return {
                    content: [
                        {
                            type: 'text',
                            text: ResponseFormatter.toMcpResponse(formattedResponse)
                        }
                    ] as TextContent[]
                };
            } catch (e: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error message: ${e.message}, Error data: ${e.data}`
                        }
                    ] as TextContent[]
                };
            }
        }
    )

    return mcp;
}

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post('/mcp', async (req: Request, res: Response) => {
    try {
        // Check for existing session ID
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;
        console.log('Received mcp request', {
            body: req.body,
            headers: req.headers,
            transportsKeys: Object.keys(transports),
            sessionId,
            transport: transports[sessionId!],
        });
        if (sessionId && transports[sessionId]) {
            // Reuse existing transport
            transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
            // New initialization request
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId) => {
                    // Store the transport by session ID when session is initialized
                    // This avoids race conditions where requests might come in before the session is stored
                    console.log(`Session initialized with ID: ${sessionId}`);
                    transports[sessionId] = transport;
                }
            });

            // Set up onclose handler to clean up transport when closed
            transport.onclose = () => {
                if (transport.sessionId) {
                    console.log(`Transport closed for session ${sessionId}, removing from transports map`);
                    delete transports[transport.sessionId];
                }
            };
            const server = createServer();
            await server.connect(transport);

            await transport.handleRequest(req, res, req.body);
            return;
        } else {
            console.log('Failed request', {
                body: req.body,
                headers: req.headers,
                transportsKeys: Object.keys(transports),
                sessionId,
            });
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                },
                id: null,
            });
            return;
        }

        // Handle the request with existing transport - no need to reconnect
        // The existing transport is already connected to the server
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
});

// Handle GET requests for SSE streams (using built-in support from StreamableHTTP)
app.get('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    // Check for Last-Event-ID header for resumability
    const lastEventId = req.headers['last-event-id'] as string | undefined;
    if (lastEventId) {
        console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    } else {
        console.log(`Establishing new SSE stream for session ${sessionId}`);
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
});

// Handle DELETE requests for session termination (according to MCP spec)
app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    console.log(`Received session termination request for session ${sessionId}`);

    try {
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    } catch (error) {
        console.error('Error handling session termination:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing session termination');
        }
    }
});

app.listen(env.PORT);
console.log(`Images MCP Server running on port ${env.PORT}`);
