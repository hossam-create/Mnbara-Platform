import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import sharp from 'sharp';
import { ImageClassification, ObjectDetection, RecognitionResult, RecognitionModel } from '../types/recognition.types';
import { logger } from '../utils/logger';

export class RecognitionService {
  private mobileNetModel: mobilenet.MobileNet | null = null;
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      logger.info('Loading ML models...');
      
      // Load MobileNet for image classification
      this.mobileNetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      
      // Load COCO-SSD for object detection
      this.cocoSsdModel = await cocoSsd.load({
        base: 'mobilenet_v2'
      });

      this.isInitialized = true;
      logger.info('ML models loaded successfully');
    } catch (error) {
      logger.error('Failed to load ML models:', error);
      throw new Error('Failed to initialize recognition service');
    }
  }

  async classifyImage(imageBuffer: Buffer): Promise<ImageClassification[]> {
    await this.initialize();

    if (!this.mobileNetModel) {
      throw new Error('MobileNet model not loaded');
    }

    try {
      // Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);
      const tensor = tf.node.decodeImage(processedImage, 3);

      // Classify
      const predictions = await this.mobileNetModel.classify(tensor as tf.Tensor3D);

      // Cleanup
      tensor.dispose();

      return predictions.map(pred => ({
        className: pred.className,
        probability: pred.probability
      }));
    } catch (error) {
      logger.error('Image classification error:', error);
      throw new Error('Failed to classify image');
    }
  }

  async detectObjects(imageBuffer: Buffer): Promise<ObjectDetection[]> {
    await this.initialize();

    if (!this.cocoSsdModel) {
      throw new Error('COCO-SSD model not loaded');
    }

    try {
      const processedImage = await this.preprocessImage(imageBuffer);
      const tensor = tf.node.decodeImage(processedImage, 3);

      const predictions = await this.cocoSsdModel.detect(tensor as tf.Tensor3D);

      tensor.dispose();

      return predictions.map(pred => ({
        class: pred.class,
        score: pred.score,
        bbox: pred.bbox as [number, number, number, number]
      }));
    } catch (error) {
      logger.error('Object detection error:', error);
      throw new Error('Failed to detect objects');
    }
  }

  async analyzeImage(imageBuffer: Buffer, detectObjects = true): Promise<RecognitionResult> {
    const startTime = Date.now();

    try {
      // Classify image
      const classifications = await this.classifyImage(imageBuffer);

      // Detect objects (optional)
      let objects: ObjectDetection[] | undefined;
      if (detectObjects) {
        objects = await this.detectObjects(imageBuffer);
      }

      // Extract dominant category
      const dominantCategory = classifications[0]?.className.split(',')[0].trim();

      // Generate suggested tags
      const suggestedTags = this.generateTags(classifications, objects);

      const processingTime = Date.now() - startTime;

      return {
        imageUrl: '',
        classifications: classifications.slice(0, 5), // Top 5
        objects,
        dominantCategory,
        suggestedTags,
        processingTime
      };
    } catch (error) {
      logger.error('Image analysis error:', error);
      throw error;
    }
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // Resize and normalize image
    return await sharp(imageBuffer)
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .toBuffer();
  }

  private generateTags(
    classifications: ImageClassification[],
    objects?: ObjectDetection[]
  ): string[] {
    const tags = new Set<string>();

    // Add classification tags
    classifications.slice(0, 3).forEach(cls => {
      const words = cls.className.split(',')[0].trim().split(' ');
      words.forEach(word => {
        if (word.length > 2) {
          tags.add(word.toLowerCase());
        }
      });
    });

    // Add object detection tags
    if (objects) {
      objects.forEach(obj => {
        if (obj.score > 0.5) {
          tags.add(obj.class.toLowerCase());
        }
      });
    }

    return Array.from(tags).slice(0, 10);
  }

  async findSimilarProducts(imageBuffer: Buffer): Promise<any[]> {
    // Extract image features
    const classifications = await this.classifyImage(imageBuffer);
    const dominantCategory = classifications[0]?.className.split(',')[0].trim();

    // TODO: Query product database for similar items
    // This would integrate with your product service
    logger.info(`Finding products similar to: ${dominantCategory}`);

    return [];
  }

  getCategoryMapping(className: string): string {
    // Map ML classifications to product categories
    const categoryMap: Record<string, string> = {
      'laptop': 'Electronics',
      'notebook': 'Electronics',
      'computer': 'Electronics',
      'phone': 'Electronics',
      'mobile': 'Electronics',
      'shoe': 'Fashion',
      'sneaker': 'Fashion',
      'boot': 'Fashion',
      'shirt': 'Fashion',
      'dress': 'Fashion',
      'book': 'Books',
      'furniture': 'Home & Garden',
      'chair': 'Home & Garden',
      'table': 'Home & Garden',
      'watch': 'Accessories',
      'bag': 'Accessories',
      'backpack': 'Accessories'
    };

    const lowerClass = className.toLowerCase();
    for (const [key, category] of Object.entries(categoryMap)) {
      if (lowerClass.includes(key)) {
        return category;
      }
    }

    return 'Other';
  }
}
