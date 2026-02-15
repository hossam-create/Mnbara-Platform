#!/usr/bin/env python3
import sys
import json
import base64
import numpy as np
import cv2 as cv
import face_recognition

def decode_base64_image(base64_string):
    """Decode base64 string to image"""
    img_bytes = base64.b64decode(base64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv.imdecode(img_array, cv.IMREAD_COLOR)
    return img

def get_face_encodings(img, num_jitters=10, model='large'):
    """Extract face encodings with high accuracy"""
    face_encodings = face_recognition.face_encodings(img, num_jitters=num_jitters, model=model)
    if len(face_encodings) > 0:
        return face_encodings[0].tolist()
    return []

def match_faces(img1_b64, img2_b64, threshold=0.5):
    """Compare two faces and return match result"""
    try:
        # Decode images
        img1 = decode_base64_image(img1_b64)
        img2 = decode_base64_image(img2_b64)
        
        # Get encodings
        enc1 = get_face_encodings(img1)
        enc2 = get_face_encodings(img2)
        
        if len(enc1) == 0:
            return {"match": False, "error": "No face detected in ID photo"}
        if len(enc2) == 0:
            return {"match": False, "error": "No face detected in selfie"}
        
        # Calculate distance
        distance = face_recognition.face_distance([enc1], enc2)[0]
        match = distance < threshold
        confidence = (1 - distance) * 100
        
        return {
            "match": match,
            "confidence": round(confidence, 2),
            "distance": round(float(distance), 4)
        }
    except Exception as e:
        return {"match": False, "error": str(e)}

if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    result = match_faces(
        input_data['img1'],
        input_data['img2'],
        input_data.get('threshold', 0.5)
    )
    print(json.dumps(result))
