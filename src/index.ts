#!/usr/bin/env node
import './configs/logger/index.js';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { env } from './configs/env.js';
import methodNotAllowed from './lib/methodNotAllowed.js';
import { createMcp } from './mcp.js';

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

app.post('/mcp', async (req: Request, res: Response) => {
    try {
        console.log('Received MCP request', req.body);
        const mcpServer = createMcp();
        const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        res.on('close', () => {
            console.log('Request closed');
            transport.close();
            mcpServer.close();
        });
        await mcpServer.connect(transport);
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

app.delete('/mcp', methodNotAllowed);
app.get('/mcp', methodNotAllowed);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(env.PORT);
console.log(`Images MCP Server running on port ${env.PORT}`);
