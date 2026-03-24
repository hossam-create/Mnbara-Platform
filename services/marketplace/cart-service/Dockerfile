FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

RUN npx prisma generate
RUN npm run build

RUN addgroup -g 1001 -S cart && adduser -S cart -u 1001
USER cart

EXPOSE 3013

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3013/api/cart/health || exit 1

CMD ["node", "dist/main.js"]
