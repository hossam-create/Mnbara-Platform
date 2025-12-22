# Media Protection Module

This module provides comprehensive image protection for the MNBARA platform, including watermarking, digital fingerprinting, and duplicate detection.

## Features

- **Visible Watermarks**: Text or logo overlay on images
- **Invisible Watermarks**: LSB steganography for hidden identification
- **Digital Fingerprinting**: Unique identifiers for tracking image origin
- **Perceptual Hashing**: Similarity detection for duplicate images
- **Duplicate Detection**: Prevent re-uploading of existing images

## Installation

The module is part of the shared services. Ensure you have the required dependencies:

```bash
# For production image processing (optional but recommended)
npm install sharp
# or
npm install jimp
```

## Usage

### Basic Usage

```typescript
import { mediaProtectionService } from '@mnbara/shared/media';

// Protect an uploaded image
const result = await mediaProtectionService.protectImage(imageBuffer, {
  uploaderId: 'user-123',
  originalFilename: 'product.jpg',
  mimeType: 'image/jpeg',
});

console.log('Protected image ID:', result.id);
console.log('Is duplicate:', result.isDuplicate);
```

### Custom Configuration

```typescript
import { createMediaProtectionService } from '@mnbara/shared/media';

const service = createMediaProtectionService({
  watermark: {
    enabled: true,
    type: 'both', // 'visible', 'invisible', or 'both'
    visible: {
      text: 'MNBARA',
      position: 'bottom-right',
      opacity: 0.3,
    },
    invisible: {
      strength: 5,
    },
  },
  fingerprint: {
    enabled: true,
    hashAlgorithm: 'sha256',
  },
  duplicateDetection: {
    enabled: true,
    threshold: 0.9, // 90% similarity
    blockDuplicates: false,
  },
});
```

### Verify Image Protection

```typescript
const verification = await mediaProtectionService.verifyImage(imageBuffer);

if (verification.isProtected) {
  console.log('Image is protected');
  console.log('Fingerprint ID:', verification.fingerprintId);
  console.log('Confidence:', verification.confidence);
}
```

### Check for Duplicates

```typescript
const duplicateCheck = await mediaProtectionService.checkForDuplicates(imageBuffer);

if (duplicateCheck.isDuplicate) {
  console.log('Duplicate detected!');
  console.log('Similarity:', duplicateCheck.similarity);
  console.log('Matches:', duplicateCheck.matchingFingerprints);
}
```

## Integration with Listing Service

```typescript
// In listing-service/src/services/image-upload.service.ts

import { mediaProtectionService } from '@mnbara/shared/media';

async function uploadProductImage(
  file: Express.Multer.File,
  userId: string,
  listingId: string
) {
  // Protect the image
  const protected = await mediaProtectionService.protectImage(file.buffer, {
    uploaderId: userId,
    originalFilename: file.originalname,
    mimeType: file.mimetype,
    listingId,
  });

  // Check for duplicates
  if (protected.isDuplicate) {
    console.warn(`Duplicate image uploaded by user ${userId}`);
    // Optionally reject or flag the upload
  }

  // Upload protected image to MinIO
  const url = await minioService.upload(
    protected.protectedBuffer,
    `listings/${listingId}/${protected.id}.jpg`
  );

  return {
    url,
    fingerprintId: protected.id,
    isDuplicate: protected.isDuplicate,
  };
}
```

## API Reference

### MediaProtectionService

| Method | Description |
|--------|-------------|
| `protectImage(buffer, metadata)` | Process and protect an image |
| `verifyImage(buffer)` | Verify if image has MNBARA watermark |
| `checkForDuplicates(buffer)` | Check for similar existing images |
| `getFingerprint(id)` | Get fingerprint by ID |
| `getUserFingerprints(userId)` | Get all fingerprints for a user |
| `deleteFingerprint(id)` | Delete a fingerprint |
| `getStats()` | Get protection statistics |

### WatermarkService

| Method | Description |
|--------|-------------|
| `processImage(buffer, metadata)` | Apply watermark and generate fingerprint |
| `applyWatermark(buffer, fingerprintId)` | Apply watermark only |
| `extractInvisibleWatermark(buffer)` | Extract hidden watermark data |
| `verifyWatermark(buffer)` | Verify watermark presence |
| `findDuplicates(buffer, hashes, threshold)` | Find similar images |

## Database Schema

For production, store fingerprints in PostgreSQL:

```sql
CREATE TABLE image_fingerprints (
  id VARCHAR(50) PRIMARY KEY,
  hash VARCHAR(128) NOT NULL,
  perceptual_hash VARCHAR(64) NOT NULL,
  uploader_id VARCHAR(50) NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(50),
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  watermark_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_hash (hash),
  INDEX idx_perceptual_hash (perceptual_hash),
  INDEX idx_uploader (uploader_id),
  INDEX idx_created_at (created_at)
);
```

## Security Considerations

1. **Invisible Watermarks**: The LSB steganography implementation is basic. For production, consider using more robust algorithms.

2. **Perceptual Hashing**: The simplified pHash implementation may have false positives/negatives. Use a proper library like `imghash` for production.

3. **Storage**: Fingerprints contain metadata that could be sensitive. Ensure proper access controls.

4. **Performance**: Image processing can be CPU-intensive. Consider using a worker queue for batch processing.

## Future Enhancements

- [ ] Integration with sharp for production image processing
- [ ] Redis-based fingerprint caching
- [ ] Blockchain-based fingerprint verification
- [ ] AI-powered duplicate detection
- [ ] Video watermarking support
