# PostgreSQL Encryption - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (64 hex characters).

### Step 2: Add to Environment

Create or update `.env`:

```env
DB_ENCRYPTION_KEY=paste_your_generated_key_here
```

**⚠️ NEVER commit this file to git!**

### Step 3: Run Setup Script

```bash
# Make executable (Linux/Mac)
chmod +x scripts/database/setup-encryption.sh

# Run setup
./scripts/database/setup-encryption.sh
```

Or manually:

```bash
# Enable pgcrypto
psql -U mnbara_user -d mnbara_db -f backend/services/shared/database/migrations/enable_pgcrypto.sql

# Add encrypted columns
psql -U mnbara_user -d mnbara_db -f backend/services/shared/database/migrations/encrypt_sensitive_fields.sql
```

### Step 4: Add Prisma Middleware

In your service's Prisma client setup:

```typescript
// backend/services/auth-service/src/db.ts
import { PrismaClient } from '@prisma/client';
import { createEncryptionMiddleware } from '@shared/database/prisma-encryption.middleware';

const prisma = new PrismaClient();

// Add encryption middleware
prisma.$use(createEncryptionMiddleware());

export default prisma;
```

### Step 5: Test It

```typescript
// Create a KYC upload (data will be automatically encrypted)
const kyc = await prisma.kycUpload.create({
  data: {
    userId: 1,
    documentType: 'PASSPORT',
    documentNumber: '123456789', // Encrypted automatically
    fileUrl: 'https://storage.example.com/doc.pdf', // Encrypted automatically
  }
});

// Read it back (data will be automatically decrypted)
console.log(kyc.documentNumber); // '123456789' (decrypted)
```

## ✅ That's It!

Your sensitive data is now encrypted at rest.

## 📚 Need More Info?

- **Full Documentation**: `backend/services/shared/database/README.md`
- **TDE Setup**: `docs/security/TDE_SETUP_GUIDE.md`
- **Implementation Details**: `backend/services/shared/database/ENCRYPTION_IMPLEMENTATION.md`

## 🔍 Verify Setup

```sql
-- Check pgcrypto is enabled
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Check encrypted columns exist
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name LIKE '%_encrypted';
```

## 🆘 Troubleshooting

### Error: "DB_ENCRYPTION_KEY not configured"

```bash
# Generate and set key
export DB_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Error: "pgcrypto extension not found"

```bash
# Install PostgreSQL contrib
sudo apt-get install postgresql-contrib

# Enable extension
psql -U postgres -d mnbara_db -c "CREATE EXTENSION pgcrypto;"
```

### Error: "Cannot connect to database"

Check your database connection settings in `.env`:

```env
DATABASE_URL=postgresql://mnbara_user:mnbara_pass@localhost:5432/mnbara_db
```

## 🔐 Security Checklist

- [ ] Generated strong encryption key (32 bytes)
- [ ] Added key to `.env` file
- [ ] Added `.env` to `.gitignore`
- [ ] Enabled pgcrypto extension
- [ ] Added encrypted columns
- [ ] Integrated Prisma middleware
- [ ] Tested encryption/decryption
- [ ] Configured TDE for production (optional but recommended)

## 📝 What Gets Encrypted?

| Table | Fields |
|-------|--------|
| KycUpload | documentNumber, fileUrl |
| KycVerification | fullLegalName, dateOfBirth, address |
| Consent | ipAddress |
| RefreshToken | token |

## 🚨 Production Deployment

For production, use a Key Management Service (KMS):

- **AWS**: AWS Secrets Manager or KMS
- **GCP**: Google Secret Manager or Cloud KMS
- **Azure**: Azure Key Vault
- **Self-hosted**: HashiCorp Vault

See `docs/security/TDE_SETUP_GUIDE.md` for details.

## 💡 Pro Tips

1. **Backup your encryption key** - Store it securely in multiple locations
2. **Rotate keys regularly** - Implement quarterly key rotation
3. **Monitor encryption coverage** - Ensure all sensitive data is encrypted
4. **Test recovery** - Regularly test decryption and backup restoration
5. **Use TDE in production** - Add data-at-rest encryption for complete protection

---

**Questions?** Check the full documentation or contact: security@mnbara.com
