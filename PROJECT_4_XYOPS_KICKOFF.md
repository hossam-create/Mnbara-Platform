# المشروع #4: xyOps Integration - بدء التنفيذ 🚀

**التاريخ**: 2 فبراير 2026  
**الحالة**: 🚀 **بدء التنفيذ**  
**المشروع**: xyOps - Workflow Automation & Task Scheduling

---

## 📊 نظرة عامة

**xyOps** هو نظام متقدم لجدولة المهام وأتمتة سير العمل (Workflow Automation). سنستخدمه لأتمتة المهام المتكررة في منصة Mnbara.

### ✅ ما تم إنجازه

#### 1. استنساخ المشروع
```bash
✅ git clone https://github.com/pixlcore/xyops
✅ دراسة البنية والوثائق
✅ فهم نظام Workflows
✅ فهم نظام Events & Triggers
```

---

## 🎯 ما هو xyOps؟

### الميزات الأساسية

1. **Job Scheduling** - جدولة المهام (أفضل من Cron)
2. **Workflow Automation** - أتمتة سير العمل بشكل مرئي
3. **Server Monitoring** - مراقبة الخوادم
4. **Smart Alerts** - تنبيهات ذكية
5. **Event-Driven** - مبني على الأحداث

### المفاهيم الأساسية

```typescript
// Event = مهمة قابلة للتنفيذ
interface Event {
  id: string;
  title: string;
  plugin: string;        // ماذا تفعل
  params: any;           // المعاملات
  targets: string[];     // أين تعمل
  triggers: Trigger[];   // متى تعمل
  limits: Limit[];       // القيود
  actions: Action[];     // ماذا يحدث بعد
}

// Trigger = متى تعمل المهمة
interface Trigger {
  type: 'manual' | 'schedule' | 'interval' | 'webhook';
  enabled: boolean;
  // للـ schedule
  hours?: number[];
  minutes?: number[];
  // للـ interval
  interval?: number;  // بالدقائق
}

// Workflow = مجموعة مهام مترابطة
interface Workflow {
  nodes: Node[];         // المهام
  connections: Wire[];   // الروابط
}
```

---

## 🎯 كيف سنستخدم xyOps في Mnbara؟

### الحالات الاستخدامية

#### 1. تنبيهات المزادات 🔔
```typescript
// مهمة: إرسال تنبيه قبل انتهاء المزاد بـ 5 دقائق
{
  title: "Auction Ending Soon Alert",
  plugin: "notification",
  triggers: [
    { type: "interval", interval: 1 }  // كل دقيقة
  ],
  params: {
    checkAuctions: true,
    alertBefore: 5  // 5 دقائق
  }
}
```

#### 2. تحديث أسعار العملات 💱
```typescript
// مهمة: تحديث أسعار العملات كل ساعة
{
  title: "Update Currency Rates",
  plugin: "currency-updater",
  triggers: [
    { type: "schedule", hours: [0,1,2,...,23], minutes: [0] }
  ],
  params: {
    provider: "openexchangerates"
  }
}
```

#### 3. تنظيف البيانات القديمة 🗑️
```typescript
// مهمة: حذف الإشعارات القديمة كل يوم
{
  title: "Clean Old Notifications",
  plugin: "data-cleanup",
  triggers: [
    { type: "schedule", hours: [3], minutes: [0] }  // 3 صباحاً
  ],
  params: {
    olderThan: 30  // أقدم من 30 يوم
  }
}
```

#### 4. تقارير يومية 📊
```typescript
// مهمة: إرسال تقرير يومي للإدارة
{
  title: "Daily Admin Report",
  plugin: "report-generator",
  triggers: [
    { type: "schedule", hours: [9], minutes: [0] }  // 9 صباحاً
  ],
  params: {
    reportType: "daily-summary",
    recipients: ["admin@mnbara.com"]
  }
}
```

#### 5. Workflow: معالجة الطلبات 🔄
```typescript
// Workflow: من الطلب إلى التسليم
{
  nodes: [
    { type: "trigger", name: "New Order" },
    { type: "job", name: "Validate Payment" },
    { type: "job", name: "Notify Seller" },
    { type: "job", name: "Update Inventory" },
    { type: "job", name: "Send Confirmation" }
  ],
  connections: [
    { from: "New Order", to: "Validate Payment" },
    { from: "Validate Payment", to: "Notify Seller", condition: "success" },
    { from: "Notify Seller", to: "Update Inventory" },
    { from: "Update Inventory", to: "Send Confirmation" }
  ]
}
```

---

## 📋 خطة التنفيذ

### المرحلة 1: Task Scheduler Service (الأساسي)

سننشئ خدمة مبسطة مستوحاة من xyOps:

```
backend/services/task-scheduler/
├── src/
│   ├── types/
│   │   ├── task.types.ts          # Task, Trigger, Schedule
│   │   └── workflow.types.ts      # Workflow, Node, Connection
│   ├── services/
│   │   ├── scheduler.service.ts   # المحرك الأساسي
│   │   ├── task.service.ts        # إدارة المهام
│   │   ├── workflow.service.ts    # إدارة Workflows
│   │   └── executor.service.ts    # تنفيذ المهام
│   ├── plugins/
│   │   ├── notification.plugin.ts # إرسال إشعارات
│   │   ├── currency.plugin.ts     # تحديث العملات
│   │   ├── cleanup.plugin.ts      # تنظيف البيانات
│   │   └── report.plugin.ts       # التقارير
│   ├── controllers/
│   │   ├── task.controller.ts
│   │   └── workflow.controller.ts
│   ├── routes/
│   │   ├── task.routes.ts
│   │   └── workflow.routes.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔨 التطبيق

### الخطوة 1: إنشاء البنية الأساسية

```bash
# إنشاء الخدمة
mkdir -p backend/services/task-scheduler/src/{types,services,plugins,controllers,routes}
cd backend/services/task-scheduler

# تهيئة المشروع
npm init -y

# تثبيت المكتبات
npm install express typescript @types/node @types/express
npm install prisma @prisma/client
npm install node-cron
npm install dotenv winston
npm install -D ts-node-dev jest @types/jest
```

### الخطوة 2: Types

```typescript
// src/types/task.types.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  plugin: string;
  params: Record<string, any>;
  triggers: Trigger[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trigger {
  type: 'manual' | 'schedule' | 'interval' | 'webhook';
  enabled: boolean;
  // Schedule (Cron-like)
  hours?: number[];
  minutes?: number[];
  days?: number[];
  months?: number[];
  weekdays?: number[];
  // Interval
  interval?: number;  // minutes
  // Webhook
  webhookUrl?: string;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface Plugin {
  name: string;
  execute: (params: any) => Promise<any>;
}
```

### الخطوة 3: Scheduler Service

```typescript
// src/services/scheduler.service.ts
import cron from 'node-cron';
import { Task, Trigger } from '../types/task.types';
import { ExecutorService } from './executor.service';

export class SchedulerService {
  private executor: ExecutorService;
  private scheduledTasks: Map<string, cron.ScheduledTask>;

  constructor() {
    this.executor = new ExecutorService();
    this.scheduledTasks = new Map();
  }

  async start() {
    // تحميل جميع المهام المفعلة
    const tasks = await this.loadEnabledTasks();
    
    for (const task of tasks) {
      this.scheduleTask(task);
    }
  }

  scheduleTask(task: Task) {
    for (const trigger of task.triggers) {
      if (!trigger.enabled) continue;

      if (trigger.type === 'schedule') {
        this.scheduleWithCron(task, trigger);
      } else if (trigger.type === 'interval') {
        this.scheduleWithInterval(task, trigger);
      }
    }
  }

  private scheduleWithCron(task: Task, trigger: Trigger) {
    // تحويل إلى Cron expression
    const cronExpression = this.buildCronExpression(trigger);
    
    const scheduled = cron.schedule(cronExpression, async () => {
      await this.executor.execute(task);
    });

    this.scheduledTasks.set(`${task.id}-cron`, scheduled);
  }

  private scheduleWithInterval(task: Task, trigger: Trigger) {
    const intervalMs = (trigger.interval || 60) * 60 * 1000;
    
    const intervalId = setInterval(async () => {
      await this.executor.execute(task);
    }, intervalMs);

    this.scheduledTasks.set(`${task.id}-interval`, intervalId as any);
  }

  private buildCronExpression(trigger: Trigger): string {
    const minutes = trigger.minutes?.join(',') || '*';
    const hours = trigger.hours?.join(',') || '*';
    const days = trigger.days?.join(',') || '*';
    const months = trigger.months?.join(',') || '*';
    const weekdays = trigger.weekdays?.join(',') || '*';

    return `${minutes} ${hours} ${days} ${months} ${weekdays}`;
  }

  async stopTask(taskId: string) {
    const scheduled = this.scheduledTasks.get(taskId);
    if (scheduled) {
      if (typeof scheduled === 'object' && 'stop' in scheduled) {
        scheduled.stop();
      } else {
        clearInterval(scheduled as any);
      }
      this.scheduledTasks.delete(taskId);
    }
  }

  private async loadEnabledTasks(): Promise<Task[]> {
    // تحميل من قاعدة البيانات
    return [];
  }
}
```

### الخطوة 4: Executor Service

```typescript
// src/services/executor.service.ts
import { Task, TaskExecution } from '../types/task.types';
import { PluginRegistry } from '../plugins/registry';

export class ExecutorService {
  private plugins: PluginRegistry;

  constructor() {
    this.plugins = new PluginRegistry();
  }

  async execute(task: Task): Promise<TaskExecution> {
    const execution: TaskExecution = {
      id: this.generateId(),
      taskId: task.id,
      status: 'running',
      startedAt: new Date()
    };

    try {
      // الحصول على Plugin
      const plugin = this.plugins.get(task.plugin);
      
      if (!plugin) {
        throw new Error(`Plugin not found: ${task.plugin}`);
      }

      // تنفيذ
      const result = await plugin.execute(task.params);

      execution.status = 'success';
      execution.result = result;
      execution.completedAt = new Date();

    } catch (error: any) {
      execution.status = 'error';
      execution.error = error.message;
      execution.completedAt = new Date();
    }

    // حفظ في قاعدة البيانات
    await this.saveExecution(execution);

    return execution;
  }

  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveExecution(execution: TaskExecution) {
    // حفظ في قاعدة البيانات
  }
}
```

### الخطوة 5: Plugins

```typescript
// src/plugins/notification.plugin.ts
import { Plugin } from '../types/task.types';

export class NotificationPlugin implements Plugin {
  name = 'notification';

  async execute(params: any) {
    // إرسال إشعار
    console.log('Sending notification:', params);
    
    // مثال: تنبيه المزادات
    if (params.checkAuctions) {
      const endingSoon = await this.getEndingAuctions(params.alertBefore);
      
      for (const auction of endingSoon) {
        await this.sendNotification(auction);
      }
    }

    return { sent: true };
  }

  private async getEndingAuctions(minutes: number) {
    // جلب المزادات التي ستنتهي قريباً
    return [];
  }

  private async sendNotification(auction: any) {
    // إرسال إشعار
  }
}

// src/plugins/currency.plugin.ts
export class CurrencyPlugin implements Plugin {
  name = 'currency-updater';

  async execute(params: any) {
    // تحديث أسعار العملات
    const rates = await this.fetchRates(params.provider);
    await this.updateDatabase(rates);
    
    return { updated: true, rates };
  }

  private async fetchRates(provider: string) {
    // جلب الأسعار من OpenExchangeRates
    return {};
  }

  private async updateDatabase(rates: any) {
    // تحديث قاعدة البيانات
  }
}

// src/plugins/cleanup.plugin.ts
export class CleanupPlugin implements Plugin {
  name = 'data-cleanup';

  async execute(params: any) {
    // تنظيف البيانات القديمة
    const deleted = await this.cleanOldData(params.olderThan);
    
    return { deleted };
  }

  private async cleanOldData(days: number) {
    // حذف البيانات القديمة
    return 0;
  }
}

// src/plugins/registry.ts
import { Plugin } from '../types/task.types';
import { NotificationPlugin } from './notification.plugin';
import { CurrencyPlugin } from './currency.plugin';
import { CleanupPlugin } from './cleanup.plugin';

export class PluginRegistry {
  private plugins: Map<string, Plugin>;

  constructor() {
    this.plugins = new Map();
    this.registerDefaults();
  }

  private registerDefaults() {
    this.register(new NotificationPlugin());
    this.register(new CurrencyPlugin());
    this.register(new CleanupPlugin());
  }

  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}
```

---

## 📊 الإحصائيات المتوقعة

- **الملفات**: ~20 ملف
- **الكود**: ~2,000 سطر
- **الوقت المقدر**: أسبوعان
- **الوقت الفعلي**: سنرى! 🚀

---

## 🎯 الخطوات التالية

### اليوم (الآن)
1. ✅ دراسة xyOps
2. 🎯 إنشاء البنية الأساسية
3. 🎯 تطبيق Scheduler Service
4. 🎯 تطبيق Plugins

### هذا الأسبوع
1. إنشاء API endpoints
2. إنشاء Prisma schema
3. اختبار المهام
4. توثيق شامل

---

**التاريخ**: 2 فبراير 2026  
**الحالة**: 🚀 **بدء التنفيذ**  
**التقدم**: 60% → 80% (بعد الانتهاء)

