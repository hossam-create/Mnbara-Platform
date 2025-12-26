# Mnbara Listing Service - eBay-Level Product Catalog Service
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    tzdata \
    tini \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S mnbara && \
    adduser -S mnbara -u 1001 -G mnbara

WORKDIR /app

# Copy built application from build stage
COPY --from=build --chown=mnbara:mnbara /app/dist ./dist
COPY --from=build --chown=mnbara:mnbara /app/node_modules ./node_modules
COPY --from=build --chown=mnbara:mnbara /app/package*.json ./
COPY --from=build --chown=mnbara:mnbara /app/prisma ./prisma

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R mnbara:mnbara /app

# Switch to non-root user
USER mnbara

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Expose port
EXPOSE 3002

# Environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "dist/index.js"]

# Labels for better container management
LABEL maintainer="Mnbara Platform Team"
LABEL service="listing-service"
LABEL version="1.0.0"
LABEL description="eBay-Level Product Listing Service with Elasticsearch"