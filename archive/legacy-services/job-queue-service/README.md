# Job Queue Service

Background job processing with BullMQ and Redis.

## Features

- ✅ Multiple job queues (email, SMS, push, image processing, etc.)
- ✅ Job scheduling and delays
- ✅ Retry with exponential backoff
- ✅ Job progress tracking
- ✅ Queue management (pause/resume/clean)
- ✅ Real-time stats

## Quick Start

```bash
npm install
cp .env.example .env
# Configure Redis connection
npm run dev      # Start API server
npm run worker   # Start workers (separate terminal)
```

## API Endpoints

### Add Job
```bash
POST /api/jobs
{
  "queue": "email",
  "data": {
    "to": "user@example.com",
    "subject": "Welcome",
    "template": "welcome",
    "data": { "name": "John" }
  },
  "options": {
    "delay": 5000,
    "attempts": 3
  }
}
```

### Get Job Status
```bash
GET /api/jobs/:queue/:jobId
```

### Get Queue Stats
```bash
GET /api/queues/:queue/stats
GET /api/queues/stats  # All queues
```

### Pause/Resume Queue
```bash
POST /api/queues/:queue/pause
POST /api/queues/:queue/resume
```

## Port

3018
