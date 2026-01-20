import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateGuaranteeRuleDto, UpdateGuaranteeRuleDto } from './dto/guarantee-rule.dto';

@Injectable()
export class GuaranteeRulesService implements OnModuleInit {
  private readonly logger = new Logger(GuaranteeRulesService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.initTable();
  }

  private async initTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS guarantee_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applies_to VARCHAR(50) NOT NULL,
        coverage INTEGER NOT NULL DEFAULT 100,
        max_amount NUMERIC(10, 2) NOT NULL,
        auto_actions JSONB DEFAULT '{}',
        conditions JSONB DEFAULT '{}',
        thresholds JSONB DEFAULT '{}',
        escalation JSONB DEFAULT '{}',
        priority INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await this.db.query(query);
      this.logger.log('Guarantee Rules table initialized');
    } catch (e) {
      this.logger.error('Failed to initialize Guarantee Rules table', e);
    }
  }

  async findAll() {
    const rules = await this.db.findMany('guarantee_rules', {}, { orderBy: 'priority ASC' });
    return rules.map(this.mapToModel);
  }

  async findOne(id: number) {
    const rule = await this.db.findOne('guarantee_rules', { id });
    return rule ? this.mapToModel(rule) : null;
  }

  async create(dto: CreateGuaranteeRuleDto) {
    const rule = await this.db.insert('guarantee_rules', {
      name: dto.name,
      applies_to: dto.appliesTo,
      coverage: dto.coverage,
      max_amount: dto.maxAmount,
      auto_actions: JSON.stringify(dto.autoActions),
      conditions: JSON.stringify(dto.conditions),
      thresholds: JSON.stringify(dto.thresholds),
      escalation: JSON.stringify(dto.escalation),
      priority: dto.priority,
      enabled: dto.enabled
    });
    return this.mapToModel(rule);
  }

  async update(id: number, dto: UpdateGuaranteeRuleDto) {
    const rules = await this.db.update('guarantee_rules', { id }, {
      name: dto.name,
      applies_to: dto.appliesTo,
      coverage: dto.coverage,
      max_amount: dto.maxAmount,
      auto_actions: JSON.stringify(dto.autoActions),
      conditions: JSON.stringify(dto.conditions),
      thresholds: JSON.stringify(dto.thresholds),
      escalation: JSON.stringify(dto.escalation),
      priority: dto.priority,
      enabled: dto.enabled,
      updated_at: new Date().toISOString()
    });
    return rules[0] ? this.mapToModel(rules[0]) : null;
  }

  async delete(id: number) {
    return this.db.delete('guarantee_rules', { id });
  }

  private mapToModel(row: any) {
    return {
      id: row.id.toString(),
      name: row.name,
      appliesTo: row.applies_to,
      coverage: row.coverage,
      maxAmount: parseFloat(row.max_amount),
      autoActions: typeof row.auto_actions === 'string' ? JSON.parse(row.auto_actions) : row.auto_actions,
      conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions,
      thresholds: typeof row.thresholds === 'string' ? JSON.parse(row.thresholds) : row.thresholds,
      escalation: typeof row.escalation === 'string' ? JSON.parse(row.escalation) : row.escalation,
      priority: row.priority,
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
