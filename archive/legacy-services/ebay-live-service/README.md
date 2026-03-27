# eBay Live Service

A comprehensive live streaming service for MNBara platform that supports RTMP, HLS, and WebRTC streaming with integrated chat, live auctions, and product carousels.

## Features

- **Multi-Protocol Streaming**: RTMP, HLS, and WebRTC support
- **Live Chat**: Real-time chat with moderation and spam detection
- **Live Auctions**: Real-time bidding with proxy bidding and anti-snipe protection
- **Product Carousels**: Stream-integrated product showcase
- **Low Latency**: WebRTC for sub-second latency streaming
- **Scalable Architecture**: Microservice-based design with Docker/Kubernetes support
- **Comprehensive Monitoring**: Health checks, metrics, and logging

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RTMP Server   │    │   HLS Converter │    │  WebRTC Gateway │
│   (Port 1935)   │    │   (Port 8080)   │    │   (Port 3000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Main Service   │
                    │   (Port 3000)   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Chat Service   │    │Auction Service  │    │Product Carousel │
│  (WebSocket)    │    │  (Live Engine)  │    │   (Manager)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    └─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- FFmpeg
- Docker (optional)

### Installation

1. **Clone and Install**

   ```bash
   cd backend/services/ebay-live-service
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start Services**

   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

### Docker Setup

1. **Using Docker Compose**

   ```bash
   docker-compose up -d
   ```

2. **Using Kubernetes**
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

## API Endpoints

### Streaming

- `POST /api/streams/start` - Start a new stream
- `POST /api/streams/stop/:id` - Stop a stream
- `GET /api/streams/:id` - Get stream details
- `GET /api/streams` - List active streams

### Chat

- `POST /api/chat/:streamId/message` - Send chat message
- `GET /api/chat/:streamId/history` - Get chat history
- `POST /api/chat/:streamId/moderate` - Moderate message

### Auctions

- `POST /api/auctions/start` - Start live auction
- `POST /api/auctions/:id/bid` - Place bid
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions/:id/end` - End auction

### Product Carousel

- `POST /api/carousels/create` - Create product carousel
- `GET /api/carousels/:id` - Get carousel details
- `POST /api/carousels/:id/next` - Next product
- `POST /api/carousels/:id/previous` - Previous product

## Configuration

### Environment Variables

| Variable         | Description                  | Default       |
| ---------------- | ---------------------------- | ------------- |
| `NODE_ENV`       | Environment mode             | `production`  |
| `PORT`           | HTTP port                    | `3000`        |
| `DATABASE_URL`   | PostgreSQL connection string | -             |
| `REDIS_URL`      | Redis connection string      | -             |
| `JWT_SECRET`     | JWT signing secret           | -             |
| `RTMP_PORT`      | RTMP server port             | `1935`        |
| `HLS_OUTPUT_DIR` | HLS output directory         | `./media/hls` |

### Streaming Configuration

- **RTMP**: Default port 1935, supports OBS, XSplit, etc.
- **HLS**: HTTP Live Streaming with adaptive bitrate
- **WebRTC**: Low-latency peer-to-peer streaming

### Database Schema

The service uses Prisma ORM with the following main models:

- `LiveStream` - Stream metadata and status
- `ChatRoom` - Chat room configuration
- `LiveAuction` - Auction details and status
- `AuctionBid` - Bid history
- `StreamAnalytics` - Viewership and engagement data

## Development

### Project Structure

```
src/
├── core/                 # Core functionality
│   ├── database/        # Database service
│   ├── routes/          # API routes
│   └── middleware/      # Express middleware
├── streaming/           # Streaming services
│   ├── rtmp-server/     # RTMP server
│   ├── hls-converter/   # HLS conversion
│   └── webrtc-gateway/  # WebRTC gateway
├── chat/                # Chat system
│   ├── websocket-server/ # WebSocket server
│   └── moderation/      # Chat moderation
├── auction/             # Auction system
│   ├── live-auction-engine/ # Auction engine
│   └── product-carousel/    # Product carousel
├── types/               # TypeScript types
├── utils/               # Utility functions
└── index.ts            # Main entry point
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

### Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

## Deployment

### Docker Deployment

1. **Build Image**

   ```bash
   docker build -t mnbara/ebay-live-service:latest .
   ```

2. **Push to Registry**

   ```bash
   docker push mnbara/ebay-live-service:latest
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Kubernetes Deployment

1. **Create Namespace**

   ```bash
   kubectl create namespace ebay-live
   ```

2. **Apply Configuration**

   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

3. **Check Status**
   ```bash
   kubectl get pods -n ebay-live
   kubectl get services -n ebay-live
   ```

### Production Considerations

- **SSL/TLS**: Use proper certificates for HTTPS
- **Load Balancing**: Use multiple instances behind a load balancer
- **CDN**: Use CDN for HLS segments and media files
- **Monitoring**: Set up Prometheus/Grafana for metrics
- **Logging**: Use centralized logging (ELK stack)
- **Backup**: Regular database backups
- **Scaling**: Horizontal pod autoscaling for Kubernetes

## Monitoring

### Health Checks

The service provides health check endpoints:

- `GET /health` - Overall service health
- `GET /health/database` - Database connectivity
- `GET /health/redis` - Redis connectivity

### Metrics

Prometheus metrics available at `/metrics`:

- Stream count and viewer statistics
- Chat message rates
- Auction bid activity
- System resource usage
- Error rates and response times

### Logging

Structured logging with Winston:

- Application logs: `./logs/app.log`
- Error logs: `./logs/error.log`
- Audit logs: `./logs/audit.log`

## Security

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Security headers via nginx
- Non-root Docker containers

## Troubleshooting

### Common Issues

1. **FFmpeg not found**

   ```bash
   # Install FFmpeg
   sudo apt-get install ffmpeg
   ```

2. **Database connection failed**
   - Check PostgreSQL is running
   - Verify connection string in `.env`
   - Check network connectivity

3. **RTMP streaming not working**
   - Verify port 1935 is open
   - Check firewall settings
   - Validate stream key

4. **HLS playback issues**
   - Check FFmpeg installation
   - Verify HLS output directory permissions
   - Check nginx configuration

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=debug
npm run dev
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

This project is part of the MNBara platform and follows the same licensing terms.

## Support

For issues and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation wiki
