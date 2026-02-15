# 🆔 Project #19: KYC System - Day 1 Complete ✅

**Date**: 3 فبراير 2026  
**Status**: Code Study Complete  
**Progress**: 0% → 15%  
**Next**: Day 2 - Backend Implementation

---

## 🎉 Day 1 Achievements

### ✅ Tasks Completed

1. ✅ Cloned source repository (KYC-Website)
2. ✅ Studied complete codebase structure
3. ✅ Analyzed face matching algorithm
4. ✅ Analyzed OCR implementation
5. ✅ Documented all extractable code
6. ✅ Created integration plan

---

## 📚 Source Code Analysis

### Repository Structure

```
KYC-Website/
├── app.js                      ✅ Main Express server
├── ML_verification.py          ✅ Face matching & OCR functions
├── verification.py             ✅ FastAPI ML server
├── models/
│   └── user.js                 ✅ MongoDB user model
├── middleware.js               ✅ Auth middleware
├── schemas.js                  ✅ Joi validation
├── utils/
│   ├── catchAsync.js           ✅ Error handling
│   └── expressError.js         ✅ Custom errors
├── views/                      ❌ EJS templates (won't use)
└── public/                     ❌ Static files (won't use)
```

---

## 🔍 Key Code Discoveries

### 1. Face Matching Algorithm ✅

**File**: `ML_verification.py`

```python
def get_face_encodings(img, num_jitters=10, model='large'):
    """
    Extract face encodings from image
    - num_jitters: Number of times to re-sample face (higher = more accurate)
    - model: 'small' or 'large' (large is more accurate)
    """
    face_encodings = face_recognition.face_encodings(
        img, 
        num_jitters=num_jitters, 
        model=model
    )
    try:
        return face_encodings[0]
    except:
        return []

def same_person(img1, img2, threshold=0.5):
    """
    Compare two faces
    - threshold: 0.6 is default, lower = stricter
    - Returns: True if same person, False otherwise
    """
    face_encodings1 = get_face_encodings(img1)
    face_encodings2 = get_face_encodings(img2)
    
    if len(face_encodings1) == 0 or len(face_encodings2) == 0:
        return False
    
    result = face_recognition.compare_faces(
        [face_encodings1], 
        face_encodings2, 
        tolerance=threshold
    )
    return result[0]
```

**Key Insights**:
- Uses `face_recognition` library (built on dlib)
- `num_jitters=10` for high accuracy (default is 1)
- `model='large'` for better accuracy (slower but better)
- `threshold=0.5` is stricter than default 0.6
- Returns boolean (True/False)

### 2. OCR Text Extraction ✅

**File**: `verification.py`

```python
import easyocr

reader = easyocr.Reader(['en'])

def get_ocr(img):
    """
    Extract text from image using EasyOCR
    Returns: List of (bbox, text, confidence)
    """
    result = reader.readtext(img)
    return result

# In verification endpoint:
text = reader.readtext(idImage)
concatenated_text = ''
for detection in text:
    text = detection[1]  # Get text (ignore bbox and confidence)
    concatenated_text += text + ' '

# Remove spaces and uppercase for matching
concatenated_text = concatenated_text.replace(' ', '', -1).upper()
```

**Key Insights**:
- Uses `easyocr` library (GPU-accelerated)
- Supports multiple languages (we use 'en')
- Returns: `[(bbox, text, confidence), ...]`
- Concatenates all text for fuzzy matching
- Removes spaces and uppercases for comparison

### 3. Verification Logic ✅

**File**: `verification.py`

```python
@app.post("/verify_details")
async def verify_details(request: Request):
    form = await request.json()
    authenticated = 0  # 0 = success, 1 = details mismatch, 2 = face mismatch
    description = ''
    
    # Extract form data
    name = form["name"].upper().replace(" ", "", -1)
    dob = form["dob"]
    idType = form["idType"]
    gender = form["gender"].upper() if idType.lower() == 'aadhaar' else None
    idNum = form["idNum"].replace(" ", "", -1)
    
    # Decode base64 images
    idImage = get_img_b64(form["idFront"])
    selfie = get_img_b64(form["selfie"])
    
    # OCR extraction
    text = reader.readtext(idImage)
    concatenated_text = ''
    for detection in text:
        concatenated_text += detection[1] + ' '
    concatenated_text = concatenated_text.replace(' ', '', -1).upper()
    
    # Step 1: Check text fields
    if name not in concatenated_text:
        authenticated = 1
        description += 'Name not matched \n'
    if dob not in concatenated_text:
        authenticated = 1
        description += 'DOB not matched \n'
    if idNum not in concatenated_text:
        authenticated = 1
        description += f'{idType} number not matched \n'
    if idType.lower() == 'aadhaar' and gender not in concatenated_text:
        authenticated = 1
        description += 'Gender not matched \n'
    
    # Step 2: Face matching (only if text matched)
    if authenticated == 0:
        face_match = same_person(idImage, selfie)
        if not face_match:
            authenticated = 2
            description += 'Face not matched \n'
    
    # Step 3: Return result
    if authenticated == 0:
        description = f'{idType} verified successfully'
    
    return Result(result=authenticated, description=description)
```

**Verification Flow**:
1. **Text Extraction**: OCR on ID card
2. **Text Matching**: Check name, DOB, ID number, gender
3. **Face Matching**: Compare ID photo with selfie
4. **Result**: 0 = success, 1 = text mismatch, 2 = face mismatch

### 4. Express Server Integration ✅

**File**: `app.js`

```javascript
app.post('/kyc', upload.fields([
    { name: 'idFront', maxCount: 1 }, 
    { name: 'idBack', maxCount: 1 }
]), (req, res) => {
    const dataBody = req.body;
    const user = req.user;
    
    // Format DOB
    const day = req.user.dob.getDate().toString().padStart(2, '0');
    const month = (req.user.dob.getMonth() + 1).toString().padStart(2, '0');
    const year = req.user.dob.getFullYear();
    const userDOB = `${day}/${month}/${year}`;
    
    // Read and encode ID image
    const imagePath = `./uploads/${req.files.idFront[0].filename}`;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Extract selfie from base64 data URL
    let selfieImg = dataBody.selfie;
    selfieImg = selfieImg.split(',')[1];  // Remove "data:image/jpeg;base64,"
    
    // Prepare request to ML API
    const axiosData = {
        dob: userDOB,
        name: user.fullname,
        gender: user.gender,
        idType: dataBody.idType,
        idNum: dataBody.idNum,
        idFront: base64Image,
        selfie: selfieImg
    };
    
    // Call ML API
    axios({
        method: 'post',
        url: 'http://141.148.199.47/verify_details',
        data: axiosData
    })
    .then(async function (response) {
        if (response.data.result === 0) {
            // Success - update user
            await User.findByIdAndUpdate(req.user._id, {
                $set: {
                    kycStatus: true,
                    idType: dataBody.idType,
                    idNum: dataBody.idNum
                }
            });
            req.flash('success', 'KYC Verification Successful');
            res.redirect('/');
        }
        else if (response.data.result === 1) {
            req.flash('error', 'KYC Verification Failed! Details Mismatch');
            res.redirect('/');
        }
        else if (response.data.result === 2) {
            req.flash('error', 'KYC Verification Failed! Please try again with clearer photo.');
            res.redirect('/');
        }
    })
    .catch(function (error) {
        req.flash('error', 'Something went wrong! Please try again later.');
        res.redirect('/');
    });
    
    // Clean up uploaded files
    fs.unlink(imagePath, (err) => { if (err) console.error(err) });
    fs.unlink(`./uploads/${req.files.idBack[0].filename}`, (err) => { if (err) console.error(err) });
});
```

**Key Points**:
- Uses `multer` for file uploads
- Converts images to base64 for API
- Calls external ML API (FastAPI)
- Updates user KYC status on success
- Cleans up uploaded files after processing

### 5. User Model ✅

**File**: `models/user.js`

```javascript
const userSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    idType: {
        type: String,
        required: false,
        default: "",
        enum: ["Aadhaar", "PAN", ""]
    },
    idNum: {
        type: String,
        required: false,
        default: "",
    },
    kycStatus: {
        type: Boolean,
        required: false,
        default: false
    }
});

userSchema.plugin(passportLocalMongoose);
```

**Key Fields**:
- `fullname`: User's full name
- `dob`: Date of birth
- `gender`: Male/Female
- `address`: Full address
- `idType`: Aadhaar, PAN, or empty
- `idNum`: ID number
- `kycStatus`: Boolean (verified or not)

---

## 🎯 What We'll Extract

### ✅ Can Use Directly (70%)

**Python ML Code**:
```python
✅ ML_verification.py
   - get_face_encodings()
   - same_person()
   - get_ocr()
   
✅ verification.py
   - verify_details() endpoint
   - Image decoding logic
   - Text matching logic
```

**Node.js Code**:
```javascript
✅ File upload handling (multer)
✅ Base64 encoding/decoding
✅ Image cleanup logic
✅ Error handling patterns
```

### ⚠️ Needs Adaptation (25%)

**Database Schema**:
```typescript
// Convert from MongoDB to Prisma/PostgreSQL
model KYCVerification {
  id                Int       @id @default(autoincrement())
  userId            Int       @unique
  user              User      @relation(fields: [userId], references: [id])
  
  // Document info
  documentType      String    // 'passport', 'national_id', 'drivers_license'
  documentNumber    String
  documentFrontPath String
  documentBackPath  String?
  selfiePath        String
  
  // Extracted data
  extractedName     String?
  extractedDOB      String?
  extractedGender   String?
  extractedText     String?   // Full OCR text
  
  // Face matching
  faceMatchScore    Float?
  faceMatchPassed   Boolean   @default(false)
  
  // Status
  status            KYCStatus @default(PENDING)
  rejectionReason   String?
  
  // Timestamps
  submittedAt       DateTime  @default(now())
  verifiedAt        DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

enum KYCStatus {
  PENDING
  PROCESSING
  APPROVED
  REJECTED
  MANUAL_REVIEW
}
```

**API Architecture**:
```typescript
// Instead of external ML API, we'll create internal service
// backend/services/kyc-service/
//   ├── src/
//   │   ├── services/
//   │   │   ├── kyc.service.ts          (main logic)
//   │   │   ├── face-match.service.ts   (Python bridge)
//   │   │   └── ocr.service.ts          (Python bridge)
//   │   └── python/
//   │       ├── face_match.py           (extracted from ML_verification.py)
//   │       └── ocr_extract.py          (extracted from verification.py)
```

### ❌ Won't Use (5%)

```
❌ EJS views (we use React)
❌ MongoDB (we use PostgreSQL)
❌ Passport.js (we have our own auth)
❌ Express sessions (we use JWT)
```

---

## 💡 Key Technical Insights

### Face Matching Performance

**Accuracy Settings**:
```python
# Default (fast but less accurate)
face_encodings = face_recognition.face_encodings(img)

# High accuracy (what they use)
face_encodings = face_recognition.face_encodings(
    img, 
    num_jitters=10,  # 10x slower but more accurate
    model='large'    # Better model
)
```

**Threshold Tuning**:
```python
# Default threshold
threshold = 0.6  # ~60% match required

# Stricter (what they use)
threshold = 0.5  # ~50% match required (stricter)

# Very strict
threshold = 0.4  # ~40% match required (very strict)
```

### OCR Performance

**EasyOCR vs Tesseract**:
- **EasyOCR**: Better for non-English, GPU-accelerated, easier to use
- **Tesseract**: Faster for English, CPU-only, more configuration

**Text Matching Strategy**:
```python
# Remove spaces and uppercase for fuzzy matching
text = text.replace(' ', '', -1).upper()

# Simple substring matching
if name in concatenated_text:
    # Match!
```

### Image Processing

**Base64 Encoding**:
```javascript
// Node.js
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = Buffer.from(imageBuffer).toString('base64');

// Python
im_bytes = base64.b64decode(base64_image)
im_arr = np.frombuffer(im_bytes, dtype=np.uint8)
img = cv.imdecode(im_arr, flags=cv.IMREAD_COLOR)
```

---

## 🚀 Integration Strategy

### Architecture Decision

**Option 1: Separate ML Service (Like Source)**
```
Express API → FastAPI ML Service → Python Libraries
```
- ✅ Clean separation
- ✅ Can scale ML independently
- ❌ Network latency
- ❌ More complex deployment

**Option 2: Python Bridge (Recommended)**
```
Express API → Python Child Process → Python Libraries
```
- ✅ No network latency
- ✅ Simpler deployment
- ✅ Can still scale
- ⚠️ Need to manage child processes

**Decision**: Use Python Bridge with child_process

### Implementation Plan

**Step 1: Extract Python Code**
```python
# backend/services/kyc-service/src/python/face_match.py
import face_recognition
import sys
import json
import base64
import numpy as np
import cv2 as cv

def get_face_encodings(img, num_jitters=10, model='large'):
    face_encodings = face_recognition.face_encodings(img, num_jitters=num_jitters, model=model)
    try:
        return face_encodings[0].tolist()  # Convert to list for JSON
    except:
        return []

def same_person(img1_b64, img2_b64, threshold=0.5):
    # Decode images
    img1 = decode_base64_image(img1_b64)
    img2 = decode_base64_image(img2_b64)
    
    # Get encodings
    enc1 = get_face_encodings(img1)
    enc2 = get_face_encodings(img2)
    
    if len(enc1) == 0 or len(enc2) == 0:
        return {"match": False, "error": "Face not detected"}
    
    # Compare
    distance = face_recognition.face_distance([enc1], enc2)[0]
    match = distance < threshold
    confidence = (1 - distance) * 100
    
    return {
        "match": match,
        "confidence": round(confidence, 2),
        "distance": round(distance, 4)
    }

if __name__ == "__main__":
    # Read from stdin
    input_data = json.loads(sys.stdin.read())
    result = same_person(
        input_data['img1'],
        input_data['img2'],
        input_data.get('threshold', 0.5)
    )
    print(json.dumps(result))
```

**Step 2: Create TypeScript Bridge**
```typescript
// backend/services/kyc-service/src/services/face-match.service.ts
import { spawn } from 'child_process';
import path from 'path';

export class FaceMatchService {
  private pythonPath: string;
  
  constructor() {
    this.pythonPath = path.join(__dirname, '../python/face_match.py');
  }
  
  async matchFaces(
    idPhotoBase64: string,
    selfieBase64: string,
    threshold: number = 0.5
  ): Promise<{
    match: boolean;
    confidence: number;
    distance: number;
    error?: string;
  }> {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonPath]);
      
      let output = '';
      let error = '';
      
      // Send input
      python.stdin.write(JSON.stringify({
        img1: idPhotoBase64,
        img2: selfieBase64,
        threshold
      }));
      python.stdin.end();
      
      // Collect output
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      // Handle completion
      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${error}`));
        } else {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${output}`));
          }
        }
      });
    });
  }
}
```

---

## 📊 Performance Expectations

### Face Matching
- **Processing Time**: 3-5 seconds per verification
- **Accuracy**: >95% with `num_jitters=10` and `model='large'`
- **False Positive Rate**: <5% with `threshold=0.5`
- **False Negative Rate**: <10% with `threshold=0.5`

### OCR Extraction
- **Processing Time**: 2-3 seconds per document
- **Accuracy**: >90% for clear images
- **Accuracy**: >70% for poor quality images
- **Languages**: English (can add more)

### Overall
- **Total Time**: 5-10 seconds per KYC verification
- **Success Rate**: ~85% auto-approval
- **Manual Review**: ~15% (low confidence or mismatches)

---

## 🎯 Next Steps (Day 2)

### Tomorrow's Tasks

1. ✅ Create KYC service structure
2. ✅ Extract Python code (face matching + OCR)
3. ✅ Create TypeScript bridges
4. ✅ Create Prisma schema
5. ✅ Create database migration
6. ✅ Test Python integration

### Files to Create

```
backend/services/kyc-service/
├── src/
│   ├── services/
│   │   ├── kyc.service.ts
│   │   ├── face-match.service.ts
│   │   └── ocr.service.ts
│   ├── python/
│   │   ├── face_match.py
│   │   ├── ocr_extract.py
│   │   └── requirements.txt
│   └── types/
│       └── kyc.types.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

---

## 🎊 Day 1 Success!

**What We Learned**:
- ✅ Complete understanding of face matching algorithm
- ✅ Complete understanding of OCR extraction
- ✅ Complete understanding of verification workflow
- ✅ Clear integration strategy
- ✅ Performance expectations

**What We'll Build**:
- ✅ Internal KYC service (not external API)
- ✅ Python bridge for ML operations
- ✅ TypeScript API for integration
- ✅ PostgreSQL for data storage
- ✅ S3 for image storage

**Time Saved**:
- Traditional development: 3-4 weeks
- With open source: 2-3 weeks
- **Time saved: 1-2 weeks** ⚡

---

**Status**: Day 1 Complete ✅  
**Next**: Day 2 - Backend Implementation  
**Progress**: 15%  
**Last Updated**: 3 فبراير 2026, 3:00 PM
