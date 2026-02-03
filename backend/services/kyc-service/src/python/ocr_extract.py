#!/usr/bin/env python3
import sys
import json
import base64
import numpy as np
import cv2 as cv
import easyocr

reader = easyocr.Reader(['en'])

def decode_base64_image(base64_string):
    """Decode base64 string to image"""
    img_bytes = base64.b64decode(base64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv.imdecode(img_array, cv.IMREAD_COLOR)
    return img

def extract_text(img_b64):
    """Extract text from image using OCR"""
    try:
        img = decode_base64_image(img_b64)
        result = reader.readtext(img)
        
        # Extract text and concatenate
        texts = [detection[1] for detection in result]
        concatenated = ''.join(texts).replace(' ', '').upper()
        
        return {
            "success": True,
            "text": concatenated,
            "raw": texts
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    result = extract_text(input_data['image'])
    print(json.dumps(result))
