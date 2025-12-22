# Transparent Data Encryption (TDE) Setup Guide

## Overview

This guide provides instructions for implementing Transparent Data Encryption (TDE) for PostgreSQL in the MNBARA platform. TDE encrypts data at rest, protecting against unauthorized access to database files, backups, and storage media.

**Requirements**: 19.1 - Enable Postgres encryption (TDE/PG Crypto)

## What is TDE?

Transparent Data Encryption (TDE) encrypts database files at the storage level, ensuring that:
- Database files on disk are encrypted
- Backups are automatically encrypted
- Data in transit between storage and database is encrypted
- Application code requires no changes (transparent to applications)

## Implementation Options

### Option 1: PostgreSQL Native TDE (Recommended for Enterprise)

PostgreSQL 15+ with TDE support (available in some distributions).

#### Requirements
- PostgreSQL 15+ with TDE patches
- Key management system (KMS)
- Root/admin access to PostgreSQL server

#### Setup Steps

1. **Install PostgreSQL with TDE support**

```bash
# For EDB Postgres Advanced Server
sudo yum install edb-as15-server

# Or compile PostgreSQL with TDE patches
git clone https://github.com/postgres/postgres.git
cd postgres
git checkout REL_15_STABLE
# Apply TDE patches
./configure --with-openssl --enable-tde
make && sudo make install
```

2. **Generate encryption key**

```bash
# Generate 256-bit key
openssl rand -hex 32 > /etc/postgresql/tde.key
chmod 600 /etc/postgresql/tde.key
chown postgres:postgres /etc/postgresql/tde.key
```

3. **Configure postgresql.conf**

```conf
# Enable TDE
data_encryption = on

# Key management
data_encryption_key_command = 'cat /etc/postgresql/tde.key'

# Or use external KMS
# data_encryption_key_command = '/usr/local/bin/get-kms-key.sh'

# Encryption algorithm
data_encryption_cipher = 'AES256'

# Enable encryption for WAL
wal_encryption = on
```

4. **Initialize encrypted cluster**

```bash
# For new cluster
initdb -D /var/lib/postgresql/data --data-encryption=on

# For existing cluster, you'll need to migrate
pg_dump mnbara_db > backup.sql
# Reinitialize with encryption
initdb -D /var/lib/postgresql/data_encrypted --data-encryption=on
# Restore
psql -d mnbara_db < backup.sql
```

5. **Verify encryption**

```sql
-- Check TDE status
SELECT name, setting FROM pg_settings WHERE name LIKE '%encryption%';

-- Verify encrypted tablespaces
SELECT spcname, spcencryption FROM pg_tablespace;
```

### Option 2: File System Encryption (Recommended for Most Cases)

Encrypt the entire PostgreSQL data directory using OS-level encryption.

#### Linux - LUKS (Linux Unified Key Setup)

1. **Create encrypted volume**

```bash
# Install cryptsetup
sudo apt-get install cryptsetup

# Create encrypted partition
sudo cryptsetup luksFormat /dev/sdb
# Enter passphrase when prompted

# Open encrypted volume
sudo cryptsetup luksOpen /dev/sdb pgdata_encrypted

# Create filesystem
sudo mkfs.ext4 /dev/mapper/pgdata_encrypted

# Mount
sudo mkdir -p /var/lib/postgresql/data_encrypted
sudo mount /dev/mapper/pgdata_encrypted /var/lib/postgresql/data_encrypted
sudo chown -R postgres:postgres /var/lib/postgresql/data_encrypted
```

2. **Configure auto-mount**

```bash
# Add to /etc/crypttab
pgdata_encrypted /dev/sdb none luks

# Add to /etc/fstab
/dev/mapper/pgdata_encrypted /var/lib/postgresql/data_encrypted ext4 defaults 0 2
```

3. **Update PostgreSQL data directory**

```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Move data
sudo rsync -av /var/lib/postgresql/data/ /var/lib/postgresql/data_encrypted/

# Update postgresql.conf or systemd service
sudo vim /etc/postgresql/15/main/postgresql.conf
# data_directory = '/var/lib/postgresql/data_encrypted'

# Start PostgreSQL
sudo systemctl start postgresql
```

#### Windows - BitLocker

1. **Enable BitLocker on PostgreSQL data drive**

```powershell
# Enable BitLocker
Enable-BitLocker -MountPoint "D:" -EncryptionMethod Aes256 -UsedSpaceOnly

# Save recovery key
(Get-BitLockerVolume -MountPoint "D:").KeyProtector | Out-File "C:\BitLocker-Recovery-D.txt"
```

2. **Configure PostgreSQL to use encrypted drive**

Update `postgresql.conf`:
```conf
data_directory = 'D:/PostgreSQL/15/data'
```

#### macOS - FileVault

1. **Enable FileVault**

```bash
# Enable FileVault for entire disk
sudo fdesetup enable

# Or create encrypted disk image for PostgreSQL
hdiutil create -size 50g -encryption AES-256 -volname "PostgreSQL" -fs "Case-sensitive APFS" pgdata.dmg
hdiutil attach pgdata.dmg
```

### Option 3: Cloud Provider Encryption

#### AWS RDS

```bash
# Create encrypted RDS instance
aws rds create-db-instance \
  --db-instance-identifier mnbara-db-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username mnbara_admin \
  --master-user-password "SecurePassword123!" \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012 \
  --backup-retention-period 7 \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name mnbara-db-subnet \
  --publicly-accessible false

# Enable encryption for existing instance (requires snapshot restore)
aws rds create-db-snapshot \
  --db-instance-identifier mnbara-db \
  --db-snapshot-identifier mnbara-db-snapshot

aws rds copy-db-snapshot \
  --source-db-snapshot-identifier mnbara-db-snapshot \
  --target-db-snapshot-identifier mnbara-db-snapshot-encrypted \
  --kms-key-id arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012

aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier mnbara-db-encrypted \
  --db-snapshot-identifier mnbara-db-snapshot-encrypted
```

#### Google Cloud SQL

```bash
# Create encrypted Cloud SQL instance
gcloud sql instances create mnbara-db-prod \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --disk-encryption-key=projects/PROJECT_ID/locations/LOCATION/keyRings/KEYRING/cryptoKeys/KEY \
  --backup \
  --backup-start-time=03:00

# Enable encryption for existing instance
gcloud sql instances patch mnbara-db \
  --disk-encryption-key=projects/PROJECT_ID/locations/LOCATION/keyRings/KEYRING/cryptoKeys/KEY
```

#### Azure Database for PostgreSQL

```bash
# Create encrypted Azure PostgreSQL
az postgres flexible-server create \
  --resource-group mnbara-rg \
  --name mnbara-db-prod \
  --location eastus \
  --admin-user mnbara_admin \
  --admin-password "SecurePassword123!" \
  --sku-name Standard_D2s_v3 \
  --tier GeneralPurpose \
  --storage-size 128 \
  --version 15 \
  --high-availability Enabled \
  --backup-retention 7 \
  --geo-redundant-backup Enabled \
  --storage-auto-grow Enabled

# Azure automatically encrypts data at rest using Microsoft-managed keys
# For customer-managed keys:
az postgres flexible-server update \
  --resource-group mnbara-rg \
  --name mnbara-db-prod \
  --key-id https://mnbara-keyvault.vault.azure.net/keys/postgres-key/version
```

### Option 4: Docker with Encrypted Volumes

For development and testing environments.

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.4-alpine
    container_name: mnbara-postgres-encrypted
    environment:
      POSTGRES_DB: mnbara_db
      POSTGRES_USER: mnbara_user
      POSTGRES_PASSWORD: mnbara_pass
      # Enable checksums for data integrity
      POSTGRES_INITDB_ARGS: "--data-checksums"
    volumes:
      # Use encrypted volume
      - type: volume
        source: postgres_encrypted_data
        target: /var/lib/postgresql/data
    networks:
      - mnbara-network

volumes:
  postgres_encrypted_data:
    driver: local
    driver_opts:
      type: "none"
      o: "bind"
      device: "/encrypted/postgres/data"  # Mount point of encrypted filesystem

networks:
  mnbara-network:
    driver: bridge
```

## Key Management

### Development Environment

Store keys in environment variables (never commit):

```bash
# .env.local
TDE_ENCRYPTION_KEY=your_generated_key_here
```

### Production Environment

Use a dedicated Key Management Service (KMS).

#### AWS KMS

```typescript
// backend/services/shared/database/kms-aws.ts
import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

export async function getEncryptionKey(): Promise<string> {
  const client = new KMSClient({ region: process.env.AWS_REGION });
  
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(process.env.ENCRYPTED_KEY!, 'base64'),
  });
  
  const response = await client.send(command);
  return Buffer.from(response.Plaintext!).toString('utf-8');
}
```

#### HashiCorp Vault

```typescript
// backend/services/shared/database/kms-vault.ts
import vault from 'node-vault';

export async function getEncryptionKey(): Promise<string> {
  const client = vault({
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
  });
  
  const result = await client.read('secret/data/mnbara/tde-key');
  return result.data.data.key;
}
```

#### Google Cloud KMS

```typescript
// backend/services/shared/database/kms-gcp.ts
import { KeyManagementServiceClient } from '@google-cloud/kms';

export async function getEncryptionKey(): Promise<string> {
  const client = new KeyManagementServiceClient();
  
  const [result] = await client.decrypt({
    name: process.env.GCP_KMS_KEY_NAME,
    ciphertext: Buffer.from(process.env.ENCRYPTED_KEY!, 'base64'),
  });
  
  return result.plaintext!.toString('utf-8');
}
```

## Backup and Recovery

### Encrypted Backups

```bash
# Backup with encryption
pg_dump mnbara_db | openssl enc -aes-256-cbc -salt -pbkdf2 -out backup.sql.enc

# Restore from encrypted backup
openssl enc -aes-256-cbc -d -pbkdf2 -in backup.sql.enc | psql mnbara_db
```

### Automated Backup Script

```bash
#!/bin/bash
# scripts/database/backup-encrypted.sh

BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mnbara_db_$DATE.sql"
ENCRYPTED_FILE="$BACKUP_FILE.enc"

# Create backup
pg_dump -U mnbara_user mnbara_db > "$BACKUP_DIR/$BACKUP_FILE"

# Encrypt backup
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "$BACKUP_DIR/$BACKUP_FILE" \
  -out "$BACKUP_DIR/$ENCRYPTED_FILE" \
  -pass file:/etc/postgresql/backup.key

# Remove unencrypted backup
rm "$BACKUP_DIR/$BACKUP_FILE"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/$ENCRYPTED_FILE" \
  s3://mnbara-backups/postgresql/ \
  --storage-class GLACIER

echo "Backup completed: $ENCRYPTED_FILE"
```

## Monitoring and Auditing

### Check Encryption Status

```sql
-- Check if TDE is enabled
SELECT name, setting 
FROM pg_settings 
WHERE name LIKE '%encryption%';

-- Check encrypted tablespaces
SELECT 
  spcname as tablespace_name,
  spcencryption as is_encrypted
FROM pg_tablespace;

-- Monitor encryption performance
SELECT 
  datname,
  blks_read,
  blks_hit,
  tup_returned,
  tup_fetched
FROM pg_stat_database
WHERE datname = 'mnbara_db';
```

### Audit Logging

```sql
-- Enable audit logging for encryption key access
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Reload configuration
SELECT pg_reload_conf();

-- View logs
SELECT * FROM pg_read_file('postgresql.log');
```

## Performance Considerations

### Encryption Overhead

- **CPU**: 5-15% overhead for encryption/decryption
- **I/O**: Minimal impact with modern hardware
- **Memory**: Slight increase for encryption buffers

### Optimization Tips

1. **Use hardware acceleration**
```bash
# Check for AES-NI support
grep -m1 -o aes /proc/cpuinfo
```

2. **Tune PostgreSQL for encrypted storage**
```conf
# postgresql.conf
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB
```

3. **Monitor performance**
```sql
-- Check encryption impact
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Compliance

TDE helps meet compliance requirements:

- **GDPR**: Article 32 - Security of processing
- **PCI DSS**: Requirement 3.4 - Render PAN unreadable
- **HIPAA**: 164.312(a)(2)(iv) - Encryption and decryption
- **SOC 2**: CC6.7 - Encryption of data at rest
- **ISO 27001**: A.10.1.1 - Cryptographic controls

## Troubleshooting

### Issue: Cannot start PostgreSQL after enabling TDE

**Solution**: Check encryption key is accessible
```bash
# Verify key file permissions
ls -l /etc/postgresql/tde.key

# Test key command
/usr/local/bin/get-kms-key.sh

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Issue: Performance degradation after enabling TDE

**Solution**: Verify hardware acceleration
```bash
# Check CPU features
lscpu | grep aes

# Monitor CPU usage
top -p $(pgrep postgres)

# Check I/O wait
iostat -x 1
```

### Issue: Backup restore fails

**Solution**: Verify encryption key matches
```bash
# Test decryption
openssl enc -aes-256-cbc -d -pbkdf2 \
  -in backup.sql.enc \
  -out test.sql \
  -pass file:/etc/postgresql/backup.key

# Check file integrity
md5sum test.sql
```

## References

- [PostgreSQL Encryption Options](https://www.postgresql.org/docs/current/encryption-options.html)
- [AWS RDS Encryption](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html)
- [Google Cloud SQL Encryption](https://cloud.google.com/sql/docs/postgres/data-encryption)
- [Azure Database Encryption](https://docs.microsoft.com/en-us/azure/postgresql/concepts-data-encryption-postgresql)
- [LUKS Documentation](https://gitlab.com/cryptsetup/cryptsetup)

## Support

For issues or questions:
- Review PostgreSQL logs
- Check encryption key accessibility
- Verify hardware support for encryption
- Contact platform team: security@mnbara.com
