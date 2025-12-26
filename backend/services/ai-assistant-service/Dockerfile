# AI Assistant Service - Gen 10 AI
# خدمة المساعد الذكي - الجيل العاشر

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY dist ./dist/

# Environment
ENV NODE_ENV=production
ENV PORT=3024

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3024/health || exit 1

# Expose port
EXPOSE 3024

# Start service
CMD ["node", "dist/index.js"]
