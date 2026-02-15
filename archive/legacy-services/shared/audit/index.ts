/**
 * Audit Logging Module
 * 
 * Provides comprehensive audit logging functionality for the MNBARA platform.
 * 
 * Features:
 * - Centralized audit log service
 * - Express middleware for automatic logging
 * - Support for various action types (user management, KYC, disputes, etc.)
 * - Severity levels (INFO, WARNING, ERROR, CRITICAL)
 * - Request/response capture
 * - IP tracking and user agent logging
 * - Correlation IDs for distributed tracing
 * 
 * @module audit
 */

export { AuditService, AuditLogInput } from './audit.service';
export {
  auditMiddleware,
  auditUserAction,
  auditKycAction,
  auditDisputeAction,
  auditEscrowAction,
  AuditMiddlewareOptions,
} from './audit.middleware';

// Re-export Prisma enums for convenience
export { AuditAction, AuditSeverity } from '@prisma/client';
