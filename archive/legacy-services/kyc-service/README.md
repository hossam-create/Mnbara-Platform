# KYC Service

ML-powered KYC verification with face matching and OCR.

**Reference:** For a full web-based KYC flow with OCR (easy-ocr) and face matching (face_recognition) via a separate ML API, see **`docs/external-projects/KYC-Website/`**. That project uses Node/Express + MongoDB + FastAPI ML backend; this service uses TypeScript + Python child_process. See [EXTERNAL_PROJECTS_INTEGRATION.md](../../../docs/EXTERNAL_PROJECTS_INTEGRATION.md).

## Features

- **Face Matching**: face_recognition library (num_jitters=10, model='large', threshold=0.5)
- **OCR**: easyocr for text extraction from ID documents
- **Auto-verification**: Auto-approve/reject based on ML results
- **Manual Review**: Admin review for edge cases
- **File Storage**: Local storage with image optimization

## Architecture

```
TypeScript (Express) → Python (child_process) → ML Libraries
```

## Setup

### 1. Install Node Dependencies

```bash
cd backend/services/kyc-service
npm install
```

### 2. Install Python Dependencies

```bash
pip install -r src/python/requirements.txt
```

### 3. Database Setup

```bash
npx prisma migrate deploy
```

### 4. Environment Variables

```bash
cp .env.example .env
# Edit .env with your settings
```

### 5. Start Service

```bash
npm run dev
```

## API Endpoints

### User Endpoints

**POST /kyc/submit**
Submit KYC verification with ID photo and selfie.

```bash
curl -X POST http://localhost:3007/kyc/submit \
  -F "idType=national_id" \
  -F "idNumber=123456789" \
  -F "fullName=John Doe" \
  -F "idPhoto=@id.jpg" \
  -F "selfiePhoto=@selfie.jpg"
```

**GET /kyc/status**
Get verification status.

```bash
curl http://localhost:3007/kyc/status
```

### Admin Endpoints

**GET /admin/kyc/pending**
Get pending verifications.

```bash
curl http://localhost:3007/admin/kyc/pending
```

**POST /admin/kyc/:id/review**
Review verification.

```bash
curl -X POST http://localhost:3007/admin/kyc/1/review \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

## Verification Flow

1. **Upload**: User uploads ID photo + selfie
2. **OCR**: Extract text from ID photo
3. **Text Match**: Check if ID number appears in OCR text
4. **Face Match**: Compare faces (threshold: 0.5)
5. **Auto-Decision**:
   - Both pass → APPROVED
   - Both fail → REJECTED
   - Mixed → PENDING (manual review)
6. **Admin Review**: Admin approves/rejects pending cases

## ML Configuration

### Face Matching
- Library: face_recognition
- Model: large (more accurate)
- Jitters: 10 (higher accuracy)
- Threshold: 0.5 (distance threshold)

### OCR
- Library: easyocr
- Language: English
- Output: Concatenated uppercase text

## Testing

```bash
# Unit tests
npm test

# Integration test
npm run test:integration
```

## Port

Default: 3007

## Dependencies

- express: Web framework
- @prisma/client: Database ORM
- multer: File upload
- sharp: Image optimization
- Python 3.x: ML runtime
- face_recognition: Face matching
- easyocr: OCR
- opencv-python: Image processing
