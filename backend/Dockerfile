# Multi-stage Dockerfile for REA INVEST Backend

# Base stage
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Dependencies stage
FROM base AS deps
# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage  
FROM base AS deps-dev
COPY package.json package-lock.json* ./
RUN npm ci

# Development stage
FROM base AS development
WORKDIR /app
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .
EXPOSE 8000
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

# Install sharp for image processing
RUN npm install sharp

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Production stage
FROM base AS production
WORKDIR /app

# Create app user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs
RUN chown -R nodejs:nodejs uploads logs

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

# Health check script
COPY --chown=nodejs:nodejs <<EOF /app/healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Environment
ENV NODE_ENV=production
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node /app/healthcheck.js

# Start the application
CMD ["node", "index.js"]