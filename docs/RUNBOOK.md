# twitter_mcp_server Runbook

## Overview

| Field | Value |
|-------|-------|
| Name | twitter_mcp_server |
| Type | MCP Server |
| Runtime | Node.js 22 |
| Protocol | MCP over HTTP |
| Port | 3000 (default) |

## Quick Commands

```bash
make setup      # Install deps, create .env
make dev        # Start server
make build      # Build TypeScript
make typecheck  # Type check
```

## Health Check

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

## Local Development

```bash
make setup
# Edit .env with credentials
make dev
```

## Environment Variables

See `.env.example` for required variables.

## Common Issues

### Connection Refused
- Check server is running on correct port
- Verify PORT env var

### Auth Failed
- Check API credentials in .env
- Verify OAuth tokens are valid

## Deployment

```bash
make build
npm start
```

Or via Docker if Dockerfile exists.
