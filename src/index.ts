#!/usr/bin/env node
import './configs/logger/index.js';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    TextContent
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { z } from 'zod';
import { env } from './configs/env.js';
import { ResponseFormatter } from './formatter.js';
import { TwitterClient } from './twitter-api.js';

process.on('SIGINT', async () => {
    console.info('Shutting down server...');
    await mcp.close();
    process.exit(0);
});
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});
process.on('unhandledRejection', error => {
    console.error('Unhandled rejection:', error);
});

const mcp = new McpServer({
    name: 'twitter-mcp',
    version: '1.0.0'
}, {
    capabilities: {
        tools: {}
    }
});

mcp.tool(
    'post_tweet',
    'Post a new tweet to Twitter',
    {
        text: z.string({ description: 'The content of your tweet' }).min(1, 'Tweet text cannot be empty').max(280, 'Tweet cannot exceed 280 characters'),
    },
    async (input, context) => {
        if (!context.sessionId || !twitterClients[context.sessionId]) {
            throw new Error(`No twitter client for sessionId: ${context.sessionId}`);
        }
        const client = twitterClients[context.sessionId];
        const tweet = await client.postTweet(input.text);
        return {
            content: [{
                type: 'text',
                text: `Tweet posted successfully!\nURL: https://twitter.com/status/${tweet.id}`
            }] as TextContent[]
        };
    }
);

mcp.tool(
    'search_tweets',
    'Search for tweets on Twitter',
    {
        query: z.string({ description: 'Search query' }).min(1, 'Search query cannot be empty'),
        count: z.number({ description: 'Number of tweets to retrieve' }).int('Count must be an integer').min(10, 'Minimum count is 10').max(100, 'Maximum count is 100'),
    },
    async (input, context) => {
        if (!context.sessionId || !twitterClients[context.sessionId]) {
            throw new Error(`No twitter client for sessionId: ${context.sessionId}`);
        }
        const client = twitterClients[context.sessionId];
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
    }
)

const app = express();
const sessions: Record<string, SSEServerTransport> = {};
const twitterClients: Record<string, TwitterClient> = {};

app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    sessions[transport.sessionId] = transport;
    twitterClients[transport.sessionId] = new TwitterClient({
        accessToken: env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: env.TWITTER_ACCESS_TOKEN_SECRET,
        apiKey: env.TWITTER_API_KEY,
        apiSecretKey: env.TWITTER_API_SECRET_KEY
    });
    await mcp.connect(transport);
});

app.post("/messages", async (req, res) => {
    const query = req.query as { sessionId: string };
    const transport = sessions[query.sessionId];
    if (!transport) {
        res.status(404).send("No such session");
        return;
    }
    await transport.handlePostMessage(req, res);
});

app.listen(env.PORT);
console.debug('123')
console.log(`Twitter MCP Server running on port ${env.PORT}`);
