/**
 * Prisma Middleware for Automatic Field Encryption
 * Requirements: 19.1 - Enable Postgres encryption (TDE/PG Crypto)
 * 
 * This middleware automatically encrypts/decrypts sensitive fields
 * when interacting with the database through Prisma.
 */

import { Prisma } from '@prisma/client';
import { encryptField, decryptField, ENCRYPTION_CONFIG } from './encryption.config';

/**
 * Configuration for field encryption
 */
interface EncryptionFieldConfig {
  model: string;
  field: string;
  encryptedField: string;
}

/**
 * Mapping of original fields to encrypted fields
 */
const FIELD_MAPPINGS: EncryptionFieldConfig[] = [
  // KycUpload
  { model: 'KycUpload', field: 'documentNumber', encryptedField: 'documentNumberEncrypted' },
  { model: 'KycUpload', field: 'fileUrl', encryptedField: 'fileUrlEncrypted' },
  
  // KycVerification
  { model: 'KycVerification', field: 'fullLegalName', encryptedField: 'fullLegalNameEncrypted' },
  { model: 'KycVerification', field: 'dateOfBirth', encryptedField: 'dateOfBirthEncrypted' },
  { model: 'KycVerification', field: 'address', encryptedField: 'addressEncrypted' },
  
  // Consent
  { model: 'Consent', field: 'ipAddress', encryptedField: 'ipAddressEncrypted' },
  
  // RefreshToken
  { model: 'RefreshToken', field: 'token', encryptedField: 'tokenEncrypted' },
];

/**
 * Get field mappings for a specific model
 */
function getModelFieldMappings(model: string): EncryptionFieldConfig[] {
  return FIELD_MAPPINGS.filter(m => m.model === model);
}

/**
 * Encrypt fields before write operations
 */
function encryptWriteData(model: string, data: any): any {
  if (!data) return data;
  
  const mappings = getModelFieldMappings(model);
  const encryptedData = { ...data };
  
  for (const mapping of mappings) {
    if (data[mapping.field] !== undefined && data[mapping.field] !== null) {
      const value = data[mapping.field];
      
      // Convert to string if needed
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // Encrypt and store in encrypted field
      encryptedData[mapping.encryptedField] = encryptField(stringValue);
      
      // Remove original field to prevent storing unencrypted data
      delete encryptedData[mapping.field];
    }
  }
  
  return encryptedData;
}

/**
 * Decrypt fields after read operations
 */
function decryptReadData(model: string, data: any): any {
  if (!data) return data;
  
  const mappings = getModelFieldMappings(model);
  const decryptedData = { ...data };
  
  for (const mapping of mappings) {
    if (data[mapping.encryptedField] !== undefined && data[mapping.encryptedField] !== null) {
      try {
        // Decrypt from encrypted field
        const decrypted = decryptField(data[mapping.encryptedField]);
        
        // Store in original field name for application use
        decryptedData[mapping.field] = decrypted;
        
        // Optionally remove encrypted field from result
        // delete decryptedData[mapping.encryptedField];
      } catch (error) {
        console.error(`Failed to decrypt ${mapping.model}.${mapping.field}:`, error);
        // Keep encrypted value or set to null
        decryptedData[mapping.field] = null;
      }
    }
  }
  
  return decryptedData;
}

/**
 * Create Prisma middleware for encryption
 */
export function createEncryptionMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const { model, action } = params;
    
    if (!model) {
      return next(params);
    }
    
    // Check if this model has encrypted fields
    const hasEncryptedFields = FIELD_MAPPINGS.some(m => m.model === model);
    if (!hasEncryptedFields) {
      return next(params);
    }
    
    // Handle write operations (create, update, upsert)
    if (action === 'create' || action === 'update' || action === 'upsert') {
      if (params.args.data) {
        params.args.data = encryptWriteData(model, params.args.data);
      }
      
      // Handle upsert create and update separately
      if (action === 'upsert') {
        if (params.args.create) {
          params.args.create = encryptWriteData(model, params.args.create);
        }
        if (params.args.update) {
          params.args.update = encryptWriteData(model, params.args.update);
        }
      }
    }
    
    // Handle batch update
    if (action === 'updateMany') {
      if (params.args.data) {
        params.args.data = encryptWriteData(model, params.args.data);
      }
    }
    
    // Execute the query
    const result = await next(params);
    
    // Handle read operations (findUnique, findFirst, findMany)
    if (action === 'findUnique' || action === 'findFirst') {
      return decryptReadData(model, result);
    }
    
    if (action === 'findMany') {
      if (Array.isArray(result)) {
        return result.map(item => decryptReadData(model, item));
      }
    }
    
    // Handle create/update results (they return the created/updated record)
    if (action === 'create' || action === 'update' || action === 'upsert') {
      return decryptReadData(model, result);
    }
    
    return result;
  };
}

/**
 * Create middleware with custom configuration
 */
export function createCustomEncryptionMiddleware(
  customMappings: EncryptionFieldConfig[]
): Prisma.Middleware {
  const originalMappings = [...FIELD_MAPPINGS];
  
  // Temporarily replace mappings
  FIELD_MAPPINGS.length = 0;
  FIELD_MAPPINGS.push(...customMappings);
  
  const middleware = createEncryptionMiddleware();
  
  // Restore original mappings
  FIELD_MAPPINGS.length = 0;
  FIELD_MAPPINGS.push(...originalMappings);
  
  return middleware;
}

/**
 * Utility to manually encrypt a model instance
 */
export function encryptModelData<T extends Record<string, any>>(
  model: string,
  data: T
): T {
  return encryptWriteData(model, data) as T;
}

/**
 * Utility to manually decrypt a model instance
 */
export function decryptModelData<T extends Record<string, any>>(
  model: string,
  data: T
): T {
  return decryptReadData(model, data) as T;
}

/**
 * Check if a field is encrypted for a model
 */
export function isFieldEncrypted(model: string, field: string): boolean {
  return FIELD_MAPPINGS.some(m => m.model === model && m.field === field);
}

/**
 * Get encrypted field name for a model field
 */
export function getEncryptedFieldName(model: string, field: string): string | null {
  const mapping = FIELD_MAPPINGS.find(m => m.model === model && m.field === field);
  return mapping ? mapping.encryptedField : null;
}

/**
 * Example usage in a Prisma client setup:
 * 
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { createEncryptionMiddleware } from './prisma-encryption.middleware';
 * 
 * const prisma = new PrismaClient();
 * 
 * // Add encryption middleware
 * prisma.$use(createEncryptionMiddleware());
 * 
 * // Now all queries will automatically encrypt/decrypt sensitive fields
 * const kycUpload = await prisma.kycUpload.create({
 *   data: {
 *     userId: 1,
 *     documentType: 'PASSPORT',
 *     documentNumber: '123456789', // Will be automatically encrypted
 *     fileUrl: 'https://storage.example.com/kyc/doc.pdf', // Will be encrypted
 *   }
 * });
 * 
 * // documentNumber and fileUrl are automatically decrypted when reading
 * console.log(kycUpload.documentNumber); // '123456789' (decrypted)
 * ```
 */
