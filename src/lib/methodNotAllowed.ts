import { Request, Response } from 'express';

export default function methodNotAllowed(req: Request, res: Response) {
    console.log('Received method not allowed request');
    res.writeHead(405).end(JSON.stringify({
        jsonrpc: "2.0",
        error: {
            code: -32000,
            message: "Method not allowed."
        },
        id: null
    }));
};