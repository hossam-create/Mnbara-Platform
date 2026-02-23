# Country Layer Service (NestJS)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
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
RUN addgroup -g 1001 -S country && adduser -S country -u 1001
USER country

# Environment
ENV NODE_ENV=production
ENV PORT=3016

# Expose port
EXPOSE 3016

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3016/health || exit 1

# Start service
CMD ["node", "dist/main.js"]
