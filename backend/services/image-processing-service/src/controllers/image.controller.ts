import { Request, Response } from 'express';
import { ImageProcessingService } from '../services/image-processing.service';
import { logger } from '../utils/logger';

const imageService = new ImageProcessingService();

export class ImageController {
  // Upload and process single image
  async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const options = {
        width: req.body.width ? parseInt(req.body.width) : undefined,
        height: req.body.height ? parseInt(req.body.height) : undefined,
        quality: req.body.quality ? parseInt(req.body.quality) : 80,
        format: req.body.format || 'jpeg'
      };

      const result = await imageService.processImage(req.file.buffer, options);

      res.json({
        success: true,
        data: {
          metadata: result.metadata,
          size: result.buffer.length,
          message: 'Image processed successfully'
        }
      });
    } catch (error: any) {
      logger.error('Upload single error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Upload and process multiple images
  async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files uploaded' });
      }

      const results = await Promise.all(
        req.files.map(file => imageService.processImage(file.buffer))
      );

      res.json({
        success: true,
        data: {
          count: results.length,
          images: results.map(r => ({
            metadata: r.metadata,
            size: r.buffer.length
          }))
        }
      });
    } catch (error: any) {
      logger.error('Upload multiple error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Generate thumbnails
  async generateThumbnails(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const sizes = req.body.sizes ? JSON.parse(req.body.sizes) : undefined;
      const thumbnails = await imageService.generateThumbnails(req.file.buffer, sizes);

      res.json({
        success: true,
        data: {
          thumbnails: Object.keys(thumbnails).reduce((acc, key) => {
            acc[key] = { path: thumbnails[key].path };
            return acc;
          }, {} as Record<string, any>)
        }
      });
    } catch (error: any) {
      logger.error('Generate thumbnails error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Optimize image
  async optimize(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const result = await imageService.optimizeImage(req.file.buffer);

      res.json({
        success: true,
        data: {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          savings: ((result.originalSize - result.optimizedSize) / result.originalSize * 100).toFixed(2) + '%'
        }
      });
    } catch (error: any) {
      logger.error('Optimize error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Convert format
  async convert(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const format = req.body.format || 'jpeg';
      const quality = req.body.quality ? parseInt(req.body.quality) : 80;

      const converted = await imageService.convertFormat(req.file.buffer, format, quality);

      res.json({
        success: true,
        data: {
          format,
          size: converted.length,
          message: 'Image converted successfully'
        }
      });
    } catch (error: any) {
      logger.error('Convert error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Crop image
  async crop(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const { x, y, width, height } = req.body;
      const cropped = await imageService.cropImage(
        req.file.buffer,
        parseInt(x),
        parseInt(y),
        parseInt(width),
        parseInt(height)
      );

      res.json({
        success: true,
        data: {
          size: cropped.length,
          message: 'Image cropped successfully'
        }
      });
    } catch (error: any) {
      logger.error('Crop error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Rotate image
  async rotate(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const angle = parseInt(req.body.angle) || 90;
      const rotated = await imageService.rotateImage(req.file.buffer, angle);

      res.json({
        success: true,
        data: {
          angle,
          size: rotated.length,
          message: 'Image rotated successfully'
        }
      });
    } catch (error: any) {
      logger.error('Rotate error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get metadata
  async getMetadata(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const metadata = await imageService.getMetadata(req.file.buffer);

      res.json({
        success: true,
        data: metadata
      });
    } catch (error: any) {
      logger.error('Get metadata error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Blur image
  async blur(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const sigma = req.body.sigma ? parseFloat(req.body.sigma) : 5;
      const blurred = await imageService.blurImage(req.file.buffer, sigma);

      res.json({
        success: true,
        data: {
          sigma,
          size: blurred.length,
          message: 'Image blurred successfully'
        }
      });
    } catch (error: any) {
      logger.error('Blur error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Grayscale image
  async grayscale(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const grayscale = await imageService.grayscaleImage(req.file.buffer);

      res.json({
        success: true,
        data: {
          size: grayscale.length,
          message: 'Image converted to grayscale'
        }
      });
    } catch (error: any) {
      logger.error('Grayscale error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
