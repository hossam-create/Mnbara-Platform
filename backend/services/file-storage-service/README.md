# File Storage Service

Complete file upload and storage service with AWS S3 integration, image processing, and presigned URLs.

## Features

- ✅ AWS S3 integration
- ✅ Local storage fallback
- ✅ Image processing (resize, thumbnails)
- ✅ Multiple file uploads
- ✅ Presigned URLs (upload & download)
- ✅ File type validation
- ✅ Size limits
- ✅ Metadata support

## Quick Start

```bash
npm install
cp .env.example .env
# Configure AWS credentials
npm run dev
```

## API Endpoints

### Upload Single File
```bash
POST /files/upload
Content-Type: multipart/form-data

file: <file>
folder: "products" (optional)
generateThumbnail: "true" (optional)
resize: '{"width":1024,"height":768}' (optional)
metadata: '{"userId":"123"}' (optional)
```

### Upload Multiple Files
```bash
POST /files/upload/multiple
Content-Type: multipart/form-data

files: <file1>, <file2>, ...
folder: "products"
```

### Delete File
```bash
DELETE /files/delete
Content-Type: application/json

{
  "key": "uploads/abc-123.jpg",
  "provider": "S3"
}
```

### Get Presigned Download URL
```bash
GET /files/presigned-url?key=uploads/abc-123.jpg&expiresIn=3600
```

### Get Presigned Upload URL
```bash
POST /files/presigned-upload-url
Content-Type: application/json

{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "expiresIn": 3600
}
```

## Usage Examples

### Upload with cURL
```bash
curl -X POST http://localhost:3017/files/upload \
  -F "file=@photo.jpg" \
  -F "folder=products" \
  -F "generateThumbnail=true"
```

### Upload with JavaScript
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'products');
formData.append('generateThumbnail', 'true');

const response = await fetch('http://localhost:3017/files/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result.url);
```

### Direct Upload to S3
```javascript
// 1. Get presigned upload URL
const { url, key } = await fetch('http://localhost:3017/files/presigned-upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: 'photo.jpg',
    contentType: 'image/jpeg'
  })
}).then(r => r.json());

// 2. Upload directly to S3
await fetch(url, {
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg' },
  body: file
});

console.log('Uploaded to:', key);
```

## Configuration

### Environment Variables
```env
PORT=3017
STORAGE_PROVIDER=S3  # or LOCAL

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=mnbara-uploads

# File Limits
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# Image Processing
IMAGE_MAX_WIDTH=2048
IMAGE_MAX_HEIGHT=2048
THUMBNAIL_SIZE=300
```

## Integration

### Product Images
```javascript
// Upload product image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('folder', 'products');
formData.append('generateThumbnail', 'true');
formData.append('metadata', JSON.stringify({ productId: '123' }));

const { url, thumbnailUrl } = await uploadFile(formData);

// Save URLs to product
await updateProduct(productId, { imageUrl: url, thumbnailUrl });
```

### User Avatars
```javascript
// Upload avatar with resize
formData.append('resize', JSON.stringify({ width: 400, height: 400 }));
const { url } = await uploadFile(formData);
```

### Document Upload
```javascript
// Upload PDF document
formData.append('file', pdfFile);
formData.append('folder', 'documents');
const { url } = await uploadFile(formData);
```

## Port

3017

## Dependencies

- express - Web framework
- @aws-sdk/client-s3 - AWS S3 client
- multer - File upload handling
- sharp - Image processing
- uuid - Unique IDs
