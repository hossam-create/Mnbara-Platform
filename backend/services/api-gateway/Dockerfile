FROM node:18-alpine

WORKDIR /app

# Copy package definition
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY .env.example ./

# Build
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
