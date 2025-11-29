FROM node:18-alpine

WORKDIR /app

# Initialize npm project
RUN npm init -y

# Install dependencies
RUN npm install express http-proxy-middleware jsonwebtoken cors dotenv helmet morgan
RUN npm install -D typescript ts-node-dev @types/express @types/http-proxy-middleware @types/jsonwebtoken @types/cors @types/morgan @types/node

# Create tsconfig.json inline
RUN echo '{ \
    "compilerOptions": { \
    "target": "es2016", \
    "module": "commonjs", \
    "outDir": "./dist", \
    "rootDir": "./src", \
    "strict": true, \
    "esModuleInterop": true, \
    "skipLibCheck": true, \
    "forceConsistentCasingInFileNames": true \
    }, \
    "include": ["src/**/*"], \
    "exclude": ["node_modules"] \
    }' > tsconfig.json

COPY src ./src
COPY .env.example ./

RUN npm run build || npx tsc

EXPOSE 8080

CMD ["node", "dist/index.js"]
