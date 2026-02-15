import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

interface OptimizedImageResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  outputPath: string;
  format: string;
  dimensions: { width: number; height: number };
}

class ImageOptimizer {
  private readonly uploadDir: string;
  private readonly optimizedDir: string;
  private readonly defaultOptions: ImageOptimizationOptions;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads/categories';
    this.optimizedDir = process.env.OPTIMIZED_DIR || './uploads/categories/optimized';
    this.defaultOptions = {
      width: 400,
      height: 400,
      quality: 80,
      format: 'webp',
      fit: 'cover'
    };

    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.optimizedDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async optimizeCategoryImage(
    inputPath: string,
    categoryId: string,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<OptimizedImageResult> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      const inputBuffer = await fs.readFile(inputPath);
      const originalSize = inputBuffer.length;

      // Get original image metadata
      const metadata = await sharp(inputBuffer).metadata();

      // Generate optimized filename
      const filename = `${categoryId}_${uuidv4()}.${opts.format}`;
      const outputPath = path.join(this.optimizedDir, filename);

      // Perform optimization
      const optimizer = sharp(inputBuffer)
        .resize(opts.width, opts.height, { fit: opts.fit as any })
        .jpeg({ quality: opts.quality });

      if (opts.format === 'webp') {
        optimizer.webp({ quality: opts.quality });
      } else if (opts.format === 'png') {
        optimizer.png({ quality: opts.quality });
      }

      const outputBuffer = await optimizer.toBuffer();
      const optimizedSize = outputBuffer.length;

      // Save optimized image
      await fs.writeFile(outputPath, outputBuffer);

      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        outputPath,
        format: opts.format,
        dimensions: {
          width: metadata?.width || 0,
          height: metadata?.height || 0
        }
      };
    } catch (error) {
      console.error('Error optimizing image:', error);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  async generateThumbnails(
    inputPath: string,
    categoryId: string
  ): Promise<{ small: OptimizedImageResult; medium: OptimizedImageResult; large: OptimizedImageResult }> {
    try {
      const small = await this.optimizeCategoryImage(inputPath, categoryId, {
        width: 150,
        height: 150,
        quality: 70
      });

      const medium = await this.optimizeCategoryImage(inputPath, categoryId, {
        width: 300,
        height: 300,
        quality: 75
      });

      const large = await this.optimizeCategoryImage(inputPath, categoryId, {
        width: 600,
        height: 600,
        quality: 80
      });

      return { small, medium, large };
    } catch (error) {
      console.error('Error generating thumbnails:', error);
      throw error;
    }
  }

  async deleteOptimizedImages(categoryId: string): Promise<void> {
    try {
      const files = await fs.readdir(this.optimizedDir);
      const categoryFiles = files.filter(file => file.startsWith(categoryId));

      for (const file of categoryFiles) {
        await fs.unlink(path.join(this.optimizedDir, file));
      }
    } catch (error) {
      console.error('Error deleting optimized images:', error);
    }
  }

  async getImageStats(categoryId: string): Promise<{
    small?: OptimizedImageResult;
    medium?: OptimizedImageResult;
    large?: OptimizedImageResult;
  }> {
    try {
      const files = await fs.readdir(this.optimizedDir);
      const categoryFiles = files.filter(file => file.startsWith(categoryId));

      const stats: any = {};
      
      for (const file of categoryFiles) {
        const filePath = path.join(this.optimizedDir, file);
        const fileStats = await fs.stat(filePath);
        
        if (file.includes('_small')) {
          stats.small = { size: fileStats.size, path: filePath };
        } else if (file.includes('_medium')) {
          stats.medium = { size: fileStats.size, path: filePath };
        } else if (file.includes('_large')) {
          stats.large = { size: fileStats.size, path: filePath };
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting image stats:', error);
      return {};
    }
  }

  async validateImage(inputPath: string): Promise<boolean> {
    try {
      const inputBuffer = await fs.readFile(inputPath);
      const metadata = await sharp(inputBuffer).metadata();
      
      // Check if it's a valid image format
      const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
      return validFormats.includes(metadata.format?.toLowerCase() || '');
    } catch (error) {
      return false;
    }
  }

  async compressForWeb(inputPath: string): Promise<OptimizedImageResult> {
    return this.optimizeCategoryImage(inputPath, uuidv4(), {
      width: 1200,
      height: 800,
      quality: 75,
      format: 'webp'
    });
  }

  getPublicUrl(imagePath: string): string {
    const relativePath = path.relative(process.cwd(), imagePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }
}

// Singleton instance
export const imageOptimizer = new ImageOptimizer();

// Middleware for handling image uploads
export const handleImageUpload = async (file: Express.Multer.File, categoryId: string) => {
  try {
    // Validate image
    const isValid = await imageOptimizer.validateImage(file.path);
    if (!isValid) {
      throw new Error('Invalid image format');
    }

    // Generate optimized versions
    const thumbnails = await imageOptimizer.generateThumbnails(file.path, categoryId);

    // Get public URLs
    const urls = {
      small: imageOptimizer.getPublicUrl(thumbnails.small.outputPath),
      medium: imageOptimizer.getPublicUrl(thumbnails.medium.outputPath),
      large: imageOptimizer.getPublicUrl(thumbnails.large.outputPath)
    };

    // Clean up original file
    await fs.unlink(file.path);

    return {
      success: true,
      urls,
      stats: {
        small: thumbnails.small,
        medium: thumbnails.medium,
        large: thumbnails.large
      }
    };
  } catch (error) {
    console.error('Error handling image upload:', error);
    throw error;
  }
};

export default ImageOptimizer;
