import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigMgmtService {
  private readonly logger = new Logger(ConfigMgmtService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getByKey(key: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (!config) return null;
    if (config.isSecret) return { ...config, value: '***HIDDEN***' };
    return config;
  }

  async list(category?: string) {
    const configs = await this.prisma.systemConfig.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: 'asc' },
    });
    return configs.map((c: any) => ({
      ...c,
      value: c.isSecret ? '***HIDDEN***' : c.value,
    }));
  }

  async set(key: string, data: { value: any; description?: string; isSecret?: boolean; category?: string }, updatedBy: string) {
    const config = await this.prisma.systemConfig.upsert({
      where: { key },
      create: {
        key, value: data.value, category: data.category || 'general',
        description: data.description, isSecret: data.isSecret || false, updatedBy,
      },
      update: {
        value: data.value, description: data.description,
        isSecret: data.isSecret, updatedBy,
      },
    });
    return { ...config, value: config.isSecret ? '***HIDDEN***' : config.value };
  }

  async delete(key: string) {
    await this.prisma.systemConfig.delete({ where: { key } });
  }

  async getCategories() {
    const configs = await this.prisma.systemConfig.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return configs.map((c: any) => c.category);
  }
}
