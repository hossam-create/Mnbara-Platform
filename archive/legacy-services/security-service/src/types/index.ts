// Security Service Types
// Types du service de sécurité

import { Request, Response, NextFunction } from 'express';

// ==========================================
// 🔐 Code Watermarking Types
// ==========================================

export interface WatermarkData {
  ownerId: string;
  organizationId: string;
  organizationName: string;
  licenseId?: string;
  licenseType: LicenseType;
  expiration?: Date;
  permissions: WatermarkPermissions;
  customData?: Record<string, unknown>;
}

export interface WatermarkPermissions {
  canModify: boolean;
  canRedistribute: boolean;
  canReverseEngineer: boolean;
  maxDeployments?: number;
  allowedDomains?: string[];
  allowedIPs?: string[];
}

export enum LicenseType {
  OPEN_SOURCE = 'OPEN_SOURCE',
  PROPRIETARY = 'PROPRIETARY',
  COMMERCIAL = 'COMMERCIAL',
  ENTERPRISE = 'ENTERPRISE',
  TRIAL = 'TRIAL',
  EDUCATIONAL = 'EDUCATIONAL'
}

export interface WatermarkResult {
  success: boolean;
  watermark?: {
    id: string;
    hash: string;
    signature: string;
    injectedAt: Date;
  };
  error?: string;
}

export interface WatermarkVerification {
  isValid: boolean;
  watermark?: {
    id: string;
    ownerId: string;
    organizationName: string;
    licenseType: LicenseType;
    expiration?: Date;
  };
  issues?: string[];
}

// ==========================================
// 📦 Customs Warning Types
// ==========================================

export interface CustomsWarningResult {
  country: string;
  countryCode: string;
  warnings: CountryWarning[];
  generalRequirements: string[];
  applicableRegulations: Regulation[];
}

export interface CountryWarning {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  requiredActions: string[];
  links: { title: string; url: string }[];
}

export interface Regulation {
  id: string;
  title: string;
  category: string;
  description: string;
  requiredDocuments: string[];
  dutyRate?: string;
  taxRate?: string;
  officialLink?: string;
}

export interface CustomsCheckRequest {
  originCountry: string;
  destinationCountry: string;
  productCategory: string;
  hsCode?: string;
  productValue: number;
  quantity: number;
  weight?: number;
  description: string;
}

// ==========================================
// 🔒 Vulnerability Scanning Types
// ==========================================

export interface VulnerabilityScanResult {
  scanId: string;
  target: string;
  status: ScanStatus;
  summary: VulnerabilitySummary;
  vulnerabilities: VulnerabilityDetail[];
  scanDuration?: number;
  scanDate: Date;
}

export interface VulnerabilitySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}

export interface VulnerabilityDetail {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: Severity;
  cvssScore: number;
  cvssVector?: string;
  category: string;
  affectedComponent: string;
  fixedVersion?: string;
  remediation: string;
  hasExploit: boolean;
  references: string[];
}

export enum ScanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export interface ScanConfiguration {
  scanType: ScanType;
  targetType: TargetType;
  target: string;
  options?: {
    includeDevDependencies?: boolean;
    recursive?: boolean;
    timeout?: number;
    parallel?: boolean;
    customRules?: string[];
  };
}

export enum ScanType {
  FULL_SCAN = 'FULL_SCAN',
  QUICK_SCAN = 'QUICK_SCAN',
  TARGETED_SCAN = 'TARGETED_SCAN',
  DEPENDENCY_SCAN = 'DEPENDENCY_SCAN',
  CONTAINER_SCAN = 'CONTAINER_SCAN',
  INFRASTRUCTURE_SCAN = 'INFRASTRUCTURE_SCAN',
  WEB_APPLICATION_SCAN = 'WEB_APPLICATION_SCAN',
  API_SCAN = 'API_SCAN'
}

export enum TargetType {
  REPOSITORY = 'REPOSITORY',
  PACKAGE = 'PACKAGE',
  CONTAINER = 'CONTAINER',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  WEB_APPLICATION = 'WEB_APPLICATION',
  API = 'API',
  SOURCE_CODE = 'SOURCE_CODE',
  COMPILED_BINARY = 'COMPILED_BINARY'
}

// ==========================================
// 📋 Patch Management Types
// ==========================================

export interface PatchCheckResult {
  patchId: string;
  title: string;
  severity: Severity;
  cvssScore?: number;
  affectedSystems: string[];
  fixedVersions: string[];
  patchAvailable: boolean;
  patchUrl?: string;
  releaseDate?: Date;
  urgency: PatchUrgency;
  recommendations: string[];
}

export enum PatchUrgency {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL'
}

export interface PatchDeploymentRequest {
  patchId: string;
  environment: string;
  targetSystem: string;
  deployMethod: 'automated' | 'manual' | 'script';
  rollbackEnabled: boolean;
  notifyStakeholders: boolean;
}

export interface PatchDeploymentStatus {
  deploymentId: string;
  patchId: string;
  environment: string;
  status: DeploymentStatus;
  startedAt?: Date;
  completedAt?: Date;
  progress?: number;
  logs?: string[];
  error?: string;
  rollbackPerformed?: boolean;
}

export enum DeploymentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
  VERIFIED = 'VERIFIED'
}

// ==========================================
// 📊 Audit Logging Types
// ==========================================

export interface AuditLogEntry {
  eventType: AuditEventType;
  eventCategory: string;
  actor: Actor;
  action: string;
  description: string;
  target?: Target;
  result: AuditResult;
  riskLevel: RiskLevel;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  location?: LocationInfo;
}

export interface Actor {
  id: string;
  type: ActorType;
  name?: string;
  email?: string;
}

export interface Target {
  id: string;
  type: string;
  name?: string;
}

export enum AuditEventType {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // Authorization
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  
  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  
  // Data Operations
  DATA_VIEW = 'DATA_VIEW',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DOWNLOAD = 'DATA_DOWNLOAD',
  
  // System Changes
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  USER_CREATE = 'USER_CREATE',
  USER_DELETE = 'USER_DELETE',
  
  // Security Scans
  SCAN_STARTED = 'SCAN_STARTED',
  SCAN_COMPLETED = 'SCAN_COMPLETED',
  VULNERABILITY_FOUND = 'VULNERABILITY_FOUND',
  PATCH_APPLIED = 'PATCH_APPLIED'
}

export enum ActorType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  API = 'API',
  SERVICE = 'SERVICE',
  ADMIN = 'ADMIN',
  ANONYMOUS = 'ANONYMOUS'
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL = 'PARTIAL',
  DENIED = 'DENIED',
  ERROR = 'ERROR'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface LocationInfo {
  country?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ==========================================
// 🔑 API Response Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// Express Extensions
// ==========================================

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
        role: string;
      };
      auditContext?: AuditLogEntry;
    }
  }
}
