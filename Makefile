.PHONY: setup lint typecheck test dev build clean

# Setup project
setup:
	npm install
	cp -n .env.example .env || true
	@echo "✓ Setup complete. Edit .env with your credentials."

# Code quality
lint:
	npm run lint 2>/dev/null || echo "No lint script"

typecheck:
	npm run check-types 2>/dev/null || npx tsc --noEmit

# Testing
test:
	@echo "⚠️  No tests configured"

# Development
dev:
	npm start

# Build
build:
	npm run build 2>/dev/null || npx tsc

# Clean
clean:
	rm -rf node_modules dist

help:
	@echo "Targets: setup lint typecheck test dev build clean"
