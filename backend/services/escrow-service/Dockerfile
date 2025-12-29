# Escrow Service
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Environment
ENV NODE_ENV=production
ENV PORT=3022

# Expose port
EXPOSE 3022

# Start service
CMD ["node", "dist/index.js"]
