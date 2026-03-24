# Notification Service (NestJS)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S notifications && adduser -S notifications -u 1001
USER notifications

# Environment
ENV NODE_ENV=production
ENV PORT=3011

# Expose port
EXPOSE 3011

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3011/health || exit 1

# Start service
CMD ["node", "dist/main.js"]
