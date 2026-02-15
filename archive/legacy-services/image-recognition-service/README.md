# Image Recognition Service

AI-powered image recognition and classification using TensorFlow.js with MobileNet and COCO-SSD models.

## Features

- ✅ Image classification (MobileNet)
- ✅ Object detection (COCO-SSD)
- ✅ Automatic tagging
- ✅ Category suggestion
- ✅ Visual search
- ✅ Product matching

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

### Analyze Image
```bash
POST /api/recognition/analyze
Content-Type: multipart/form-data

image: <file>
detectObjects: true (optional)
```

### Classify Image
```bash
POST /api/recognition/classify
Content-Type: multipart/form-data

image: <file>
```

### Detect Objects
```bash
POST /api/recognition/detect
Content-Type: multipart/form-data

image: <file>
```

### Visual Search
```bash
POST /api/recognition/search
Content-Type: multipart/form-data

image: <file>
```

### Suggest Category
```bash
POST /api/recognition/suggest-category
Content-Type: multipart/form-data

image: <file>
```

## Usage Examples

### Analyze Product Image
```bash
curl -X POST http://localhost:3019/api/recognition/analyze \
  -F "image=@product.jpg" \
  -F "detectObjects=true"
```

Response:
```json
{
  "imageUrl": "",
  "classifications": [
    { "className": "laptop, notebook computer", "probability": 0.95 },
    { "className": "computer keyboard", "probability": 0.03 }
  ],
  "objects": [
    { "class": "laptop", "score": 0.92, "bbox": [10, 20, 300, 200] }
  ],
  "dominantCategory": "laptop",
  "suggestedTags": ["laptop", "notebook", "computer", "electronics"],
  "processingTime": 1250
}
```

### Suggest Category
```bash
curl -X POST http://localhost:3019/api/recognition/suggest-category \
  -F "image=@shoe.jpg"
```

Response:
```json
{
  "topClassification": "running shoe, sneaker",
  "suggestedCategory": "Fashion",
  "confidence": 0.89,
  "alternatives": [
    { "classification": "athletic shoe", "category": "Fashion", "confidence": 0.07 }
  ]
}
```

## Integration

### Auto-Categorize Products
```javascript
// When seller uploads product image
const formData = new FormData();
formData.append('image', imageFile);

const { suggestedCategory, suggestedTags } = await fetch(
  'http://localhost:3019/api/recognition/suggest-category',
  { method: 'POST', body: formData }
).then(r => r.json());

// Pre-fill category and tags
setProductCategory(suggestedCategory);
setProductTags(suggestedTags);
```

### Visual Search
```javascript
// User uploads image to find similar products
const formData = new FormData();
formData.append('image', searchImage);

const { matches } = await fetch(
  'http://localhost:3019/api/recognition/search',
  { method: 'POST', body: formData }
).then(r => r.json());

// Display similar products
displaySearchResults(matches);
```

## Port

3019

## Models

- **MobileNet v2**: Image classification (1000 classes)
- **COCO-SSD**: Object detection (80 classes)
