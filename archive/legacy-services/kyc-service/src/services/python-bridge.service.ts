/**
 * Python Bridge Service
 * Executes Python ML scripts via child_process
 */

import { spawn } from 'child_process';
import path from 'path';

interface FaceMatchResult {
  match: boolean;
  confidence?: number;
  distance?: number;
  error?: string;
}

interface OCRResult {
  success: boolean;
  text?: string;
  raw?: string[];
  error?: string;
}

export class PythonBridgeService {
  private pythonPath: string;
  private scriptsPath: string;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.scriptsPath = path.join(__dirname, '../python');
  }

  /**
   * Execute Python script with JSON input/output
   */
  private async executePython(
    scriptName: string,
    input: any,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsPath, scriptName);
      const python = spawn(this.pythonPath, [scriptPath]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      });

      // Send input as JSON
      python.stdin.write(JSON.stringify(input));
      python.stdin.end();
    });
  }

  /**
   * Match two faces using face_recognition
   * 
   * @param img1Base64 - ID photo (base64)
   * @param img2Base64 - Selfie photo (base64)
   * @param threshold - Match threshold (default: 0.5)
   */
  async matchFaces(
    img1Base64: string,
    img2Base64: string,
    threshold: number = 0.5,
  ): Promise<FaceMatchResult> {
    return await this.executePython('face_match.py', {
      img1: img1Base64,
      img2: img2Base64,
      threshold,
    });
  }

  /**
   * Extract text from image using OCR
   * 
   * @param imageBase64 - Image (base64)
   */
  async extractText(imageBase64: string): Promise<OCRResult> {
    return await this.executePython('ocr_extract.py', {
      image: imageBase64,
    });
  }
}
