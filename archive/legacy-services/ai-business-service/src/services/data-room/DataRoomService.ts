import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const DataRoomFolderSchema = z.object({
  businessAccountId: z.string().uuid(),
  parentFolderId: z.string().uuid().optional(),
  folderName: z.string().min(1).max(200),
  folderType: z.enum(['financial', 'legal', 'operational', 'governance', 'contracts', 'tax', 'risk', 'kpi']),
  description: z.string().optional(),
  accessLevel: z.enum(['public', 'confidential', 'restricted', 'classified']).default('confidential'),
  sortOrder: z.number().default(0),
  isSystemFolder: z.boolean().default(false),
  createdBy: z.string().uuid()
});

const DataRoomDocumentSchema = z.object({
  folderId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  documentName: z.string().min(1).max(300),
  documentType: z.enum(['financial_statement', 'ledger_extract', 'fpna_model', 'contract', 'corporate_doc', 'tax_summary', 'risk_register', 'kpi_report', 'evidence', 'other']),
  filePath: z.string().min(1),
  fileSizeBytes: z.number().min(0),
  fileFormat: z.enum(['pdf', 'docx', 'xlsx', 'csv', 'txt', 'zip']),
  mimeType: z.string().min(1),
  sensitivityLevel: z.enum(['public', 'confidential', 'restricted', 'classified']).default('confidential'),
  dataClassification: z.enum(['financial', 'legal', 'operational', 'governance', 'strategic']).default('financial'),
  sourceSystem: z.string().optional(),
  sourceEntityType: z.string().optional(),
  sourceEntityId: z.string().uuid().optional(),
  sourceDataHash: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  language: z.enum(['en', 'ar']).default('en'),
  requiresNda: z.boolean().default(false),
  ndaVersion: z.string().optional(),
  watermarkEnabled: z.boolean().default(true),
  watermarkText: z.string().optional(),
  uploadedBy: z.string().uuid()
});

const DataRoomAccessControlSchema = z.object({
  businessAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  accessRole: z.enum(['data_room_admin', 'due_diligence_lead', 'legal_counsel', 'financial_analyst', 'auditor', 'viewer']),
  canViewFinancial: z.boolean().default(false),
  canViewLegal: z.boolean().default(false),
  canViewOperational: z.boolean().default(false),
  canViewGovernance: z.boolean().default(false),
  canViewContracts: z.boolean().default(false),
  canViewTax: z.boolean().default(false),
  canViewRisk: z.boolean().default(false),
  canViewKpi: z.boolean().default(false),
  canDownloadDocuments: z.boolean().default(false),
  canPrintDocuments: z.boolean().default(false),
  canShareDocuments: z.boolean().default(false),
  canUploadDocuments: z.boolean().default(false),
  canDeleteDocuments: z.boolean().default(false),
  accessEndDate: z.string().datetime().optional(),
  ipRestrictionEnabled: z.boolean().default(false),
  allowedIpRanges: z.array(z.string()).optional(),
  sessionTimeoutMinutes: z.number().default(120),
  requireMfa: z.boolean().default(true),
  deviceRestrictionEnabled: z.boolean().default(false),
  ndaSigned: z.boolean().default(false),
  ndaSignedDate: z.string().datetime().optional(),
  ndaVersion: z.string().optional(),
  grantedBy: z.string().uuid()
});

const DataRoomEvidencePackSchema = z.object({
  businessAccountId: z.string().uuid(),
  snapshotId: z.string().uuid().optional(),
  packName: z.string().min(1).max(200),
  packType: z.enum(['financial_due_diligence', 'legal_review', 'operational_audit', 'risk_assessment', 'custom']),
  packDescription: z.string().optional(),
  includedFolders: z.array(z.string()),
  includedDocuments: z.array(z.string().uuid()),
  accessLevel: z.enum(['public', 'confidential', 'restricted', 'classified']).default('restricted'),
  requiresApproval: z.boolean().default(true),
  generatedBy: z.string().uuid()
});

export interface DataRoomFolder {
  id: string;
  businessAccountId: string;
  parentFolderId?: string;
  folderName: string;
  folderPath: string;
  folderType: string;
  description?: string;
  accessLevel: string;
  sortOrder: number;
  isSystemFolder: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface DataRoomDocument {
  id: string;
  folderId: string;
  businessAccountId: string;
  documentName: string;
  documentType: string;
  filePath: string;
  fileSizeBytes: number;
  fileFormat: string;
  mimeType: string;
  sensitivityLevel: string;
  dataClassification: string;
  versionNumber: number;
  isLatestVersion: boolean;
  parentDocumentId?: string;
  sourceSystem?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  sourceDataHash?: string;
  extractionTimestamp?: Date;
  verificationStatus: string;
  description?: string;
  tags: string[];
  keywords: string[];
  language: string;
  requiresNda: boolean;
  ndaVersion?: string;
  watermarkEnabled: boolean;
  watermarkText?: string;
  createdAt: Date;
  createdBy: string;
  uploadedAt: Date;
  uploadedBy: string;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
}

export interface DataRoomAccessControl {
  id: string;
  businessAccountId: string;
  userId: string;
  accessRole: string;
  canViewFinancial: boolean;
  canViewLegal: boolean;
  canViewOperational: boolean;
  canViewGovernance: boolean;
  canViewContracts: boolean;
  canViewTax: boolean;
  canViewRisk: boolean;
  canViewKpi: boolean;
  canDownloadDocuments: boolean;
  canPrintDocuments: boolean;
  canShareDocuments: boolean;
  canUploadDocuments: boolean;
  canDeleteDocuments: boolean;
  accessStartDate: Date;
  accessEndDate?: Date;
  ipRestrictionEnabled: boolean;
  allowedIpRanges: string[];
  sessionTimeoutMinutes: number;
  requireMfa: boolean;
  deviceRestrictionEnabled: boolean;
  ndaSigned: boolean;
  ndaSignedDate?: Date;
  ndaVersion?: string;
  grantedAt: Date;
  grantedBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  lastAccessedAt?: Date;
  accessCount: number;
}

export interface DataRoomEvidencePack {
  id: string;
  businessAccountId: string;
  snapshotId?: string;
  packName: string;
  packType: string;
  packDescription?: string;
  includedFolders: string[];
  includedDocuments: string[];
  totalDocuments: number;
  totalSizeBytes: number;
  verificationStatus: string;
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  accessLevel: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  generatedAt: Date;
  generatedBy: string;
  generationDurationMs?: number;
  templateVersion: string;
  packFilePath?: string;
  packFileFormat?: string;
  packFileSizeBytes?: number;
  downloadCount: number;
  status: string;
  expiresAt?: Date;
  watermarkEnabled: boolean;
  watermarkText?: string;
  createdAt: Date;
}

export class DataRoomService {
  // Data Room Structure Management
  async generateDataRoomStructure(businessAccountId: string, createdBy: string): Promise<void> {
    await prisma.$queryRaw`
      SELECT generate_data_room_structure(
        ${businessAccountId}::uuid,
        ${createdBy}::uuid
      )
    `;
  }

  async createFolder(data: z.infer<typeof DataRoomFolderSchema>): Promise<DataRoomFolder> {
    const validated = DataRoomFolderSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO data_room_folders (
        id,
        business_account_id,
        parent_folder_id,
        folder_name,
        folder_path,
        folder_type,
        description,
        access_level,
        sort_order,
        is_system_folder,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.parentFolderId || null}::uuid,
        ${validated.folderName}::varchar,
        COALESCE(
          (SELECT folder_path FROM data_room_folders WHERE id = ${validated.parentFolderId || null}::uuid),
          '/' || ${validated.folderName}::varchar
        )::varchar,
        ${validated.folderType}::varchar,
        ${validated.description || null}::text,
        ${validated.accessLevel}::varchar,
        ${validated.sortOrder}::integer,
        ${validated.isSystemFolder}::boolean,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getFolders(businessAccountId: string, filters: {
    folderType?: string;
    parentFolderId?: string;
    includeSystemFolders?: boolean;
  } = {}): Promise<DataRoomFolder[]> {
    const { folderType, parentFolderId, includeSystemFolders = true } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        parent_folder_id as "parentFolderId",
        folder_name as "folderName",
        folder_path as "folderPath",
        folder_type as "folderType",
        description,
        access_level as "accessLevel",
        sort_order as "sortOrder",
        is_system_folder as "isSystemFolder",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM data_room_folders
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (folderType) {
      query += ` AND folder_type = '${folderType}'`;
    }
    
    if (parentFolderId) {
      query += ` AND parent_folder_id = ${parentFolderId}::uuid`;
    } else {
      query += ` AND parent_folder_id IS NULL`;
    }
    
    if (!includeSystemFolders) {
      query += ` AND is_system_folder = false`;
    }
    
    query += ` ORDER BY sort_order ASC, folder_name ASC`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DataRoomFolder[];
  }

  // Document Management
  async uploadDocument(data: z.infer<typeof DataRoomDocumentSchema>): Promise<DataRoomDocument> {
    const validated = DataRoomDocumentSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO data_room_documents (
        id,
        folder_id,
        business_account_id,
        document_name,
        document_type,
        file_path,
        file_size_bytes,
        file_format,
        mime_type,
        sensitivity_level,
        data_classification,
        version_number,
        is_latest_version,
        source_system,
        source_entity_type,
        source_entity_id,
        source_data_hash,
        extraction_timestamp,
        verification_status,
        description,
        tags,
        keywords,
        language,
        requires_nda,
        nda_version,
        watermark_enabled,
        watermark_text,
        uploaded_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.folderId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.documentName}::varchar,
        ${validated.documentType}::varchar,
        ${validated.filePath}::varchar,
        ${validated.fileSizeBytes}::integer,
        ${validated.fileFormat}::varchar,
        ${validated.mimeType}::varchar,
        ${validated.sensitivityLevel}::varchar,
        ${validated.dataClassification}::varchar,
        1::integer,
        true::boolean,
        ${validated.sourceSystem || null}::varchar,
        ${validated.sourceEntityType || null}::varchar,
        ${validated.sourceEntityId || null}::uuid,
        ${validated.sourceDataHash || null}::varchar,
        CURRENT_TIMESTAMP::timestamp,
        'verified'::varchar,
        ${validated.description || null}::text,
        ${JSON.stringify(validated.tags || [])}::jsonb,
        ${JSON.stringify(validated.keywords || [])}::jsonb,
        ${validated.language}::varchar,
        ${validated.requiresNda}::boolean,
        ${validated.ndaVersion || null}::varchar,
        ${validated.watermarkEnabled}::boolean,
        ${validated.watermarkText || null}::varchar,
        ${validated.uploadedBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getDocuments(businessAccountId: string, filters: {
    folderId?: string;
    documentType?: string;
    sensitivityLevel?: string;
    dataClassification?: string;
    latestVersionOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<DataRoomDocument[]> {
    const { 
      folderId, 
      documentType, 
      sensitivityLevel, 
      dataClassification, 
      latestVersionOnly = true,
      limit = 50,
      offset = 0 
    } = filters;
    
    let query = `
      SELECT 
        id,
        folder_id as "folderId",
        business_account_id as "businessAccountId",
        document_name as "documentName",
        document_type as "documentType",
        file_path as "filePath",
        file_size_bytes as "fileSizeBytes",
        file_format as "fileFormat",
        mime_type as "mimeType",
        sensitivity_level as "sensitivityLevel",
        data_classification as "dataClassification",
        version_number as "versionNumber",
        is_latest_version as "isLatestVersion",
        parent_document_id as "parentDocumentId",
        source_system as "sourceSystem",
        source_entity_type as "sourceEntityType",
        source_entity_id as "sourceEntityId",
        source_data_hash as "sourceDataHash",
        extraction_timestamp as "extractionTimestamp",
        verification_status as "verificationStatus",
        description,
        tags,
        keywords,
        language,
        requires_nda as "requiresNda",
        nda_version as "ndaVersion",
        watermark_enabled as "watermarkEnabled",
        watermark_text as "watermarkText",
        created_at as "createdAt",
        created_by as "createdBy",
        uploaded_at as "uploadedAt",
        uploaded_by as "uploadedBy",
        last_accessed_at as "lastAccessedAt",
        last_accessed_by as "lastAccessedBy"
      FROM data_room_documents
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (folderId) {
      query += ` AND folder_id = ${folderId}::uuid`;
    }
    
    if (documentType) {
      query += ` AND document_type = '${documentType}'`;
    }
    
    if (sensitivityLevel) {
      query += ` AND sensitivity_level = '${sensitivityLevel}'`;
    }
    
    if (dataClassification) {
      query += ` AND data_classification = '${dataClassification}'`;
    }
    
    if (latestVersionOnly) {
      query += ` AND is_latest_version = true`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DataRoomDocument[];
  }

  // Access Control Management
  async grantDataRoomAccess(data: z.infer<typeof DataRoomAccessControlSchema>): Promise<DataRoomAccessControl> {
    const validated = DataRoomAccessControlSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO data_room_access_control (
        id,
        business_account_id,
        user_id,
        access_role,
        can_view_financial,
        can_view_legal,
        can_view_operational,
        can_view_governance,
        can_view_contracts,
        can_view_tax,
        can_view_risk,
        can_view_kpi,
        can_download_documents,
        can_print_documents,
        can_share_documents,
        can_upload_documents,
        can_delete_documents,
        access_start_date,
        access_end_date,
        ip_restriction_enabled,
        allowed_ip_ranges,
        session_timeout_minutes,
        require_mfa,
        device_restriction_enabled,
        nda_signed,
        nda_signed_date,
        nda_version,
        granted_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.userId}::uuid,
        ${validated.accessRole}::varchar,
        ${validated.canViewFinancial}::boolean,
        ${validated.canViewLegal}::boolean,
        ${validated.canViewOperational}::boolean,
        ${validated.canViewGovernance}::boolean,
        ${validated.canViewContracts}::boolean,
        ${validated.canViewTax}::boolean,
        ${validated.canViewRisk}::boolean,
        ${validated.canViewKpi}::boolean,
        ${validated.canDownloadDocuments}::boolean,
        ${validated.canPrintDocuments}::boolean,
        ${validated.canShareDocuments}::boolean,
        ${validated.canUploadDocuments}::boolean,
        ${validated.canDeleteDocuments}::boolean,
        CURRENT_TIMESTAMP::timestamp,
        ${validated.accessEndDate || null}::timestamp,
        ${validated.ipRestrictionEnabled}::boolean,
        ${JSON.stringify(validated.allowedIpRanges || [])}::jsonb,
        ${validated.sessionTimeoutMinutes}::integer,
        ${validated.requireMfa}::boolean,
        ${validated.deviceRestrictionEnabled}::boolean,
        ${validated.ndaSigned}::boolean,
        ${validated.ndaSignedDate || null}::timestamp,
        ${validated.ndaVersion || null}::varchar,
        ${validated.grantedBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getDataRoomAccess(userId: string, businessAccountId: string): Promise<DataRoomAccessControl | null> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        user_id as "userId",
        access_role as "accessRole",
        can_view_financial as "canViewFinancial",
        can_view_legal as "canViewLegal",
        can_view_operational as "canViewOperational",
        can_view_governance as "canViewGovernance",
        can_view_contracts as "canViewContracts",
        can_view_tax as "canViewTax",
        can_view_risk as "canViewRisk",
        can_view_kpi as "canViewKpi",
        can_download_documents as "canDownloadDocuments",
        can_print_documents as "canPrintDocuments",
        can_share_documents as "canShareDocuments",
        can_upload_documents as "canUploadDocuments",
        can_delete_documents as "canDeleteDocuments",
        access_start_date as "accessStartDate",
        access_end_date as "accessEndDate",
        ip_restriction_enabled as "ipRestrictionEnabled",
        allowed_ip_ranges as "allowedIpRanges",
        session_timeout_minutes as "sessionTimeoutMinutes",
        require_mfa as "requireMfa",
        device_restriction_enabled as "deviceRestrictionEnabled",
        nda_signed as "ndaSigned",
        nda_signed_date as "ndaSignedDate",
        nda_version as "ndaVersion",
        granted_at as "grantedAt",
        granted_by as "grantedBy",
        revoked_at as "revokedAt",
        revoked_by as "revokedBy",
        last_accessed_at as "lastAccessedAt",
        access_count as "accessCount"
      FROM data_room_access_control
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
        AND (access_end_date IS NULL OR access_end_date >= CURRENT_TIMESTAMP)
    `;
    
    return (result as any)[0] || null;
  }

  // Evidence Pack Management
  async generateEvidencePack(data: z.infer<typeof DataRoomEvidencePackSchema>): Promise<string> {
    const validated = DataRoomEvidencePackSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_evidence_pack(
        ${validated.businessAccountId}::uuid,
        ${validated.packName}::varchar,
        ${validated.packType}::varchar,
        ${JSON.stringify(validated.includedFolders)}::jsonb,
        ${validated.includedDocuments}::uuid[],
        ${validated.accessLevel}::varchar,
        ${validated.generatedBy}::uuid
      ) as pack_id
    `;
    
    return (result as any)[0]?.pack_id;
  }

  async getEvidencePacks(businessAccountId: string, filters: {
    packType?: string;
    accessLevel?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<DataRoomEvidencePack[]> {
    const { packType, accessLevel, status, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_id as "snapshotId",
        pack_name as "packName",
        pack_type as "packType",
        pack_description as "packDescription",
        included_folders as "includedFolders",
        included_documents as "includedDocuments",
        total_documents as "totalDocuments",
        total_size_bytes as "totalSizeBytes",
        verification_status as "verificationStatus",
        verification_notes as "verificationNotes",
        verified_by as "verifiedBy",
        verified_at as "verifiedAt",
        access_level as "accessLevel",
        requires_approval as "requiresApproval",
        approved_by as "approvedBy",
        approved_at as "approvedAt",
        generated_at as "generatedAt",
        generated_by as "generatedBy",
        generation_duration_ms as "generationDurationMs",
        template_version as "templateVersion",
        pack_file_path as "packFilePath",
        pack_file_format as "packFileFormat",
        pack_file_size_bytes as "packFileSizeBytes",
        download_count as "downloadCount",
        status,
        expires_at as "expiresAt",
        watermark_enabled as "watermarkEnabled",
        watermark_text as "watermarkText",
        created_at as "createdAt"
      FROM data_room_evidence_packs
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (packType) {
      query += ` AND pack_type = '${packType}'`;
    }
    
    if (accessLevel) {
      query += ` AND access_level = '${accessLevel}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY generated_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DataRoomEvidencePack[];
  }

  // External Access Management
  async generateExternalAccessToken(
    businessAccountId: string,
    folderId: string,
    documentId: string,
    accessLevel: string,
    expiresHours: number,
    accessTitle: string,
    createdBy: string
  ): Promise<string> {
    const result = await prisma.$queryRaw`
      SELECT generate_data_room_access_token(
        ${businessAccountId}::uuid,
        ${folderId}::uuid,
        ${documentId}::uuid,
        ${accessLevel}::varchar,
        ${expiresHours}::integer,
        ${accessTitle}::varchar,
        ${createdBy}::uuid
      ) as access_token
    `;
    
    return (result as any)[0]?.access_token;
  }

  async getExternalAccessByToken(accessToken: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        folder_id as "folderId",
        document_id as "documentId",
        access_token as "accessToken",
        access_title as "accessTitle",
        access_description as "accessDescription",
        access_level as "accessLevel",
        password_protected as "passwordProtected",
        password_hash as "passwordHash",
        nda_required as "ndaRequired",
        nda_text as "ndaText",
        expires_at as "expiresAt",
        created_at as "createdAt",
        created_by as "createdBy",
        purpose,
        view_count as "viewCount",
        download_count as "downloadCount",
        unique_visitors as "uniqueVisitors",
        last_accessed_at as "lastAccessedAt",
        ip_whitelist as "ipWhitelist",
        domain_whitelist as "domainWhitelist",
        watermark_enabled as "watermarkEnabled",
        watermark_text as "watermarkText"
      FROM data_room_external_access
      WHERE access_token = ${accessToken}::varchar
        AND expires_at > CURRENT_TIMESTAMP
    `;
    
    return (result as any)[0] || null;
  }

  // Analytics and Reporting
  async getDocumentSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        folder_type as "folderType",
        document_type as "documentType",
        sensitivity_level as "sensitivityLevel",
        document_count as "documentCount",
        total_size_bytes as "totalSizeBytes",
        avg_file_size as "avgFileSize",
        unique_uploaders as "uniqueUploaders",
        latest_upload as "latestUpload",
        latest_versions as "latestVersions",
        verified_documents as "verifiedDocuments"
      FROM data_room_document_summary
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY folder_type, document_type
    `;
    
    return result as any[];
  }

  async getAccessSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        access_role as "accessRole",
        user_count as "userCount",
        financial_access as "financialAccess",
        legal_access as "legalAccess",
        operational_access as "operationalAccess",
        download_access as "downloadAccess",
        nda_signed as "ndaSigned",
        latest_grant as "latestGrant",
        active_users as "activeUsers"
      FROM data_room_access_summary
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY access_role
    `;
    
    return result as any[];
  }

  async getActivitySummary(businessAccountId: string, filters: {
    startDate?: string;
    endDate?: string;
    activityType?: string;
  } = {}): Promise<any[]> {
    const { startDate, endDate, activityType } = filters;
    
    let query = `
      SELECT 
        business_account_id as "businessAccountId",
        activity_date as "activityDate",
        activity_type as "activityType",
        activity_count as "activityCount",
        unique_users as "uniqueUsers",
        unique_sessions as "uniqueSessions",
        total_duration_ms as "totalDurationMs",
        total_data_volume as "totalDataVolume",
        denied_access as "deniedAccess"
      FROM data_room_activity_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (startDate) {
      query += ` AND activity_date >= '${startDate}'`;
    }
    
    if (endDate) {
      query += ` AND activity_date <= '${endDate}'`;
    }
    
    if (activityType) {
      query += ` AND activity_type = '${activityType}'`;
    }
    
    query += ` ORDER BY activity_date DESC LIMIT 30`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as any[];
  }

  // Materialized View Refresh
  async refreshDataRoomAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_data_room_materialized_views()`;
  }

  // Update last accessed timestamp
  async updateLastAccessed(userId: string, businessAccountId: string): Promise<void> {
    await prisma.$queryRaw`
      UPDATE data_room_access_control 
      SET 
        last_accessed_at = CURRENT_TIMESTAMP,
        access_count = access_count + 1
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
    `;
  }

  // Log activity
  async logActivity(data: {
    businessAccountId: string;
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
    deviceFingerprint?: string;
    accessMethod?: string;
    externalAccessToken?: string;
    mfaVerified?: boolean;
    ndaVerified?: boolean;
    activityDurationMs?: number;
    dataVolumeBytes?: number;
    documentVersionAccessed?: number;
    pagesViewed?: number;
    additionalData?: any;
  }): Promise<void> {
    await prisma.$queryRaw`
      INSERT INTO data_room_activity_log (
        id,
        business_account_id,
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
        device_fingerprint,
        access_method,
        external_access_token,
        mfa_verified,
        nda_verified,
        activity_duration_ms,
        data_volume_bytes,
        document_version_accessed,
        pages_viewed,
        additional_data,
        performed_at
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.businessAccountId}::uuid,
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
        ${data.deviceFingerprint || null}::varchar,
        ${data.accessMethod || null}::varchar,
        ${data.externalAccessToken || null}::varchar,
        ${data.mfaVerified || false}::boolean,
        ${data.ndaVerified || false}::boolean,
        ${data.activityDurationMs || null}::integer,
        ${data.dataVolumeBytes || null}::integer,
        ${data.documentVersionAccessed || null}::integer,
        ${data.pagesViewed || null}::integer,
        ${JSON.stringify(data.additionalData || {})}::jsonb,
        CURRENT_TIMESTAMP::timestamp
      )
    `;
  }
}
