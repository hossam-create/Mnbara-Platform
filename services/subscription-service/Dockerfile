FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
# Use npm install if package-lock exists, otherwise install
RUN if [ -f package-lock.json ]; then npm install --only=production; else npm install --only=production; fi

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S subscription && adduser -S subscription -u 1001
USER subscription

# Expose port
EXPOSE 3012

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3012/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
