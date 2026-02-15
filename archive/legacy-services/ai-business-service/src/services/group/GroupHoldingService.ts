import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const GroupEntitySchema = z.object({
  groupName: z.string().min(1).max(200),
  groupDescription: z.string().optional(),
  groupType: z.enum(['holding', 'conglomerate', 'subsidiary_group']),
  legalStructure: z.string().min(1).max(100),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  headquartersCountry: z.string().length(2),
  headquartersAddress: z.string().optional(),
  primaryCurrency: z.string().default('USD'),
  consolidationCurrency: z.string().default('USD'),
  fiscalYearStart: z.string().datetime(),
  fiscalYearEnd: z.string().datetime(),
  consolidationMethod: z.enum(['full_consolidation', 'proportionate_consolidation', 'equity_method']).default('full_consolidation'),
  parentGroupId: z.string().uuid().optional(),
  createdBy: z.string().uuid()
});

const EntityMappingSchema = z.object({
  groupId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  entityType: z.enum(['parent', 'subsidiary', 'associate', 'joint_venture']),
  ownershipPercentage: z.number().min(0).max(100),
  votingRightsPercentage: z.number().min(0).max(100),
  controlPercentage: z.number().min(0).max(100),
  consolidationMethod: z.enum(['full_consolidation', 'proportionate_consolidation', 'equity_method']).default('full_consolidation'),
  effectiveDate: z.string().datetime(),
  terminationDate: z.string().datetime().optional(),
  createdBy: z.string().uuid()
});

const IntercompanyTransactionSchema = z.object({
  groupId: z.string().uuid(),
  transactionId: z.string().uuid(),
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  transactionType: z.enum(['sale', 'purchase', 'loan', 'dividend', 'management_fee', 'royalty', 'interest', 'other']),
  eliminationMethod: z.enum(['full_elimination', 'partial_elimination', 'no_elimination']).default('full_elimination'),
  eliminationPercentage: z.number().min(0).max(100).default(100),
  createdBy: z.string().uuid()
});

const ConsolidationSnapshotSchema = z.object({
  groupId: z.string().uuid(),
  snapshotName: z.string().min(1).max(200),
  snapshotDescription: z.string().optional(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  consolidationDate: z.string().datetime(),
  consolidationMethod: z.enum(['full_consolidation', 'proportionate_consolidation', 'equity_method']),
  currency: z.string().default('USD'),
  exchangeRates: z.record(z.number()).optional(),
  includedEntities: z.array(z.string()).optional(),
  excludedEntities: z.array(z.string()).optional(),
  createdBy: z.string().uuid()
});

export interface GroupEntity {
  id: string;
  groupName: string;
  groupDescription?: string;
  groupType: string;
  legalStructure: string;
  registrationNumber?: string;
  taxId?: string;
  headquartersCountry: string;
  headquartersAddress?: string;
  primaryCurrency: string;
  consolidationCurrency: string;
  fiscalYearStart: Date;
  fiscalYearEnd: Date;
  consolidationMethod: string;
  status: string;
  parentGroupId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityMapping {
  id: string;
  groupId: string;
  businessAccountId: string;
  entityType: string;
  ownershipPercentage: number;
  votingRightsPercentage: number;
  controlPercentage: number;
  consolidationMethod: string;
  effectiveDate: Date;
  terminationDate?: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntercompanyTransaction {
  id: string;
  groupId: string;
  transactionId: string;
  sourceEntityId: string;
  targetEntityId: string;
  transactionType: string;
  eliminationMethod: string;
  eliminationPercentage: number;
  eliminationJournalId?: string;
  isEliminated: boolean;
  eliminationDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsolidationSnapshot {
  id: string;
  groupId: string;
  snapshotName: string;
  snapshotDescription?: string;
  periodStart: Date;
  periodEnd: Date;
  consolidationDate: Date;
  consolidationMethod: string;
  currency: string;
  exchangeRates: Record<string, number>;
  includedEntities: string[];
  excludedEntities: string[];
  eliminationJournalId?: string;
  status: string;
  processingLog: any[];
  errorDetails?: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GroupHoldingService {
  // Group Entity Management
  async createGroupEntity(data: z.infer<typeof GroupEntitySchema>): Promise<GroupEntity> {
    const validated = GroupEntitySchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_group_entity(
        ${validated.groupName}::varchar,
        ${validated.groupDescription || null}::text,
        ${validated.groupType}::varchar,
        ${validated.legalStructure}::varchar,
        ${validated.registrationNumber || null}::varchar,
        ${validated.taxId || null}::varchar,
        ${validated.headquartersCountry}::varchar,
        ${validated.headquartersAddress || null}::text,
        ${validated.primaryCurrency}::varchar,
        ${validated.consolidationCurrency}::varchar,
        ${validated.fiscalYearStart}::date,
        ${validated.fiscalYearEnd}::date,
        ${validated.consolidationMethod}::varchar,
        ${validated.parentGroupId || null}::uuid,
        ${validated.createdBy}::uuid
      ) as group_id
    `;
    
    const groupId = (result as any)[0]?.group_id;
    return this.getGroupEntity(groupId);
  }

  async getGroupEntity(groupId: string): Promise<GroupEntity> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        group_name as "groupName",
        group_description as "groupDescription",
        group_type as "groupType",
        legal_structure as "legalStructure",
        registration_number as "registrationNumber",
        tax_id as "taxId",
        headquarters_country as "headquartersCountry",
        headquarters_address as "headquartersAddress",
        primary_currency as "primaryCurrency",
        consolidation_currency as "consolidationCurrency",
        fiscal_year_start as "fiscalYearStart",
        fiscal_year_end as "fiscalYearEnd",
        consolidation_method as "consolidationMethod",
        status,
        parent_group_id as "parentGroupId",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM group_entities
      WHERE id = ${groupId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getGroupEntities(filters: {
    status?: string;
    groupType?: string;
    parentGroupId?: string;
    limit?: number;
  } = {}): Promise<GroupEntity[]> {
    const { status, groupType, parentGroupId, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        group_name as "groupName",
        group_description as "groupDescription",
        group_type as "groupType",
        legal_structure as "legalStructure",
        registration_number as "registrationNumber",
        tax_id as "taxId",
        headquarters_country as "headquartersCountry",
        headquarters_address as "headquartersAddress",
        primary_currency as "primaryCurrency",
        consolidation_currency as "consolidationCurrency",
        fiscal_year_start as "fiscalYearStart",
        fiscal_year_end as "fiscalYearEnd",
        consolidation_method as "consolidationMethod",
        status,
        parent_group_id as "parentGroupId",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM group_entities
      WHERE 1=1
    `;
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (groupType) {
      query += ` AND group_type = '${groupType}'`;
    }
    
    if (parentGroupId) {
      query += ` AND parent_group_id = '${parentGroupId}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as GroupEntity[];
  }

  // Entity Mapping Management
  async mapEntityToGroup(data: z.infer<typeof EntityMappingSchema>): Promise<EntityMapping> {
    const validated = EntityMappingSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT map_entity_to_group(
        ${validated.groupId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityType}::varchar,
        ${validated.ownershipPercentage}::decimal,
        ${validated.votingRightsPercentage}::decimal,
        ${validated.controlPercentage}::decimal,
        ${validated.consolidationMethod}::varchar,
        ${validated.effectiveDate}::date,
        ${validated.terminationDate || null}::date,
        ${validated.createdBy}::uuid
      ) as mapping_id
    `;
    
    const mappingId = (result as any)[0]?.mapping_id;
    return this.getEntityMapping(mappingId);
  }

  async getEntityMapping(mappingId: string): Promise<EntityMapping> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        group_id as "groupId",
        business_account_id as "businessAccountId",
        entity_type as "entityType",
        ownership_percentage as "ownershipPercentage",
        voting_rights_percentage as "votingRightsPercentage",
        control_percentage as "controlPercentage",
        consolidation_method as "consolidationMethod",
        effective_date as "effectiveDate",
        termination_date as "terminationDate",
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM entity_mappings
      WHERE id = ${mappingId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getEntityMappings(groupId: string): Promise<EntityMapping[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        group_id as "groupId",
        business_account_id as "businessAccountId",
        entity_type as "entityType",
        ownership_percentage as "ownershipPercentage",
        voting_rights_percentage as "votingRightsPercentage",
        control_percentage as "controlPercentage",
        consolidation_method as "consolidationMethod",
        effective_date as "effectiveDate",
        termination_date as "terminationDate",
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM entity_mappings
      WHERE group_id = ${groupId}::uuid AND is_active = true
      ORDER BY effective_date DESC
    `;
    
    return result as EntityMapping[];
  }

  // Intercompany Transaction Management
  async tagIntercompanyTransaction(data: z.infer<typeof IntercompanyTransactionSchema>): Promise<IntercompanyTransaction> {
    const validated = IntercompanyTransactionSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT tag_intercompany_transaction(
        ${validated.groupId}::uuid,
        ${validated.transactionId}::uuid,
        ${validated.sourceEntityId}::uuid,
        ${validated.targetEntityId}::uuid,
        ${validated.transactionType}::varchar,
        ${validated.eliminationMethod}::varchar,
        ${validated.eliminationPercentage}::decimal,
        ${validated.createdBy}::uuid
      ) as intercompany_id
    `;
    
    const intercompanyId = (result as any)[0]?.intercompany_id;
    return this.getIntercompanyTransaction(intercompanyId);
  }

  async getIntercompanyTransaction(intercompanyId: string): Promise<IntercompanyTransaction> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        group_id as "groupId",
        transaction_id as "transactionId",
        source_entity_id as "sourceEntityId",
        target_entity_id as "targetEntityId",
        transaction_type as "transactionType",
        elimination_method as "eliminationMethod",
        elimination_percentage as "eliminationPercentage",
        elimination_journal_id as "eliminationJournalId",
        is_eliminated as "isEliminated",
        elimination_date as "eliminationDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM intercompany_transactions
      WHERE id = ${intercompanyId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getIntercompanyTransactions(groupId: string, filters: {
    isEliminated?: boolean;
    transactionType?: string;
    limit?: number;
  } = {}): Promise<IntercompanyTransaction[]> {
    const { isEliminated, transactionType, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        group_id as "groupId",
        transaction_id as "transactionId",
        source_entity_id as "sourceEntityId",
        target_entity_id as "targetEntityId",
        transaction_type as "transactionType",
        elimination_method as "eliminationMethod",
        elimination_percentage as "eliminationPercentage",
        elimination_journal_id as "eliminationJournalId",
        is_eliminated as "isEliminated",
        elimination_date as "eliminationDate",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM intercompany_transactions
      WHERE group_id = ${groupId}::uuid
    `;
    
    if (isEliminated !== undefined) {
      query += ` AND is_eliminated = ${isEliminated}`;
    }
    
    if (transactionType) {
      query += ` AND transaction_type = '${transactionType}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as IntercompanyTransaction[];
  }

  // Consolidation Snapshot Management
  async createConsolidationSnapshot(data: z.infer<typeof ConsolidationSnapshotSchema>): Promise<ConsolidationSnapshot> {
    const validated = ConsolidationSnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_consolidation_snapshot(
        ${validated.groupId}::uuid,
        ${validated.snapshotName}::varchar,
        ${validated.snapshotDescription || null}::text,
        ${validated.periodStart}::date,
        ${validated.periodEnd}::date,
        ${validated.consolidationDate}::date,
        ${validated.consolidationMethod}::varchar,
        ${validated.currency}::varchar,
        ${JSON.stringify(validated.exchangeRates || {})}::jsonb,
        ${JSON.stringify(validated.includedEntities || [])}::jsonb,
        ${JSON.stringify(validated.excludedEntities || [])}::jsonb,
        ${validated.createdBy}::uuid
      ) as snapshot_id
    `;
    
    const snapshotId = (result as any)[0]?.snapshot_id;
    return this.getConsolidationSnapshot(snapshotId);
  }

  async getConsolidationSnapshot(snapshotId: string): Promise<ConsolidationSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        group_id as "groupId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        period_start as "periodStart",
        period_end as "periodEnd",
        consolidation_date as "consolidationDate",
        consolidation_method as "consolidationMethod",
        currency,
        exchange_rates as "exchangeRates",
        included_entities as "includedEntities",
        excluded_entities as "excludedEntities",
        elimination_journal_id as "eliminationJournalId",
        status,
        processing_log as "processingLog",
        error_details as "errorDetails",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM consolidation_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getConsolidationSnapshots(groupId: string, filters: {
    status?: string;
    periodStart?: string;
    periodEnd?: string;
    limit?: number;
  } = {}): Promise<ConsolidationSnapshot[]> {
    const { status, periodStart, periodEnd, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        group_id as "groupId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        period_start as "periodStart",
        period_end as "periodEnd",
        consolidation_date as "consolidationDate",
        consolidation_method as "consolidationMethod",
        currency,
        exchange_rates as "exchangeRates",
        included_entities as "includedEntities",
        excluded_entities as "excludedEntities",
        elimination_journal_id as "eliminationJournalId",
        status,
        processing_log as "processingLog",
        error_details as "errorDetails",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM consolidation_snapshots
      WHERE group_id = ${groupId}::uuid
    `;
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (periodStart) {
      query += ` AND period_start >= '${periodStart}'`;
    }
    
    if (periodEnd) {
      query += ` AND period_end <= '${periodEnd}'`;
    }
    
    query += ` ORDER BY consolidation_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as ConsolidationSnapshot[];
  }

  // Analytics and Summary
  async getGroupConsolidationSummary(groupId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM group_consolidation_summary
      WHERE group_id = ${groupId}::uuid
    `;
    
    return result as any[];
  }

  async getEntityPerformanceComparison(groupId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM entity_performance_comparison
      WHERE group_id = ${groupId}::uuid
      ORDER BY revenue_rank ASC
    `;
    
    return result as any[];
  }

  async getConsolidationDashboard(groupId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM consolidation_dashboard
      WHERE group_id = ${groupId}::uuid
      ORDER BY consolidation_created_at DESC
    `;
    
    return result as any[];
  }

  // Materialized View Refresh
  async refreshGroupAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_group_materialized_views()`;
  }

  // Activity Logging
  async logActivity(data: {
    groupId: string;
    activityType: string;
    activityDescription: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    performedBy?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    activityDurationMs?: number;
    dataVolumeBytes?: number;
    additionalData?: any;
  }): Promise<void> {
    await prisma.$queryRaw`
      INSERT INTO group_activity_log (
        id,
        group_id,
        activity_type,
        activity_description,
        entity_type,
        entity_id,
        entity_name,
        performed_by,
        user_role,
        user_email,
        session_id,
        ip_address,
        user_agent,
        activity_duration_ms,
        data_volume_bytes,
        additional_data,
        performed_at
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.groupId}::uuid,
        ${data.activityType}::varchar,
        ${data.activityDescription}::text,
        ${data.entityType || null}::varchar,
        ${data.entityId || null}::uuid,
        ${data.entityName || null}::varchar,
        ${data.performedBy || null}::uuid,
        ${data.userRole || null}::varchar,
        ${data.userEmail || null}::varchar,
        ${data.sessionId || null}::varchar,
        ${data.ipAddress || null}::inet,
        ${data.userAgent || null}::text,
        ${data.activityDurationMs || null}::integer,
        ${data.dataVolumeBytes || null}::integer,
        ${JSON.stringify(data.additionalData || {})}::jsonb,
        CURRENT_TIMESTAMP::timestamp
      )
    `;
  }
}
