import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  watermark?: {
    text?: string;
    image?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
}

export interface ThumbnailSizes {
  small: { width: number; height: number };
  medium: { width: number; height: number };
  large: { width: number; height: number };
}

export class ImageProcessingService {
  private outputDir: string;

  constructor() {
    this.outputDir = process.env.OUTPUT_DIR || 'uploads/processed/';
  }

  // Process single image
  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {}
  ): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    try {
      const {
        width,
        height,
        quality = 80,
        format = 'jpeg',
        fit = 'cover'
      } = options;

      let pipeline = sharp(buffer);

      // Resize if dimensions provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, { fit });
      }

      // Convert format
      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      // Add watermark if provided
      if (options.watermark) {
        pipeline = await this.addWatermark(pipeline, options.watermark);
      }

      const processedBuffer = await pipeline.toBuffer();
      const metadata = await sharp(processedBuffer).metadata();

      logger.info('Image processed successfully');
      return { buffer: processedBuffer, metadata };
    } catch (error) {
      logger.error('Image processing error:', error);
      throw error;
    }
  }

  // Generate multiple thumbnails
  async generateThumbnails(
    buffer: Buffer,
    sizes: ThumbnailSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    }
  ): Promise<Record<string, { buffer: Buffer; path: string }>> {
    try {
      const thumbnails: Record<string, { buffer: Buffer; path: string }> = {};

      for (const [size, dimensions] of Object.entries(sizes)) {
        const processed = await this.processImage(buffer, {
          width: dimensions.width,
          height: dimensions.height,
          quality: 80,
          format: 'jpeg',
          fit: 'cover'
        });

        const filename = `${uuidv4()}-${size}.jpg`;
        const filepath = path.join(this.outputDir, filename);

        await fs.mkdir(this.outputDir, { recursive: true });
        await fs.writeFile(filepath, processed.buffer);

        thumbnails[size] = {
          buffer: processed.buffer,
          path: filepath
        };
      }

      logger.info('Thumbnails generated successfully');
      return thumbnails;
    } catch (error) {
      logger.error('Thumbnail generation error:', error);
      throw error;
    }
  }

  // Optimize image (reduce file size)
  async optimizeImage(buffer: Buffer): Promise<{ buffer: Buffer; originalSize: number; optimizedSize: number }> {
    try {
      const originalSize = buffer.length;

      const optimized = await sharp(buffer)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const optimizedSize = optimized.length;
      const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

      logger.info(`Image optimized: ${originalSize} -> ${optimizedSize} bytes (${savings}% reduction)`);

      return {
        buffer: optimized,
        originalSize,
        optimizedSize
      };
    } catch (error) {
      logger.error('Image optimization error:', error);
      throw error;
    }
  }

  // Convert image format
  async convertFormat(
    buffer: Buffer,
    format: 'jpeg' | 'png' | 'webp',
    quality: number = 80
  ): Promise<Buffer> {
    try {
      let pipeline = sharp(buffer);

      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      const converted = await pipeline.toBuffer();
      logger.info(`Image converted to ${format}`);
      return converted;
    } catch (error) {
      logger.error('Format conversion error:', error);
      throw error;
    }
  }

  // Crop image
  async cropImage(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      const cropped = await sharp(buffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer();

      logger.info('Image cropped successfully');
      return cropped;
    } catch (error) {
      logger.error('Image crop error:', error);
      throw error;
    }
  }

  // Rotate image
  async rotateImage(buffer: Buffer, angle: number): Promise<Buffer> {
    try {
      const rotated = await sharp(buffer)
        .rotate(angle)
        .toBuffer();

      logger.info(`Image rotated ${angle} degrees`);
      return rotated;
    } catch (error) {
      logger.error('Image rotation error:', error);
      throw error;
    }
  }

  // Add watermark
  private async addWatermark(
    pipeline: sharp.Sharp,
    watermark: { text?: string; image?: string; position?: string }
  ): Promise<sharp.Sharp> {
    try {
      if (watermark.text) {
        // Text watermark (requires SVG overlay)
        const svg = `
          <svg width="200" height="50">
            <text x="10" y="30" font-family="Arial" font-size="20" fill="white" opacity="0.5">
              ${watermark.text}
            </text>
          </svg>
        `;
        const svgBuffer = Buffer.from(svg);
        
        pipeline = pipeline.composite([{
          input: svgBuffer,
          gravity: this.getGravity(watermark.position)
        }]);
      }

      if (watermark.image) {
        // Image watermark
        const watermarkBuffer = await fs.readFile(watermark.image);
        pipeline = pipeline.composite([{
          input: watermarkBuffer,
          gravity: this.getGravity(watermark.position)
        }]);
      }

      return pipeline;
    } catch (error) {
      logger.error('Watermark error:', error);
      return pipeline;
    }
  }

  // Get gravity for watermark position
  private getGravity(position?: string): any {
    const gravityMap: Record<string, any> = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      'center': 'center'
    };
    return gravityMap[position || 'bottom-right'] || 'southeast';
  }

  // Get image metadata
  async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata;
    } catch (error) {
      logger.error('Metadata extraction error:', error);
      throw error;
    }
  }

  // Blur image
  async blurImage(buffer: Buffer, sigma: number = 5): Promise<Buffer> {
    try {
      const blurred = await sharp(buffer)
        .blur(sigma)
        .toBuffer();

      logger.info('Image blurred successfully');
      return blurred;
    } catch (error) {
      logger.error('Image blur error:', error);
      throw error;
    }
  }

  // Grayscale image
  async grayscaleImage(buffer: Buffer): Promise<Buffer> {
    try {
      const grayscale = await sharp(buffer)
        .grayscale()
        .toBuffer();

      logger.info('Image converted to grayscale');
      return grayscale;
    } catch (error) {
      logger.error('Grayscale conversion error:', error);
      throw error;
    }
  }
}
