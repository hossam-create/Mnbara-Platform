# PostgreSQL Encryption Setup

This directory contains utilities and migrations for implementing PostgreSQL encryption in the MNBARA platform.

## Overview

The encryption implementation includes:

1. **pgcrypto Extension**: PostgreSQL's built-in encryption extension for field-level encryption
2. **Application-Level Encryption**: AES-256-GCM encryption for sensitive data
3. **Transparent Data Encryption (TDE)**: Configuration guidance for data-at-rest encryption

## Requirements

- PostgreSQL 14+ with pgcrypto extension
- Node.js 18+ for application-level encryption utilities
- Secure key management system (environment variables, AWS Secrets Manager, etc.)

## Quick Start

### 1. Enable pgcrypto Extension

Run the SQL migration to enable pgcrypto:

```bash
psql -U mnbara_user -d mnbara_db -f migrations/enable_pgcrypto.sql
```

This will:
- Install the pgcrypto extension
- Create encryption/decryption helper functions
- Set up audit tables for key rotation tracking

### 2. Generate Encryption Key

Generate a secure 32-byte encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Database encryption key (32 bytes / 64 hex characters)
DB_ENCRYPTION_KEY=your_generated_key_here
```

**IMPORTANT**: Never commit this key to version control!

### 4. Migrate Sensitive Fields

Run the field encryption migration:

```bash
psql -U mnbara_user -d mnbara_db -f migrations/encrypt_sensitive_fields.sql
```

Then execute the migration functions:

```sql
-- Set the encryption key for this session
SELECT set_encryption_key('your_generated_key_here');

-- Migrate all sensitive fields
SELECT * FROM migrate_all_sensitive_fields();
```

### 5. Update Application Code

Import and use the encryption utilities in your services:

```typescript
import { encryptField, decryptField, createEncryptionMiddleware } from '@shared/database/encryption.config';

// Use Prisma middleware for automatic encryption/decryption
const prisma = new PrismaClient();
prisma.$use(createEncryptionMiddleware());

// Manual encryption/decryption
const encrypted = encryptField('sensitive data');
const decrypted = decryptField(encrypted);
```

## Encrypted Fields

The following fields are automatically encrypted:

### KycUpload Table
- `documentNumber` → `document_number_encrypted`
- `fileUrl` → `file_url_encrypted`

### KycVerification Table
- `fullLegalName` → `full_legal_name_encrypted`
- `dateOfBirth` → `date_of_birth_encrypted`
- `address` → `address_encrypted`

### Consent Table
- `ipAddress` → `ip_address_encrypted`

### RefreshToken Table
- `token` → `token_encrypted`

## Transparent Data Encryption (TDE)

For complete data-at-rest encryption, configure TDE at the PostgreSQL server level.

### PostgreSQL TDE Options

#### Option 1: PostgreSQL Native TDE (Enterprise)

PostgreSQL Enterprise Edition includes native TDE. Configure in `postgresql.conf`:

```conf
# Enable TDE
data_encryption = on
data_encryption_key_command = '/path/to/key/retrieval/script'
```

#### Option 2: File System Encryption

Use encrypted file systems for PostgreSQL data directory:

**Linux (LUKS)**:
```bash
# Create encrypted volume
cryptsetup luksFormat /dev/sdb
cryptsetup luksOpen /dev/sdb pgdata
mkfs.ext4 /dev/mapper/pgdata

# Mount and configure PostgreSQL
mount /dev/mapper/pgdata /var/lib/postgresql/data
```

**AWS RDS**:
```bash
# Enable encryption when creating RDS instance
aws rds create-db-instance \
  --db-instance-identifier mnbara-db \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:region:account:key/key-id
```

#### Option 3: Third-Party Solutions

- **Percona Server for PostgreSQL**: Includes TDE support
- **EDB Postgres Advanced Server**: Enterprise TDE features
- **CipherTrust Transparent Encryption**: Application-transparent encryption

### Docker Configuration

For development with encrypted volumes:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgis/postgis:15-3.4-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_INITDB_ARGS: "--data-checksums"
    # Mount encrypted volume
    volumes:
      - type: volume
        source: postgres_data
        target: /var/lib/postgresql/data
        volume:
          driver: local
          driver_opts:
            type: "nfs"
            o: "encryption=aes256"
```

## Key Management

### Development

Store keys in `.env` file (never commit):

```env
DB_ENCRYPTION_KEY=your_key_here
```

### Production

Use a secure key management service:

#### AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getEncryptionKey() {
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "mnbara/db-encryption-key" })
  );
  return response.SecretString;
}
```

#### HashiCorp Vault

```typescript
import vault from "node-vault";

async function getEncryptionKey() {
  const client = vault({ endpoint: process.env.VAULT_ADDR });
  const result = await client.read("secret/data/mnbara/db-encryption-key");
  return result.data.data.key;
}
```

### Key Rotation

To rotate encryption keys:

1. Generate new key
2. Decrypt data with old key
3. Re-encrypt with new key
4. Update key in secrets manager
5. Log rotation in `encryption_key_audit` table

```sql
-- Log key rotation
INSERT INTO encryption_key_audit (key_version, rotated_by, notes)
VALUES (2, 'admin@mnbara.com', 'Scheduled key rotation');
```

## Security Best Practices

1. **Never log encryption keys** - Ensure keys are not logged in application logs
2. **Use environment-specific keys** - Different keys for dev/staging/production
3. **Rotate keys regularly** - Implement quarterly key rotation
4. **Backup encrypted data** - Ensure backups include encryption metadata
5. **Audit access** - Monitor who accesses encrypted data
6. **Secure key storage** - Use dedicated key management services
7. **Test recovery** - Regularly test decryption and recovery procedures

## Monitoring

Monitor encryption operations:

```sql
-- Check encryption key audit log
SELECT * FROM encryption_key_audit ORDER BY rotated_at DESC;

-- Verify encrypted columns
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name LIKE '%_encrypted';

-- Check encryption coverage
SELECT 
    COUNT(*) as total_records,
    COUNT(document_number_encrypted) as encrypted_records,
    ROUND(COUNT(document_number_encrypted)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as encryption_percentage
FROM "KycUpload";
```

## Troubleshooting

### Error: "pgcrypto extension not found"

Install PostgreSQL contrib package:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-contrib

# RHEL/CentOS
sudo yum install postgresql-contrib

# Then enable in database
psql -U postgres -d mnbara_db -c "CREATE EXTENSION pgcrypto;"
```

### Error: "Encryption key not set"

Ensure `DB_ENCRYPTION_KEY` is set in environment:

```bash
export DB_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Error: "Invalid encrypted data format"

Data may not be encrypted. Check if migration was run:

```sql
SELECT COUNT(*) FROM "KycUpload" WHERE document_number_encrypted IS NOT NULL;
```

## Performance Considerations

- **Indexing**: Encrypted columns cannot be indexed directly. Use hash indexes for lookups.
- **Query Performance**: Decryption happens at query time. Cache frequently accessed data.
- **Batch Operations**: Encrypt/decrypt in batches for better performance.

## Compliance

This encryption implementation helps meet:

- **GDPR**: Article 32 - Security of processing
- **PCI DSS**: Requirement 3 - Protect stored cardholder data
- **HIPAA**: 164.312(a)(2)(iv) - Encryption and decryption
- **SOC 2**: CC6.7 - Encryption of data at rest

## References

- [PostgreSQL pgcrypto Documentation](https://www.postgresql.org/docs/current/pgcrypto.html)
- [PostgreSQL Encryption Options](https://www.postgresql.org/docs/current/encryption-options.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review PostgreSQL logs: `/var/log/postgresql/postgresql-*.log`
- Contact the platform team: platform@mnbara.com
