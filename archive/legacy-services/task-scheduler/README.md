# Task Scheduler Service

Task scheduling and workflow automation service for Mnbara platform - inspired by [xyOps](https://github.com/pixlcore/xyops).

## Features

- ⏰ **Cron-style Scheduling** - Schedule tasks with flexible cron expressions
- 🔄 **Interval Scheduling** - Run tasks at fixed intervals
- 🔌 **Plugin System** - Extensible plugin architecture
- 📊 **Execution History** - Track all task executions with logs
- 🎯 **Manual Triggers** - Run tasks on-demand via API
- 🔧 **Built-in Plugins**:
  - Notification Plugin - Send auction alerts, order updates
  - Currency Plugin - Update exchange rates
  - Cleanup Plugin - Clean old data
  - Report Plugin - Generate and send reports

## Installation

```bash
cd backend/services/task-scheduler
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key configuration:

```env
PORT=3012
DATABASE_URL="postgresql://user:password@localhost:5432/mnbara_task_scheduler"
SCHEDULER_ENABLED=true
OPENEXCHANGERATES_API_KEY=your_api_key
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

### Health Check

```http
GET /health
```

### Tasks

```http
# Create task
POST /api/v1/tasks
Content-Type: application/json

{
  "title": "Update Currency Rates",
  "plugin": "currency-updater",
  "params": {
    "provider": "openexchangerates",
    "baseCurrency": "USD"
  },
  "triggers": [
    {
      "type": "schedule",
      "enabled": true,
      "hours": [0, 6, 12, 18],
      "minutes": [0]
    }
  ]
}

# Get all tasks
GET /api/v1/tasks

# Get task by ID
GET /api/v1/tasks/:id

# Update task
PUT /api/v1/tasks/:id

# Delete task
DELETE /api/v1/tasks/:id

# Run task manually
POST /api/v1/tasks/:id/run

# Get task executions
GET /api/v1/tasks/:id/executions?limit=50

# Get execution details
GET /api/v1/tasks/executions/:executionId
```

## Built-in Plugins

### 1. Notification Plugin

Send notifications for auctions, orders, etc.

```json
{
  "plugin": "notification",
  "params": {
    "checkAuctions": true,
    "alertBefore": 5
  }
}
```

### 2. Currency Plugin

Update currency exchange rates.

```json
{
  "plugin": "currency-updater",
  "params": {
    "provider": "openexchangerates",
    "baseCurrency": "USD"
  }
}
```

### 3. Cleanup Plugin

Clean old data from database.

```json
{
  "plugin": "data-cleanup",
  "params": {
    "olderThan": 30,
    "cleanExecutions": true,
    "cleanNotifications": true
  }
}
```

### 4. Report Plugin

Generate and send reports.

```json
{
  "plugin": "report-generator",
  "params": {
    "reportType": "daily-summary",
    "recipients": ["admin@mnbara.com"]
  }
}
```

## Example Tasks

### Auction Ending Soon Alert

```json
{
  "title": "Auction Ending Soon Alert",
  "description": "Send notifications 5 minutes before auction ends",
  "plugin": "notification",
  "params": {
    "checkAuctions": true,
    "alertBefore": 5
  },
  "triggers": [
    {
      "type": "interval",
      "enabled": true,
      "interval": 1
    }
  ]
}
```

### Daily Currency Update

```json
{
  "title": "Update Currency Rates",
  "description": "Update exchange rates every 6 hours",
  "plugin": "currency-updater",
  "params": {
    "provider": "openexchangerates"
  },
  "triggers": [
    {
      "type": "schedule",
      "enabled": true,
      "hours": [0, 6, 12, 18],
      "minutes": [0]
    }
  ]
}
```

### Weekly Cleanup

```json
{
  "title": "Weekly Data Cleanup",
  "description": "Clean data older than 30 days every Sunday at 3 AM",
  "plugin": "data-cleanup",
  "params": {
    "olderThan": 30,
    "cleanExecutions": true
  },
  "triggers": [
    {
      "type": "schedule",
      "enabled": true,
      "weekdays": [0],
      "hours": [3],
      "minutes": [0]
    }
  ]
}
```

### Daily Admin Report

```json
{
  "title": "Daily Admin Report",
  "description": "Send daily summary to admins at 9 AM",
  "plugin": "report-generator",
  "params": {
    "reportType": "daily-summary",
    "recipients": ["admin@mnbara.com"]
  },
  "triggers": [
    {
      "type": "schedule",
      "enabled": true,
      "hours": [9],
      "minutes": [0]
    }
  ]
}
```

## Creating Custom Plugins

Create a new plugin by implementing the `Plugin` interface:

```typescript
// src/plugins/my-plugin.ts
import { Plugin, ExecutionContext, PluginResult } from '../types/task.types';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  description = 'My custom plugin';

  async execute(params: any, context: ExecutionContext): Promise<PluginResult> {
    try {
      context.logger.info('Starting my plugin');

      // Your logic here
      const result = await this.doSomething(params);

      context.logger.info('Plugin completed successfully');

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      context.logger.error(`Plugin failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async doSomething(params: any) {
    // Implementation
    return { done: true };
  }
}
```

Register your plugin in `src/plugins/registry.ts`:

```typescript
import { MyPlugin } from './my-plugin';

private registerDefaults() {
  this.register(new MyPlugin());
  // ... other plugins
}
```

## Trigger Types

### Schedule (Cron-like)

```json
{
  "type": "schedule",
  "enabled": true,
  "hours": [9, 17],
  "minutes": [0, 30],
  "weekdays": [1, 2, 3, 4, 5]
}
```

### Interval

```json
{
  "type": "interval",
  "enabled": true,
  "interval": 60
}
```

### Manual

```json
{
  "type": "manual",
  "enabled": true
}
```

## Architecture

```
task-scheduler/
├── src/
│   ├── types/              # TypeScript types
│   ├── services/           # Core services
│   │   ├── scheduler.service.ts    # Scheduling engine
│   │   ├── executor.service.ts     # Task execution
│   │   └── task.service.ts         # CRUD operations
│   ├── plugins/            # Plugin system
│   │   ├── registry.ts
│   │   ├── notification.plugin.ts
│   │   ├── currency.plugin.ts
│   │   ├── cleanup.plugin.ts
│   │   └── report.plugin.ts
│   ├── controllers/        # HTTP controllers
│   ├── routes/             # API routes
│   ├── utils/              # Utilities
│   └── index.ts            # Entry point
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## Inspiration

This service is inspired by [xyOps](https://github.com/pixlcore/xyops), a next-generation workflow automation and server monitoring system.

## License

MIT

## Author

Mnbara Platform Team
