#!/bin/bash
BASE_URL="${1:-http://localhost:3000}"
echo "🔥 Smoke test: $BASE_URL"

# Health check
echo -n "Health... "
if curl -sf "$BASE_URL/health" > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌"
  exit 1
fi

# MCP tools list
echo -n "MCP tools... "
RESPONSE=$(curl -sf -X POST "$BASE_URL/mcp" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' 2>/dev/null)
if echo "$RESPONSE" | grep -q "tools"; then
  echo "✅"
  exit 0
else
  echo "❌"
  exit 1
fi
