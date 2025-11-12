# Use Bun alpine (latest stable)
FROM oven/bun:alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (without frozen-lockfile to avoid version issues)
RUN bun install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8787/.well-known/agent.json || exit 1

# Start the agent
CMD ["bun", "run", "start"]

