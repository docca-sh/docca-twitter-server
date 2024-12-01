# Twitter MCP Server

## Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `TWITTER_API_KEY` | Yes | Twitter application API key used for MCP requests. |
| `TWITTER_API_SECRET` | Yes | Twitter application API secret used for MCP requests. |
| `DATABASE_URL` | No (runtime) | Postgres connection string, required only when using the database or running drizzle-kit. |
| `NODE_ENV` | No | `development` or `production` (defaults to `development`). |
| `PORT` | No | HTTP port for the MCP server (defaults to `3000`). |
