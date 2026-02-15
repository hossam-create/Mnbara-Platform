# Image Processing Service

Professional image upload and processing service using Multer and Sharp for the Mnbara platform.

## Features

### Upload Capabilities
- 📤 Single file upload
- 📤 Multiple file upload (up to 10 files)
- 💾 Memory storage (for processing)
- 💾 Disk storage (for direct uploads)
- 🔒 File type validation (JPEG, PNG, WebP, GIF)
- 📏 File size limits (10MB max)

### Image Processing
- 🖼️ Resize and crop
- 🔄 Format conversion (JPEG, PNG, WebP)
- ⚡ Image optimization (reduce file size)
- 🎨 Thumbnail generation (small, medium, large)
- 🔄 Rotation (any angle)
- 🌫️ Blur effect
- ⚫ Grayscale conversion
- 💧 Watermark support (text & image)
- 📊 Metadata extraction

### Advanced Features
- High-quality image processing with Sharp
- Progressive JPEG optimization
- Automatic format detection
- Configurable quality settings
- Multiple fit modes (cover, contain, fill)
- Custom thumbnail sizes
- Batch processing support

## API Endpoints

### Upload Single Image
```http
POST /api/images/upload/single
Content-Type: multipart/form-data

Body:
- image: File (required)
- width: number (optional)
- height: number (optional)
- quality: number (optional, default: 80)
- format: string (optional, default: 'jpeg')

Response: {
  "success": true,
  "data": {
    "metadata": { width, height, format, size, ... },
    "size": 123456,
    "message": "Image processed successfully"
  }
}
```

### Upload Multiple Images
```http
POST /api/images/upload/multiple
Content-Type: multipart/form-data

Body:
- images: File[] (required, max 10)

Response: {
  "success": true,
  "data": {
    "count": 3,
    "images": [
      { "metadata": {...}, "size": 123456 },
      ...
    ]
  }
}
```

### Generate Thumbnails
```http
POST /api/images/thumbnails
Content-Type: multipart/form-data

Body:
- image: File (required)
- sizes: JSON (optional)
  {
    "small": { "width": 150, "height": 150 },
    "medium": { "width": 300, "height": 300 },
    "large": { "width": 600, "height": 600 }
  }

Response: {
  "success": true,
  "data": {
    "thumbnails": {
      "small": { "path": "uploads/processed/..." },
      "medium": { "path": "uploads/processed/..." },
      "large": { "path": "uploads/processed/..." }
    }
  }
}
```

### Optimize Image
```http
POST /api/images/optimize
Content-Type: multipart/form-data

Body:
- image: File (required)

Response: {
  "success": true,
  "data": {
    "originalSize": 500000,
    "optimizedSize": 250000,
    "savings": "50.00%"
  }
}
```

### Convert Format
```http
POST /api/images/convert
Content-Type: multipart/form-data

Body:
- image: File (required)
- format: string (required: 'jpeg', 'png', 'webp')
- quality: number (optional, default: 80)

Response: {
  "success": true,
  "data": {
    "format": "webp",
    "size": 123456,
    "message": "Image converted successfully"
  }
}
```

### Crop Image
```http
POST /api/images/crop
Content-Type: multipart/form-data

Body:
- image: File (required)
- x: number (required)
- y: number (required)
- width: number (required)
- height: number (required)

Response: {
  "success": true,
  "data": {
    "size": 123456,
    "message": "Image cropped successfully"
  }
}
```

### Rotate Image
```http
POST /api/images/rotate
Content-Type: multipart/form-data

Body:
- image: File (required)
- angle: number (optional, default: 90)

Response: {
  "success": true,
  "data": {
    "angle": 90,
    "size": 123456,
    "message": "Image rotated successfully"
  }
}
```

### Blur Image
```http
POST /api/images/blur
Content-Type: multipart/form-data

Body:
- image: File (required)
- sigma: number (optional, default: 5)

Response: {
  "success": true,
  "data": {
    "sigma": 5,
    "size": 123456,
    "message": "Image blurred successfully"
  }
}
```

### Grayscale Image
```http
POST /api/images/grayscale
Content-Type: multipart/form-data

Body:
- image: File (required)

Response: {
  "success": true,
  "data": {
    "size": 123456,
    "message": "Image converted to grayscale"
  }
}
```

### Get Metadata
```http
POST /api/images/metadata
Content-Type: multipart/form-data

Body:
- image: File (required)

Response: {
  "success": true,
  "data": {
    "format": "jpeg",
    "width": 1920,
    "height": 1080,
    "space": "srgb",
    "channels": 3,
    "depth": "uchar",
    "density": 72,
    "hasAlpha": false,
    "orientation": 1
  }
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Create upload directories:
```bash
mkdir -p uploads/processed
```

4. Start service:
```bash
npm run dev
```

## Integration Examples

### Frontend - Upload Product Image
```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('width', '800');
formData.append('height', '600');
formData.append('quality', '85');

const response = await fetch('http://localhost:3025/api/images/upload/single', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Processed image:', result.data);
```

### Frontend - Generate Thumbnails
```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('sizes', JSON.stringify({
  small: { width: 150, height: 150 },
  medium: { width: 300, height: 300 },
  large: { width: 600, height: 600 }
}));

const response = await fetch('http://localhost:3025/api/images/thumbnails', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Thumbnails:', result.data.thumbnails);
```

### Backend - Process Image
```typescript
import { ImageProcessingService } from './services/image-processing.service';

const imageService = new ImageProcessingService();

// Resize and optimize
const processed = await imageService.processImage(buffer, {
  width: 800,
  height: 600,
  quality: 85,
  format: 'jpeg',
  fit: 'cover'
});

// Generate thumbnails
const thumbnails = await imageService.generateThumbnails(buffer);

// Optimize
const optimized = await imageService.optimizeImage(buffer);
console.log(`Saved ${optimized.savings}%`);
```

## Port

**3025** - Image Processing Service

## Tech Stack

- Express.js - Web framework
- Multer - File upload handling
- Sharp - High-performance image processing
- TypeScript - Type safety
- Winston - Logging

## Security Features

- File type validation (whitelist)
- File size limits (10MB)
- Memory-safe processing
- Input sanitization
- Error handling

## Performance

- Fast processing with Sharp (libvips)
- Memory-efficient streaming
- Progressive JPEG optimization
- Batch processing support
- Configurable quality settings

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 4, 2026
