FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Debug: List files to check for anomalies
RUN find src -type f -exec ls -l {} \;

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
